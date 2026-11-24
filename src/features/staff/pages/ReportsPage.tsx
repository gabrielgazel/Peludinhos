import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BarChart3, CalendarRange, Download, Package, PawPrint } from 'lucide-react';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { cn } from '../../../shared/lib/utils';
import { formatDate, formatKg } from '../../../shared/utils/format';
import { SelectField } from '../../../shared/components/SelectField';
import { TextField } from '../../../shared/components/TextField';
import { animalService } from '../../animals/services/animalService';
import type { AnimalStatus } from '../../animals/types/animal.types';
import {
  feedingPointService,
  type FeedingPointAnimal,
} from '../services/feedingPointService';
import { foodService, type Food } from '../services/foodService';
import { reportService } from '../services/reportService';
import type { ReportRow } from '../types/report.types';
import {
  buildOccurrenceCsv,
  buildOccurrenceRows,
  buildSupplyCsv,
  buildSupplyRows,
  decimal,
  monthLabel,
} from '../utils/reportRows';
import { csvFilename, downloadCsv, toCsvFile, type CsvField } from '../utils/csv';
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

type PeriodPreset = '7' | '30' | '90' | 'custom';

const PERIOD_PRESETS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Personalizado' },
];

const PRESET_DAYS: Record<Exclude<PeriodPreset, 'custom'>, number> = {
  '7': 7,
  '30': 30,
  '90': 90,
};

const HIGH_LIMIT = 200;

const EXPORT_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Preset: de `hoje - (n - 1)` até hoje, intervalo fechado nos dois extremos. */
function periodFor(preset: Exclude<PeriodPreset, 'custom'>): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (PRESET_DAYS[preset] - 1));
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Animais sem `createdAt` entram em qualquer período: não há como provar que
 * são antigos, e excluí-los esconderia vínculos reais da demo.
 */
function createdWithin(createdAt: string | null | undefined, from: string, to: string): boolean {
  if (!createdAt || !from || !to) return true;
  const day = createdAt.slice(0, 10);
  return day >= from && day <= to;
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
  exportButton?: ReactNode;
  children: ReactNode;
};

function ReportSection({
  id,
  title,
  subtitle,
  total,
  totalLabel,
  exportButton,
  children,
}: ReportSectionProps) {
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
          <div className="flex shrink-0 flex-col items-end gap-2">
            {total ? (
              <p className="text-right">
                <span className="block text-2xl font-bold text-staff-ink">{total}</span>
                {totalLabel ? (
                  <span className="text-xs font-semibold tracking-[0.04em] text-staff-muted uppercase">
                    {totalLabel}
                  </span>
                ) : null}
              </p>
            ) : null}
            {exportButton}
          </div>
        </div>
        {children}
      </section>
    </Panel>
  );
}

