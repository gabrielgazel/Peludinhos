import { useState, type FormEvent } from 'react';
import { Package, Plus } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin } from '../../../shared/types/role.types';
import { HttpError } from '../../../shared/api/httpsClient';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { cn } from '../../../shared/lib/utils';
import { formatDate } from '../../../shared/utils/format';
import { TextField } from '../../../shared/components/TextField';
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
import { foodService, type Food } from '../services/foodService';

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

const PRIMARY_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

const SECONDARY_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyForm(): FormValues {
  return { name: '', weight: '', entryDate: todayIso() };
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
export function needsRestock(food: Food): boolean {
  return food.balanceKg < food.weightKg * 0.2;
}

/** Formata kg para exibição em pt-BR (até 2 casas, sem recalcular o valor). */
export function formatKg(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
}

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

  const { data, loading, error, reload } = useAsyncData(
    () => foodService.list({ limit: 200 }),
    [],
  );
  const foods = data?.items ?? [];

  function openCreate() {
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

  return (
    <div className="space-y-6">
      <PageHead
        title="Ração"
        subtitle="Acompanhe o estoque e registre as compras de ração."
        actions={
          admin ? (
            <button type="button" onClick={openCreate} className={PRIMARY_BUTTON}>
              <Plus size={16} aria-hidden="true" />
              Registrar compra
            </button>
          ) : undefined
        }
      />

      {(error || actionError) && !formOpen && (
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
            containerProps={{
              role: 'region',
              tabIndex: 0,
              'aria-label': 'Tabela de rações — role horizontalmente para ver todas as colunas',
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Peso inicial</TableHead>
                <TableHead>Saldo atual</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foods.map((food) => {
                const info = balanceInfo(food);
                return (
                  <TableRow key={food.id}>
                    <TableCell className="font-medium">{food.name}</TableCell>
                    <TableCell>{formatKg(food.weightKg)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'font-semibold',
                          info.tone === 'red' ? 'text-staff-danger' : 'text-staff-ink',
                        )}
                      >
                        {formatKg(food.balanceKg)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(food.entryDate)}</TableCell>
                    <TableCell>
                      <StatusBadge tone={info.tone}>{info.label}</StatusBadge>
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
