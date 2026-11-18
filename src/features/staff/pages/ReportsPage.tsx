import { useMemo, type ReactNode } from 'react';
import { BarChart3, Package, PawPrint } from 'lucide-react';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { cn } from '../../../shared/lib/utils';
import { formatDate, formatKg } from '../../../shared/utils/format';
import { animalService } from '../../animals/services/animalService';
import type { AnimalStatus } from '../../animals/types/animal.types';
import {
  feedingPointService,
  type FeedingPointAnimal,
} from '../services/feedingPointService';
import { foodService, type Food } from '../services/foodService';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { ANIMAL_STATUS_LABEL, ANIMAL_STATUS_TONE, type BadgeTone } from '../utils/badges';

/** Ordem fixa dos status nos relatórios (mesma da ficha do animal). */
const STATUS_ORDER: AnimalStatus[] = [
  'disponivel',
  'em_processo',
  'adotado',
  'indisponivel',
];

/**
 * Janela padrão do relatório de consumo: os últimos 6 meses (incluindo o
 * atual), contados a partir do primeiro dia do mês. A D4.2 troca isso pelo
 * filtro de período compartilhado no topo da página.
 */
const PERIOD_MONTHS = 6;

const HIGH_LIMIT = 200;

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function defaultPeriod(now: Date = new Date()): { from: string; to: string } {
  const from = new Date(now.getFullYear(), now.getMonth() - (PERIOD_MONTHS - 1), 1);
  return { from: toIsoDate(from), to: toIsoDate(now) };
}