export function ReportsPage() {
  const [preset, setPreset] = useState<PeriodPreset>('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const period = useMemo(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo };
    return periodFor(preset);
  }, [preset, customFrom, customTo]);

  const rangeError: string | null =
    period.from && period.to && period.from > period.to
      ? 'A data inicial não pode ser posterior à data final.'
      : null;

  // Com intervalo inválido (ou personalizado ainda sem datas) não disparamos
  // novas buscas: evita custo e mantém os painéis no último estado válido.
  const activeFrom = rangeError ? '' : period.from;
  const activeTo = rangeError ? '' : period.to;

  const periodLabel =
    activeFrom && activeTo ? `${formatDate(activeFrom)} a ${formatDate(activeTo)}` : null;

  // Os três painéis novos usam o mesmo filtro, mas só buscam com datas válidas.
  const [reportPeriod, setReportPeriod] = useState<{ from: string; to: string }>({
    from: activeFrom,
    to: activeTo,
  });

  useEffect(() => {
    if (!activeFrom || !activeTo) return;
    // Só o efeito pode preservar o último período válido quando o filtro fica inválido.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReportPeriod((current) =>
      current.from === activeFrom && current.to === activeTo
        ? current
        : { from: activeFrom, to: activeTo },
    );
  }, [activeFrom, activeTo]);

  // Os novos painéis mostram o período da última busca válida, mesmo quando o
  // filtro está invertido; o filtro e os relatórios 1-3 continuam usando periodLabel.
  const reportPeriodLabel =
    reportPeriod.from && reportPeriod.to
      ? `${formatDate(reportPeriod.from)} a ${formatDate(reportPeriod.to)}`
      : null;

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
    const csvRows: CsvField[][] = [
      ['Status', 'Quantidade'],
      ...STATUS_ORDER.map((status) => [ANIMAL_STATUS_LABEL[status], counts.get(status) ?? 0]),
    ];
    return { total, rows, csvRows };
  }, [statusData.data]);

  /** Data de criação por animal, usada para recortar o relatório de pontos. */
  const createdAtById = useMemo(() => {
    const map = new Map<number, string | null>();
    for (const animal of statusData.data?.items ?? []) map.set(animal.id, animal.createdAt);
    return map;
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
    const links = (pointsData.data ?? []).map((link) => ({
      point: link.point,
      animals: link.animals.filter((animal) =>
        createdWithin(createdAtById.get(animal.animalId), activeFrom, activeTo),
      ),
    }));
    const total = links.reduce((sum, link) => sum + link.animals.length, 0);
    const max = links.reduce((top, link) => Math.max(top, link.animals.length), 0);
    const sorted = [...links].sort(
      (a, b) =>
        b.animals.length - a.animals.length || a.point.name.localeCompare(b.point.name, 'pt-BR'),
    );
    const rows: ReportRow[] = sorted.map(({ point, animals }) => ({
      key: String(point.id),
      label: point.name,
      value: plural(animals.length, 'animal', 'animais'),
      detail:
        animals.length > 0
          ? shortNames(animals)
          : 'Sem vínculos no período.',
      badge: point.isActive ? undefined : <StatusBadge tone="gray">Inativo</StatusBadge>,
      ratio: max > 0 ? animals.length / max : 0,
      tone: 'green' as BadgeTone,
    }));
    const csvRows: CsvField[][] = [
      ['Ponto', 'Animais vinculados', 'Animais'],
      ...sorted.map(({ point, animals }) => [
        point.name,
        animals.length,
        animals.map((animal) => animal.name).join(', '),
      ]),
    ];
    return { total, rows, csvRows };
  }, [pointsData.data, createdAtById, activeFrom, activeTo]);

  const consumptionData = useAsyncData(async () => {
    if (!activeFrom || !activeTo) return { movements: [], foods: [] as Food[] };
    const [movementsPage, foodsPage] = await Promise.all([
      foodService.listAllMovements({ from: activeFrom, to: activeTo, limit: HIGH_LIMIT }),
      foodService.list({ limit: HIGH_LIMIT }),
    ]);
    return { movements: movementsPage.items, foods: foodsPage.items };
  }, [activeFrom, activeTo]);

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

    const csvRows: CsvField[][] = [
      ['Tipo', 'Item', 'Consumo (kg)'],
      ...foodEntries.map((entry) => ['Ração', entry.label, decimal(entry.kg)]),
      ...monthEntries.map((entry) => ['Mês', monthLabel(entry.month), decimal(entry.kg)]),
      ['Total', '', decimal(total)],
    ];

    return { total, foodRows, monthRows, csvRows };
  }, [consumptionData.data]);

  const occurrencesData = useAsyncData(
    () => reportService.getOccurrencesByMonth(reportPeriod),
    [reportPeriod.from, reportPeriod.to],
  );
  const medicationData = useAsyncData(
    () => reportService.getSupplyConsumption({ ...reportPeriod, kind: 'medication' }),
    [reportPeriod.from, reportPeriod.to],
  );
  const productData = useAsyncData(
    () => reportService.getSupplyConsumption({ ...reportPeriod, kind: 'product' }),
    [reportPeriod.from, reportPeriod.to],
  );

  const occurrenceReport = useMemo(() => {
    const data = occurrencesData.data;
    return {
      total: data?.total ?? 0,
      rows: data ? buildOccurrenceRows(data) : [],
      csvRows: data ? buildOccurrenceCsv(data) : [],
      hasData: Boolean(data && data.total > 0 && data.months.length > 0),
    };
  }, [occurrencesData.data]);

  const medicationReport = useMemo(() => {
    const data = medicationData.data;
    return {
      total: data?.items.length ?? 0,
      rows: data ? buildSupplyRows(data) : [],
      csvRows: data ? buildSupplyCsv(data) : [],
      hasData: Boolean(data && data.items.length > 0),
    };
  }, [medicationData.data]);

  const productReport = useMemo(() => {
    const data = productData.data;
    return {
      total: data?.items.length ?? 0,
      rows: data ? buildSupplyRows(data) : [],
      csvRows: data ? buildSupplyCsv(data) : [],
      hasData: Boolean(data && data.items.length > 0),
    };
  }, [productData.data]);

  const occurrenceSubtitle = reportPeriodLabel
    ? `Ocorrências agrupadas por mês (${reportPeriodLabel}).`
    : 'Ocorrências agrupadas por mês no período selecionado.';
  const medicationSubtitle = reportPeriodLabel
    ? `Consumo de medicamentos no período (${reportPeriodLabel}).`
    : 'Consumo de medicamentos no período selecionado.';
  const productSubtitle = reportPeriodLabel
    ? `Consumo de produtos no período (${reportPeriodLabel}).`
    : 'Consumo de produtos no período selecionado.';

  function exportCsv(slug: string, rows: CsvField[][]) {
    downloadCsv(csvFilename(slug), toCsvFile(rows));
  }

  const consumed = consumptionReport.total > 0;
  const pointsSubtitle =
    activeFrom && activeTo
      ? `Animais criados entre ${formatDate(activeFrom)} e ${formatDate(activeTo)} vinculados a cada ponto de alimentação.`
      : 'Selecione um período para ver os vínculos.';

  return (
    <div className="space-y-6">
      <PageHead
        title="Relatórios"
        subtitle="Indicadores calculados a partir das listas do painel, sem endpoint novo."
      />

      <Panel className="min-w-0">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-56">
            <SelectField
              id="periodo"
              label="Período"
              value={preset}
              onChange={(value) => setPreset(value as PeriodPreset)}
              options={PERIOD_PRESETS}
            />
          </div>
          {preset === 'custom' ? (
            <>
              <div className="w-full sm:w-44">
                <TextField
                  id="periodo-inicial"
                  label="Data inicial"
                  type="date"
                  value={customFrom}
                  onChange={setCustomFrom}
                />
              </div>
              <div className="w-full sm:w-44">
                <TextField
                  id="periodo-final"
                  label="Data final"
                  type="date"
                  value={customTo}
                  onChange={setCustomTo}
                />
              </div>
            </>
          ) : null}
          <p className="flex items-center gap-2 pb-2 text-sm text-staff-muted">
            <CalendarRange size={16} aria-hidden="true" />
            {rangeError ? 'Ajuste as datas para continuar.' : periodLabel ? `Intervalo: ${periodLabel}` : 'Intervalo não definido.'}
          </p>
        </div>
        {rangeError ? (
          <div className="mt-3">
            <Alert variant="danger">{rangeError}</Alert>
          </div>
        ) : null}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportSection
          id="relatorio-status"
          title="Animais por status"
          subtitle="Distribuição de todos os animais cadastrados."
          total={
            statusData.loading || statusData.error
              ? undefined
              : plural(statusReport.total, 'animal', 'animais')
          }
          totalLabel="no total"
          exportButton={
            !statusData.loading && !statusData.error && statusReport.total > 0 ? (
              <button
                type="button"
                className={EXPORT_BUTTON}
                onClick={() => exportCsv('animais-por-status', statusReport.csvRows)}
              >
                <Download size={16} aria-hidden="true" />
                Exportar CSV
              </button>
            ) : undefined
          }
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
          subtitle={pointsSubtitle}
          total={
            pointsData.loading || pointsData.error
              ? undefined
              : plural(pointsReport.total, 'vínculo', 'vínculos')
          }
          totalLabel="no total"
          exportButton={
            !pointsData.loading && !pointsData.error && pointsReport.total > 0 ? (
              <button
                type="button"
                className={EXPORT_BUTTON}
                onClick={() => exportCsv('animais-por-ponto', pointsReport.csvRows)}
              >
                <Download size={16} aria-hidden="true" />
                Exportar CSV
              </button>
            ) : undefined
          }
        >
          {pointsData.loading ? (
            <EmptyState>Carregando pontos...</EmptyState>
          ) : pointsData.error ? (
            <div className="mt-4">
              <Alert variant="danger">{pointsData.error}</Alert>
            </div>
          ) : pointsReport.rows.length === 0 ? (
            <EmptyState>Nenhum ponto de alimentação cadastrado.</EmptyState>
          ) : pointsReport.total === 0 ? (
            <EmptyState>Nenhum animal vinculado no período.</EmptyState>
          ) : (
            <ReportRowList rows={pointsReport.rows} />
          )}
        </ReportSection>

        <div className="lg:col-span-2">
          <ReportSection
            id="relatorio-consumo"
            title="Consumo de ração"
            subtitle={
              periodLabel
                ? `Soma das movimentações de consumo no período (${periodLabel}).`
                : 'Soma das movimentações de consumo no período selecionado.'
            }
            total={consumed ? formatKg(consumptionReport.total) : undefined}
            totalLabel="no período"
            exportButton={
              !consumptionData.loading && !consumptionData.error && consumed ? (
                <button
                  type="button"
                  className={EXPORT_BUTTON}
                  onClick={() => exportCsv('consumo-racao', consumptionReport.csvRows)}
                >
                  <Download size={16} aria-hidden="true" />
                  Exportar CSV
                </button>
              ) : undefined
            }
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportSection
          id="relatorio-ocorrencias-mensais"
          title="Ocorrências mensais"
          subtitle={occurrenceSubtitle}
          total={
            occurrencesData.loading || occurrencesData.error
              ? undefined
              : plural(occurrenceReport.total, 'ocorrência', 'ocorrências')
          }
          totalLabel="no período"
          exportButton={
            !occurrencesData.loading && !occurrencesData.error && occurrenceReport.hasData ? (
              <button
                type="button"
                className={EXPORT_BUTTON}
                onClick={() => exportCsv('ocorrencias-mensais', occurrenceReport.csvRows)}
              >
                <Download size={16} aria-hidden="true" />
                Exportar CSV
              </button>
            ) : undefined
          }
        >
          {occurrencesData.loading ? (
            <EmptyState>Carregando ocorrências...</EmptyState>
          ) : occurrencesData.error ? (
            <div className="mt-4">
              <Alert variant="danger">
                {occurrencesData.error ?? 'Não foi possível carregar as ocorrências.'}
              </Alert>
            </div>
          ) : !occurrenceReport.hasData ? (
            <EmptyState>Nenhuma ocorrência no período.</EmptyState>
          ) : (
            <ReportRowList rows={occurrenceReport.rows} />
          )}
        </ReportSection>

        <ReportSection
          id="relatorio-medicamentos"
          title="Medicamentos"
          subtitle={medicationSubtitle}
          total={
            medicationData.loading || medicationData.error
              ? undefined
              : plural(medicationReport.total, 'item', 'itens')
          }
          totalLabel="no período"
          exportButton={
            !medicationData.loading && !medicationData.error && medicationReport.hasData ? (
              <button
                type="button"
                className={EXPORT_BUTTON}
                onClick={() => exportCsv('medicamentos', medicationReport.csvRows)}
              >
                <Download size={16} aria-hidden="true" />
                Exportar CSV
              </button>
            ) : undefined
          }
        >
          {medicationData.loading ? (
            <EmptyState>Carregando medicamentos...</EmptyState>
          ) : medicationData.error ? (
            <div className="mt-4">
              <Alert variant="danger">
                {medicationData.error ?? 'Não foi possível carregar os medicamentos.'}
              </Alert>
            </div>
          ) : !medicationReport.hasData ? (
            <EmptyState>Nenhum medicamento consumido no período.</EmptyState>
          ) : (
            <ReportRowList rows={medicationReport.rows} />
          )}
        </ReportSection>

        <ReportSection
          id="relatorio-produtos"
          title="Produtos"
          subtitle={productSubtitle}
          total={
            productData.loading || productData.error
              ? undefined
              : plural(productReport.total, 'item', 'itens')
          }
          totalLabel="no período"
          exportButton={
            !productData.loading && !productData.error && productReport.hasData ? (
              <button
                type="button"
                className={EXPORT_BUTTON}
                onClick={() => exportCsv('produtos', productReport.csvRows)}
              >
                <Download size={16} aria-hidden="true" />
                Exportar CSV
              </button>
            ) : undefined
          }
        >
          {productData.loading ? (
            <EmptyState>Carregando produtos...</EmptyState>
          ) : productData.error ? (
            <div className="mt-4">
              <Alert variant="danger">
                {productData.error ?? 'Não foi possível carregar os produtos.'}
              </Alert>
            </div>
          ) : !productReport.hasData ? (
            <EmptyState>Nenhum produto consumido no período.</EmptyState>
          ) : (
            <ReportRowList rows={productReport.rows} />
          )}
        </ReportSection>
      </div>

      <p className="flex items-center gap-2 text-sm text-staff-muted">
        <PawPrint size={16} aria-hidden="true" />
        Os números são recalculados a cada visita; nenhuma informação é gravada.
      </p>
    </div>
  );
}
