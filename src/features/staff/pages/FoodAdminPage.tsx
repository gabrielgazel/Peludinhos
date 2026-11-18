import { useMemo, useState, type FormEvent } from 'react';
import { History, Package, Plus, Utensils } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin } from '../../../shared/types/role.types';
import { HttpError } from '../../../shared/api/httpsClient';
import type { Page } from '../../../shared/api/types';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { cn } from '../../../shared/lib/utils';
import { formatDate, formatKg } from '../../../shared/utils/format';
import { TextField } from '../../../shared/components/TextField';
import { SelectField } from '../../../shared/components/SelectField';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/ui/table';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import type { BadgeTone } from '../utils/badges';
import {
  foodService,
  type Food,
  type FoodMovement,
  type FoodMovementKind,
} from '../services/foodService';
import {
  feedingPointService,
  type FeedingPoint,
} from '../services/feedingPointService';

interface FormValues {
  name: string;
  weight: string;
  entryDate: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const FIELD_ID: Record<keyof FormValues, string> = {
  name: 'food-name',
  weight: 'food-weight',
  entryDate: 'food-entry-date',
};

type PanelKind = 'consumo' | 'fim' | 'historico';

interface ConsumoValues {
  quantity: string;
  movementDate: string;
  feedingPointId: string;
  notes: string;
}

type ConsumoErrors = Partial<Record<'quantity' | 'movementDate', string>>;

const EMPTY_MOVEMENTS_PAGE: Page<FoodMovement> = {
  items: [],
  total: 0,
  limit: 200,
  offset: 0,
};

const EMPTY_POINTS_PAGE: Page<FeedingPoint> = {
  items: [],
  total: 0,
  limit: 200,
  offset: 0,
};

const MOVEMENT_KIND_LABEL: Record<FoodMovementKind, string> = {
  compra: 'Compra',
  consumo: 'Consumo',
  fim: 'Fim',
};

const MOVEMENT_KIND_TONE: Record<FoodMovementKind, BadgeTone> = {
  compra: 'green',
  consumo: 'gray',
  fim: 'amber',
};

const PRIMARY_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

const SECONDARY_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

/**
 * Abaixo de 768px a tabela vira uma pilha de cards: o cabeçalho some, cada
 * linha vira um bloco e cada célula ganha o rótulo da coluna via
 * `data-label` (pseudo-elemento), sem duplicar o conteúdo no DOM.
 */
const RESPONSIVE_ROW =
  'max-md:mb-3 max-md:block max-md:rounded-xl max-md:border max-md:border-staff-line max-md:bg-staff-surface max-md:p-4';

const RESPONSIVE_CELL =
  'max-md:flex max-md:items-center max-md:justify-between max-md:gap-3 max-md:border-0 max-md:p-1 max-md:whitespace-normal max-md:before:block max-md:before:text-xs max-md:before:font-bold max-md:before:tracking-[0.04em] max-md:before:text-staff-muted max-md:before:uppercase max-md:before:content-[attr(data-label)]';

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyForm(): FormValues {
  return { name: '', weight: '', entryDate: todayIso() };
}

function emptyConsumo(): ConsumoValues {
  return { quantity: '', movementDate: todayIso(), feedingPointId: '', notes: '' };
}

function parseWeight(value: string): number | 'invalid' {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return 'invalid';
  const num = Number(normalized);
  return Number.isFinite(num) && num > 0 ? num : 'invalid';
}

/**
 * Regra de reposição: saldo abaixo de 20% do peso inicial da compra.
 *
 * Escolhemos o percentual em vez do piso fixo de 5 kg porque acompanha o
 * tamanho de cada compra — uma ração de 10 kg alerta em 2 kg, uma de 40 kg
 * em 8 kg. O limite é estrito: exatamente 20% ainda conta como suficiente.
 */
function needsRestock(food: Food): boolean {
  return food.balanceKg < food.weightKg * 0.2;
}

/** Situação exibida para o saldo: sem estoque, reposição ou suficiente. */
function balanceInfo(food: Food): { tone: BadgeTone; label: string } {
  if (food.balanceKg <= 0) return { tone: 'red', label: 'Sem estoque' };
  if (needsRestock(food)) return { tone: 'amber', label: 'Reposição' };
  return { tone: 'green', label: 'Suficiente' };
}

export function FoodAdminPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);

  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [activeFood, setActiveFood] = useState<Food | null>(null);
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const [consumoValues, setConsumoValues] = useState<ConsumoValues>(emptyConsumo);
  const [consumoErrors, setConsumoErrors] = useState<ConsumoErrors>({});

  const { data, loading, error, reload } = useAsyncData(
    () => foodService.list({ limit: 200 }),
    [],
  );
  const foods = data?.items ?? [];

  const {
    data: movementsData,
    loading: historyLoading,
    error: historyError,
    reload: reloadHistory,
  } = useAsyncData(
    () =>
      activeFood
        ? foodService.listMovements(activeFood.id, { limit: 200 })
        : Promise.resolve(EMPTY_MOVEMENTS_PAGE),
    [activeFood?.id],
  );
  const movements = movementsData?.items ?? [];

  // Os pontos só são necessários quando um painel de movimentação está aberto.
  const { data: pointsData, loading: pointsLoading } = useAsyncData(
    () =>
      panel
        ? feedingPointService.list({ limit: 200 })
        : Promise.resolve(EMPTY_POINTS_PAGE),
    [panel],
  );

  const pointOptions = useMemo(
    () => (pointsData?.items ?? []).map((point) => ({
      value: String(point.id),
      label: point.name,
    })),
    [pointsData],
  );

  const pointNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const point of pointsData?.items ?? []) map.set(point.id, point.name);
    return map;
  }, [pointsData]);

  function openCreate() {
    setPanel(null);
    setActiveFood(null);
    setValues(emptyForm());
    setErrors({});
    setActionError(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setErrors({});
    setActionError(null);
  }

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate(): FormErrors {
    const found: FormErrors = {};
    if (values.name.trim().length === 0) {
      found.name = 'Informe o nome da ração.';
    }
    if (parseWeight(values.weight) === 'invalid') {
      found.weight = 'Informe um peso maior que zero.';
    }
    if (!values.entryDate) {
      found.entryDate = 'Informe a data de entrada.';
    }
    return found;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!admin) return;
    setActionError(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0] as keyof FormValues;
      document.getElementById(FIELD_ID[first])?.focus();
      return;
    }

    const weight = parseWeight(values.weight);
    if (weight === 'invalid') return;

    setSaving(true);
    try {
      await foodService.create({
        name: values.name.trim(),
        weightKg: weight,
        entryDate: values.entryDate,
      });
      setFormOpen(false);
      setValues(emptyForm());
      reload();
    } catch (err) {
      setActionError(
        err instanceof HttpError ? err.message : 'Não foi possível registrar a compra.',
      );
    } finally {
      setSaving(false);
    }
  }

  function openConsumo(food: Food) {
    setFormOpen(false);
    setActiveFood(food);
    setPanel('consumo');
    setConsumoValues(emptyConsumo());
    setConsumoErrors({});
    setActionError(null);
  }

  function openEnd(food: Food) {
    setFormOpen(false);
    setActiveFood(food);
    setPanel('fim');
    setConsumoErrors({});
    setActionError(null);
  }

  function openHistory(food: Food) {
    setFormOpen(false);
    setActiveFood(food);
    setPanel('historico');
    setConsumoErrors({});
    setActionError(null);
  }

  function closePanel() {
    if (saving) return;
    setPanel(null);
    setActiveFood(null);
    setConsumoErrors({});
    setActionError(null);
  }

  function setConsumoField<K extends keyof ConsumoValues>(
    key: K,
    value: ConsumoValues[K],
  ) {
    setConsumoValues((current) => ({ ...current, [key]: value }));
    if (key === 'quantity' || key === 'movementDate') {
      setConsumoErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function finishMovement() {
    setPanel(null);
    setActiveFood(null);
    setConsumoValues(emptyConsumo());
    setConsumoErrors({});
    reload();
    reloadHistory();
  }

  async function handleConsumo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeFood) return;
    setActionError(null);

    const found: ConsumoErrors = {};
    const quantity = parseWeight(consumoValues.quantity);
    if (quantity === 'invalid') {
      found.quantity = 'Informe uma quantidade maior que zero.';
    }
    if (!consumoValues.movementDate) {
      found.movementDate = 'Informe a data.';
    }
    setConsumoErrors(found);
    if (Object.keys(found).length > 0 || quantity === 'invalid') return;

    setSaving(true);
    try {
      await foodService.createMovement(activeFood.id, {
        kind: 'consumo',
        quantityKg: quantity,
        movementDate: consumoValues.movementDate,
        feedingPointId: consumoValues.feedingPointId
          ? Number(consumoValues.feedingPointId)
          : null,
        notes: consumoValues.notes.trim() ? consumoValues.notes.trim() : null,
      });
      finishMovement();
    } catch (err) {
      setActionError(
        err instanceof HttpError ? err.message : 'Não foi possível registrar o consumo.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleEnd() {
    if (!activeFood || saving) return;
    setActionError(null);
    setSaving(true);
    try {
      await foodService.createMovement(activeFood.id, {
        kind: 'fim',
        quantityKg: activeFood.balanceKg,
        movementDate: todayIso(),
      });
      finishMovement();
    } catch (err) {
      setActionError(
        err instanceof HttpError ? err.message : 'Não foi possível encerrar a ração.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Ração"
        subtitle="Acompanhe o estoque, registre compras, consumo e encerramentos."
        actions={
          admin ? (
            <button type="button" onClick={openCreate} className={PRIMARY_BUTTON}>
              <Plus size={16} aria-hidden="true" />
              Registrar compra
            </button>
          ) : undefined
        }
      />

      {(error || actionError) && !formOpen && panel === null && (
        <Alert variant="danger">{actionError ?? error}</Alert>
      )}

      {admin && formOpen && (
        <Panel>
          <div className="mb-4 flex items-center gap-2 text-staff-ink">
            <Package size={18} aria-hidden="true" />
            <h2 className="text-lg font-semibold">Registrar compra</h2>
          </div>

          {actionError && <Alert variant="danger">{actionError}</Alert>}

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField
                  id="food-name"
                  label="Nome"
                  required
                  value={values.name}
                  error={errors.name}
                  onChange={(value) => setField('name', value)}
                />
              </div>
              <TextField
                id="food-weight"
                label="Peso"
                required
                inputMode="numeric"
                placeholder="20"
                hint="Em quilogramas. Aceita vírgula."
                value={values.weight}
                error={errors.weight}
                onChange={(value) => setField('weight', value)}
              />
              <TextField
                id="food-entry-date"
                label="Data de entrada"
                type="date"
                required
                value={values.entryDate}
                error={errors.entryDate}
                onChange={(value) => setField('entryDate', value)}
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-staff-line pt-4">
              <button type="submit" className={PRIMARY_BUTTON} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar compra'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className={SECONDARY_BUTTON}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Panel>
      )}

      {panel === 'consumo' && activeFood && (
        <Panel>
          <div className="mb-4 flex items-center gap-2 text-staff-ink">
            <Utensils size={18} aria-hidden="true" />
            <h2 className="text-lg font-semibold">Registrar consumo</h2>
          </div>

          <p className="text-sm text-staff-muted">
            {activeFood.name} · saldo atual de {formatKg(activeFood.balanceKg)}
          </p>

          {actionError && <Alert variant="danger">{actionError}</Alert>}

          <form onSubmit={handleConsumo} noValidate className="mt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="consumo-quantity"
                label="Quantidade (kg)"
                required
                inputMode="numeric"
                placeholder="5"
                hint="Em quilogramas. Aceita vírgula."
                value={consumoValues.quantity}
                error={consumoErrors.quantity}
                onChange={(value) => setConsumoField('quantity', value)}
              />
              <TextField
                id="consumo-date"
                label="Data"
                type="date"
                required
                value={consumoValues.movementDate}
                error={consumoErrors.movementDate}
                onChange={(value) => setConsumoField('movementDate', value)}
              />
              <SelectField
                id="consumo-point"
                label="Ponto de alimentação"
                optional
                placeholder="Sem ponto vinculado"
                value={consumoValues.feedingPointId}
                options={pointOptions}
                hint={pointsLoading ? 'Carregando pontos...' : undefined}
                onChange={(value) => setConsumoField('feedingPointId', value)}
              />
              <div className="sm:col-span-2">
                <TextField
                  id="consumo-notes"
                  label="Observação"
                  optional
                  multiline
                  rows={3}
                  value={consumoValues.notes}
                  onChange={(value) => setConsumoField('notes', value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-staff-line pt-4">
              <button type="submit" className={PRIMARY_BUTTON} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar consumo'}
              </button>
              <button
                type="button"
                onClick={closePanel}
                className={SECONDARY_BUTTON}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Panel>
      )}

      {panel === 'fim' && activeFood && (
        <Panel>
          <div className="mb-4 flex items-center gap-2 text-staff-ink">
            <Package size={18} aria-hidden="true" />
            <h2 className="text-lg font-semibold">Encerrar ração</h2>
          </div>

          <p className="text-sm text-staff-muted">
            {activeFood.name} · saldo atual de {formatKg(activeFood.balanceKg)}
          </p>

          {actionError && <Alert variant="danger">{actionError}</Alert>}

          <div className="mt-4 space-y-3 rounded-xl border border-staff-line bg-staff-bg p-4">
            <p className="font-semibold text-staff-ink">
              Encerrar a ração {activeFood.name}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleEnd()}
                disabled={saving}
                className={PRIMARY_BUTTON}
              >
                {saving ? 'Encerrando...' : 'Confirmar encerramento'}
              </button>
              <button
                type="button"
                onClick={closePanel}
                disabled={saving}
                className={SECONDARY_BUTTON}
              >
                Cancelar
              </button>
            </div>
          </div>
        </Panel>
      )}

      {panel === 'historico' && activeFood && (
        <Panel>
          <div className="mb-4 flex items-center gap-2 text-staff-ink">
            <History size={18} aria-hidden="true" />
            <h2 className="text-lg font-semibold">Histórico de movimentações</h2>
          </div>

          <p className="text-sm text-staff-muted">Ração: {activeFood.name}</p>

          {actionError && <Alert variant="danger">{actionError}</Alert>}
          {historyError && <Alert variant="danger">{historyError}</Alert>}

          <div className="mt-4">
            {historyLoading ? (
              <EmptyState>Carregando histórico...</EmptyState>
            ) : movements.length === 0 ? (
              <EmptyState>Nenhuma movimentação registrada para esta ração.</EmptyState>
            ) : (
              <Table
                className="max-md:block"
                containerProps={{
                  role: 'region',
                  tabIndex: 0,
                  'aria-label':
                    'Histórico de movimentações — role horizontalmente para ver todas as colunas',
                }}
              >
                <TableHeader className="max-md:hidden">
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ponto</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="max-md:block">
                  {movements.map((movement) => (
                    <TableRow key={movement.id} className={RESPONSIVE_ROW}>
                      <TableCell className={RESPONSIVE_CELL} data-label="Tipo">
                        <StatusBadge tone={MOVEMENT_KIND_TONE[movement.kind]}>
                          {MOVEMENT_KIND_LABEL[movement.kind]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className={RESPONSIVE_CELL} data-label="Quantidade">
                        {formatKg(movement.quantityKg)}
                      </TableCell>
                      <TableCell className={RESPONSIVE_CELL} data-label="Data">
                        {formatDate(movement.movementDate)}
                      </TableCell>
                      <TableCell className={RESPONSIVE_CELL} data-label="Ponto">
                        {movement.feedingPointId
                          ? (pointNameById.get(movement.feedingPointId) ??
                            `Ponto #${movement.feedingPointId}`)
                          : '—'}
                      </TableCell>
                      <TableCell className={RESPONSIVE_CELL} data-label="Autor">
                        {movement.memberName}
                      </TableCell>
                      <TableCell className={RESPONSIVE_CELL} data-label="Observação">
                        {movement.notes ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-4">
            <button type="button" onClick={closePanel} className={SECONDARY_BUTTON}>
              Fechar
            </button>
          </div>
        </Panel>
      )}

      <Panel>
        {loading ? (
          <EmptyState>Carregando rações...</EmptyState>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : foods.length === 0 ? (
          <EmptyState>
            <p>Nenhuma ração cadastrada ainda.</p>
            {admin ? (
              <button type="button" onClick={openCreate} className={cn(PRIMARY_BUTTON, 'mt-4')}>
                <Plus size={16} aria-hidden="true" />
                Registrar primeira compra
              </button>
            ) : null}
          </EmptyState>
        ) : (
          <Table
            className="max-md:block"
            containerProps={{
              role: 'region',
              tabIndex: 0,
              'aria-label': 'Tabela de rações — role horizontalmente para ver todas as colunas',
            }}
          >
            <TableHeader className="max-md:hidden">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Peso inicial</TableHead>
                <TableHead>Saldo atual</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="max-md:block">
              {foods.map((food) => {
                const info = balanceInfo(food);
                return (
                  <TableRow key={food.id} className={RESPONSIVE_ROW}>
                    <TableCell className={cn(RESPONSIVE_CELL, 'font-medium')} data-label="Nome">
                      {food.name}
                    </TableCell>
                    <TableCell className={RESPONSIVE_CELL} data-label="Peso inicial">
                      {formatKg(food.weightKg)}
                    </TableCell>
                    <TableCell className={RESPONSIVE_CELL} data-label="Saldo atual">
                      <span
                        className={cn(
                          'font-semibold',
                          info.tone === 'red' ? 'text-staff-danger' : 'text-staff-ink',
                        )}
                      >
                        {formatKg(food.balanceKg)}
                      </span>
                    </TableCell>
                    <TableCell className={RESPONSIVE_CELL} data-label="Entrada">
                      {formatDate(food.entryDate)}
                    </TableCell>
                    <TableCell className={RESPONSIVE_CELL} data-label="Situação">
                      <StatusBadge tone={info.tone}>{info.label}</StatusBadge>
                    </TableCell>
                    <TableCell className={RESPONSIVE_CELL} data-label="Ações">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openHistory(food)}
                          className={cn(SECONDARY_BUTTON, 'px-3')}
                        >
                          <History size={16} aria-hidden="true" />
                          Histórico
                        </button>
                        <button
                          type="button"
                          onClick={() => openConsumo(food)}
                          className={cn(SECONDARY_BUTTON, 'px-3')}
                        >
                          <Utensils size={16} aria-hidden="true" />
                          Registrar consumo
                        </button>
                        {food.balanceKg > 0 ? (
                          <button
                            type="button"
                            onClick={() => openEnd(food)}
                            className={cn(SECONDARY_BUTTON, 'px-3')}
                          >
                            <Package size={16} aria-hidden="true" />
                            Encerrar ração
                          </button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