/** Rótulo do mês (`AAAA-MM`) por extenso, ex.: "novembro de 2026". */
function monthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthNumber - 1, 1),
  );
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Lista nominal curta: até 3 nomes e, se houver mais, "+N". */
function shortNames(animals: FeedingPointAnimal[]): string {
  const names = animals.map((animal) => animal.name);
  if (names.length === 0) return '';
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} +${names.length - 3}`;
}

/** Barra horizontal em CSS puro; o texto ao lado carrega o número real. */
function Bar({ ratio, tone }: { ratio: number; tone: BadgeTone }) {
  const width = Math.max(0, Math.min(100, ratio * 100));
  const toneClass =
    tone === 'green'
      ? 'bg-staff-success'
      : tone === 'amber'
        ? 'bg-staff-accent'
        : tone === 'red'
          ? 'bg-staff-danger'
          : 'bg-staff-muted';
  return (
    <div aria-hidden="true" className="h-2.5 w-full overflow-hidden rounded-full bg-staff-bg">
      <div className={cn('h-full rounded-full', toneClass)} style={{ width: `${width}%` }} />
    </div>
  );
}

type ReportRow = {
  key: string;
  label: string;
  /** Valor já formatado para leitura (ex.: "3 animais", "7,5 kg"). */
  value: string;
  detail?: string;
  badge?: ReactNode;
  ratio: number;
  tone: BadgeTone;
};

function ReportRowList({ rows }: { rows: ReportRow[] }) {
  return (
    <ul className="mt-4 space-y-4">
      {rows.map((row) => (
        <li key={row.key} className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-semibold text-staff-ink">{row.label}</span>
              {row.badge}
            </div>
            <span className="shrink-0 text-sm font-bold text-staff-ink">{row.value}</span>
          </div>
          <Bar ratio={row.ratio} tone={row.tone} />
          {row.detail ? <p className="text-sm text-staff-muted">{row.detail}</p> : null}
        </li>
      ))}
    </ul>
  );
}

type ReportSectionProps = {
  id: string;
  title: string;
  subtitle: string;
  total?: string;
  totalLabel?: string;
  children: ReactNode;
};

function ReportSection({ id, title, subtitle, total, totalLabel, children }: ReportSectionProps) {
  return (
    <Panel className="min-w-0">
      <section aria-labelledby={id} className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={id} className="text-lg font-semibold text-staff-ink">
              {title}
            </h2>
            <p className="mt-1 text-sm text-staff-muted">{subtitle}</p>
          </div>
          {total ? (
            <p className="shrink-0 text-right">
              <span className="block text-2xl font-bold text-staff-ink">{total}</span>
              {totalLabel ? (
                <span className="text-xs font-semibold tracking-[0.04em] text-staff-muted uppercase">
                  {totalLabel}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        {children}
      </section>
    </Panel>
  );
}

export function ReportsPage() {
  const statusData = useAsyncData(() => animalService.list({ limit: HIGH_LIMIT }), []);

  const statusReport = useMemo(() => {
    const items = statusData.data?.items ?? [];
    const counts = new Map<AnimalStatus, number>();
    for (const status of STATUS_ORDER) counts.set(status, 0);
    for (const animal of items) {
      counts.set(animal.status, (counts.get(animal.status) ?? 0) + 1);
    }
    const total = items.length;
    const rows: ReportRow[] = STATUS_ORDER.map((status) => {
      const count = counts.get(status) ?? 0;
      return {
        key: status,
        label: ANIMAL_STATUS_LABEL[status],
        value: plural(count, 'animal', 'animais'),
        ratio: total > 0 ? count / total : 0,
        tone: ANIMAL_STATUS_TONE[status],
      };
    });
    return { total, rows };
  }, [statusData.data]);

  const pointsData = useAsyncData(async () => {
    const page = await feedingPointService.list({ limit: HIGH_LIMIT });
    const links = await Promise.all(
      page.items.map(async (point) => ({
        point,
        animals: await feedingPointService.listAnimals(point.id),
      })),
    );
    return links;
  }, []);

  const pointsReport = useMemo(() => {
    const links = pointsData.data ?? [];
    const total = links.reduce((sum, link) => sum + link.animals.length, 0);
    const max = links.reduce((top, link) => Math.max(top, link.animals.length), 0);
    const rows: ReportRow[] = [...links]
      .sort(
        (a, b) =>
          b.animals.length - a.animals.length || a.point.name.localeCompare(b.point.name, 'pt-BR'),
      )
      .map(({ point, animals }) => ({
        key: String(point.id),
        label: point.name,
        value: plural(animals.length, 'animal', 'animais'),
        detail: animals.length > 0 ? shortNames(animals) : 'Nenhum animal vinculado.',
        badge: point.isActive ? undefined : <StatusBadge tone="gray">Inativo</StatusBadge>,
        ratio: max > 0 ? animals.length / max : 0,
        tone: 'green' as BadgeTone,
      }));
    return { total, rows };
  }, [pointsData.data]);

  const period = useMemo(() => defaultPeriod(), []);

  const consumptionData = useAsyncData(async () => {
    const [movementsPage, foodsPage] = await Promise.all([
      foodService.listAllMovements({ ...period, limit: HIGH_LIMIT }),
      foodService.list({ limit: HIGH_LIMIT }),
    ]);
    return { movements: movementsPage.items, foods: foodsPage.items };
  }, [period.from, period.to]);

  const consumptionReport = useMemo(() => {
    const movements = consumptionData.data?.movements ?? [];
    const foods = consumptionData.data?.foods ?? [];
    const nameById = new Map<number, string>(foods.map((food: Food) => [food.id, food.name]));

    const byFood = new Map<number, number>();
    const byMonth = new Map<string, number>();
    let total = 0;

    for (const movement of movements) {
      if (movement.kind !== 'consumo') continue;
      total += movement.quantityKg;
      byFood.set(movement.foodId, (byFood.get(movement.foodId) ?? 0) + movement.quantityKg);
      const month = movement.movementDate.slice(0, 7);
      byMonth.set(month, (byMonth.get(month) ?? 0) + movement.quantityKg);
    }

    const foodEntries = Array.from(byFood, ([foodId, kg]) => ({
      key: `food-${foodId}`,
      label: nameById.get(foodId) ?? `Ração #${foodId}`,
      kg,
    })).sort((a, b) => b.kg - a.kg || a.label.localeCompare(b.label, 'pt-BR'));

    const monthEntries = Array.from(byMonth, ([month, kg]) => ({ key: month, month, kg })).sort(
      (a, b) => b.month.localeCompare(a.month),
    );

    const foodMax = foodEntries.reduce((top, entry) => Math.max(top, entry.kg), 0);
    const monthMax = monthEntries.reduce((top, entry) => Math.max(top, entry.kg), 0);

    const foodRows: ReportRow[] = foodEntries.map((entry) => ({
      key: entry.key,
      label: entry.label,
      value: formatKg(entry.kg),
      ratio: foodMax > 0 ? entry.kg / foodMax : 0,
      tone: 'amber',
    }));

    const monthRows: ReportRow[] = monthEntries.map((entry) => ({
      key: entry.key,
      label: monthLabel(entry.month),
      value: formatKg(entry.kg),
      ratio: monthMax > 0 ? entry.kg / monthMax : 0,
      tone: 'green',
    }));

    return { total, foodRows, monthRows };
  }, [consumptionData.data]);

  const periodLabel = `${formatDate(period.from)} a ${formatDate(period.to)}`;
  const consumed = consumptionReport.total > 0;

  return (
    <div className="space-y-6">
      <PageHead
        title="Relatórios"
        subtitle="Indicadores calculados a partir das listas do painel, sem endpoint novo."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportSection
          id="relatorio-status"
          title="Animais por status"
          subtitle="Distribuição de todos os animais cadastrados."
          total={statusData.loading || statusData.error ? undefined : plural(statusReport.total, 'animal', 'animais')}
          totalLabel="no total"
        >
          {statusData.loading ? (
            <EmptyState>Carregando animais...</EmptyState>
          ) : statusData.error ? (
            <div className="mt-4">
              <Alert variant="danger">{statusData.error}</Alert>
            </div>
          ) : statusReport.total === 0 ? (
            <EmptyState>Nenhum animal cadastrado.</EmptyState>
          ) : (
            <ReportRowList rows={statusReport.rows} />
          )}
        </ReportSection>

        <ReportSection
          id="relatorio-pontos"
          title="Animais por ponto"
          subtitle="Quantos animais estão vinculados a cada ponto de alimentação."
          total={pointsData.loading || pointsData.error ? undefined : plural(pointsReport.total, 'vínculo', 'vínculos')}
          totalLabel="no total"
        >
          {pointsData.loading ? (
            <EmptyState>Carregando pontos...</EmptyState>
          ) : pointsData.error ? (
            <div className="mt-4">
              <Alert variant="danger">{pointsData.error}</Alert>
            </div>
          ) : pointsReport.rows.length === 0 ? (
            <EmptyState>Nenhum ponto de alimentação cadastrado.</EmptyState>
          ) : (
            <ReportRowList rows={pointsReport.rows} />
          )}
        </ReportSection>

        <div className="lg:col-span-2">
          <ReportSection
            id="relatorio-consumo"
            title="Consumo de ração"
            subtitle={`Soma das movimentações de consumo nos últimos ${PERIOD_MONTHS} meses (${periodLabel}).`}
            total={consumed ? formatKg(consumptionReport.total) : undefined}
            totalLabel="no período"
          >
            {consumptionData.loading ? (
              <EmptyState>Carregando movimentações...</EmptyState>
            ) : consumptionData.error ? (
              <div className="mt-4">
                <Alert variant="danger">{consumptionData.error}</Alert>
              </div>
            ) : !consumed ? (
              <EmptyState>Nenhum consumo no período.</EmptyState>
            ) : (
              <div className="mt-2 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold tracking-[0.04em] text-staff-muted uppercase">
                    <Package size={16} aria-hidden="true" />
                    Por ração
                  </h3>
                  <ReportRowList rows={consumptionReport.foodRows} />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold tracking-[0.04em] text-staff-muted uppercase">
                    <BarChart3 size={16} aria-hidden="true" />
                    Por mês
                  </h3>
                  <ReportRowList rows={consumptionReport.monthRows} />
                </div>
              </div>
            )}
          </ReportSection>
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm text-staff-muted">
        <PawPrint size={16} aria-hidden="true" />
        Os números são recalculados a cada visita; nenhuma informação é gravada.
      </p>
    </div>
  );
}
