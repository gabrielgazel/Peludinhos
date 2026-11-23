import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { cn } from '../../../shared/lib/utils';
import { isAdmin } from '../../../shared/types/role.types';
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
import {
  medicationService,
  type Medication,
  type SupplyPayload,
} from '../services/medicationService';
import { productService, type Product } from '../services/productService';

type SupplyKind = 'medication' | 'product';
type SupplyItem = Medication | Product;

interface SupplyForm {
  kind: SupplyKind;
  id?: number;
}

interface FormValues {
  name: string;
  type: string;
  quantity: string;
  unit: string;
  validity: string;
  point: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const PRIMARY_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

const SECONDARY_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

/**
 * Abaixo de 768px a tabela vira uma pilha de cards: o cabeçalho some, cada
 * linha vira um bloco e cada célula ganha o rótulo da coluna via `data-label`.
 */
const RESPONSIVE_ROW =
  'max-md:mb-3 max-md:block max-md:rounded-xl max-md:border max-md:border-staff-line max-md:bg-staff-surface max-md:p-4';

const RESPONSIVE_CELL =
  'max-md:flex max-md:items-center max-md:justify-between max-md:gap-3 max-md:border-0 max-md:p-1 max-md:whitespace-normal max-md:before:block max-md:before:text-xs max-md:before:font-bold max-md:before:tracking-[0.04em] max-md:before:text-staff-muted max-md:before:uppercase max-md:before:content-[attr(data-label)]';

function emptyForm(): FormValues {
  return { name: '', type: '', quantity: '', unit: '', validity: '', point: '', notes: '' };
}

function formFromItem(item: SupplyItem): FormValues {
  return {
    name: item.name,
    type: item.type,
    quantity: String(item.quantity),
    unit: item.unit,
    validity: item.validity ?? '',
    point: item.point,
    notes: item.notes ?? '',
  };
}

/** Aceita zero e vírgula decimal; devolve null para entrada vazia ou inválida. */
function parseQuantity(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function validate(values: FormValues): FormErrors {
  const found: FormErrors = {};
  if (!values.name.trim()) found.name = 'Informe o nome do insumo.';
  if (!values.type.trim()) found.type = 'Informe o tipo do insumo.';
  if (parseQuantity(values.quantity) === null) {
    found.quantity = 'Informe uma quantidade maior ou igual a zero.';
  }
  if (!values.unit.trim()) found.unit = 'Informe a unidade.';
  if (!values.point.trim()) found.point = 'Informe o ponto/uso.';
  return found;
}

function toPayload(values: FormValues): SupplyPayload {
  return {
    name: values.name.trim(),
    type: values.type.trim(),
    quantity: parseQuantity(values.quantity) ?? 0,
    unit: values.unit.trim(),
    point: values.point.trim(),
    validity: values.validity.trim() || null,
    notes: values.notes.trim() || null,
  };
}

/** No PATCH só enviamos o que mudou em relação aos valores carregados. */
function changedFields(payload: SupplyPayload, original: FormValues): Partial<SupplyPayload> {
  const changes: Partial<SupplyPayload> = {};
  if (payload.name !== original.name.trim()) changes.name = payload.name;
  if (payload.type !== original.type.trim()) changes.type = payload.type;
  if (payload.quantity !== (parseQuantity(original.quantity) ?? 0)) {
    changes.quantity = payload.quantity;
  }
  if (payload.unit !== original.unit.trim()) changes.unit = payload.unit;
  if (payload.point !== original.point.trim()) changes.point = payload.point;
  if (payload.validity !== (original.validity.trim() || null)) {
    changes.validity = payload.validity;
  }
  if (payload.notes !== (original.notes.trim() || null)) changes.notes = payload.notes;
  return changes;
}

interface SupplySectionProps {
  id: string;
  title: string;
  items: SupplyItem[];
  loading: boolean;
  error: string | null;
  admin: boolean;
  newLabel: string;
  onNew: () => void;
  onEdit: (item: SupplyItem) => void;
}

function SupplySection({
  id,
  title,
  items,
  loading,
  error,
  admin,
  newLabel,
  onNew,
  onEdit,
}: SupplySectionProps) {
  const singular = title === 'Medicamentos' ? 'medicamento' : 'produto';

  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={id} className="font-display text-xl font-semibold text-staff-ink">
          {title}
        </h2>
        {admin ? (
          <button type="button" onClick={onNew} className={cn(PRIMARY_BUTTON, 'px-3')}>
            <Plus size={16} aria-hidden="true" />
            {newLabel}
          </button>
        ) : null}
      </div>

      <Panel className="p-0">
        {error ? (
          <div className="p-4">
            <Alert variant="danger">{error}</Alert>
          </div>
        ) : loading ? (
          <EmptyState>Carregando {title.toLowerCase()}...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>Nenhum {singular} cadastrado.</EmptyState>
        ) : (
          <Table className="max-md:block">
            <TableHeader className="max-md:hidden">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Ponto/uso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="max-md:block">
              {items.map((item) => (
                <TableRow key={item.id} className={RESPONSIVE_ROW}>
                  <TableCell className={cn(RESPONSIVE_CELL, 'font-medium')} data-label="Nome">
                    {item.name}
                  </TableCell>
                  <TableCell className={RESPONSIVE_CELL} data-label="Tipo">
                    {item.type}
                  </TableCell>
                  <TableCell className={RESPONSIVE_CELL} data-label="Quantidade">
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell className={RESPONSIVE_CELL} data-label="Validade">
                    {item.validity ? formatDate(item.validity) : 'Sem validade'}
                  </TableCell>
                  <TableCell className={RESPONSIVE_CELL} data-label="Ponto/uso">
                    {item.point}
                  </TableCell>
                  <TableCell className={RESPONSIVE_CELL} data-label="Ações">
                    {admin ? (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className={cn(SECONDARY_BUTTON, 'px-3')}
                      >
                        Editar
                      </button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </section>
  );
}

export function SuppliesPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);

  const {
    data: medicationsData,
    loading: medicationsLoading,
    error: medicationsError,
    reload: reloadMedications,
  } = useAsyncData(() => medicationService.list({ limit: 200 }), []);
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    reload: reloadProducts,
  } = useAsyncData(() => productService.list({ limit: 200 }), []);

  const [form, setForm] = useState<SupplyForm | null>(null);
  const [original, setOriginal] = useState<FormValues | null>(null);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate(kind: SupplyKind) {
    setForm({ kind });
    setOriginal(null);
    setValues(emptyForm());
    setErrors({});
    setActionError(null);
  }

  function openEdit(kind: SupplyKind, item: SupplyItem) {
    const filled = formFromItem(item);
    setForm({ kind, id: item.id });
    setOriginal(filled);
    setValues(filled);
    setErrors({});
    setActionError(null);
  }

  function closeForm() {
    if (saving) return;
    setForm(null);
    setOriginal(null);
    setErrors({});
    setActionError(null);
  }

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!admin || !form || saving) return;
    setActionError(null);

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = toPayload(values);
    const changes = original ? changedFields(payload, original) : payload;
    setSaving(true);
    try {
      if (form.kind === 'medication') {
        if (form.id !== undefined) {
          await medicationService.update(form.id, changes);
        } else {
          await medicationService.create(payload);
        }
        reloadMedications();
      } else {
        if (form.id !== undefined) {
          await productService.update(form.id, changes);
        } else {
          await productService.create(payload);
        }
        reloadProducts();
      }
      setForm(null);
      setOriginal(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível salvar o insumo.');
    } finally {
      setSaving(false);
    }
  }

  const formTitle = form
    ? form.kind === 'medication'
      ? form.id !== undefined
        ? 'Editar medicamento'
        : 'Novo medicamento'
      : form.id !== undefined
        ? 'Editar produto'
        : 'Novo produto'
    : '';
  const saveLabel = form?.kind === 'product' ? 'Salvar produto' : 'Salvar medicamento';

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Insumos"
        subtitle="Consulte o inventário e cadastre medicamentos e produtos da operação."
      />

      {admin && form ? (
        <Panel>
          <h2 className="font-display text-lg font-semibold text-staff-ink">{formTitle}</h2>

          {actionError ? <Alert variant="danger">{actionError}</Alert> : null}

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="supply-name"
                label="Nome"
                required
                value={values.name}
                error={errors.name}
                onChange={(value) => setField('name', value)}
              />
              <TextField
                id="supply-type"
                label="Tipo"
                required
                value={values.type}
                error={errors.type}
                onChange={(value) => setField('type', value)}
              />
              <TextField
                id="supply-quantity"
                label="Quantidade"
                type="number"
                inputMode="numeric"
                required
                value={values.quantity}
                error={errors.quantity}
                onChange={(value) => setField('quantity', value)}
              />
              <TextField
                id="supply-unit"
                label="Unidade"
                required
                value={values.unit}
                error={errors.unit}
                onChange={(value) => setField('unit', value)}
              />
              <TextField
                id="supply-validity"
                label="Validade"
                type="date"
                optional
                value={values.validity}
                onChange={(value) => setField('validity', value)}
              />
              <TextField
                id="supply-point"
                label="Ponto"
                required
                value={values.point}
                error={errors.point}
                onChange={(value) => setField('point', value)}
              />
              <div className="sm:col-span-2">
                <TextField
                  id="supply-notes"
                  label="Observação"
                  optional
                  multiline
                  rows={3}
                  value={values.notes}
                  onChange={(value) => setField('notes', value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-staff-line pt-4">
              <button type="submit" className={PRIMARY_BUTTON} disabled={saving}>
                {saving ? 'Salvando...' : saveLabel}
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
      ) : null}

      <SupplySection
        id="insumos-medicamentos"
        title="Medicamentos"
        items={medicationsData?.items ?? []}
        loading={medicationsLoading}
        error={medicationsError}
        admin={admin}
        newLabel="Novo medicamento"
        onNew={() => openCreate('medication')}
        onEdit={(item) => openEdit('medication', item)}
      />
      <SupplySection
        id="insumos-produtos"
        title="Produtos"
        items={productsData?.items ?? []}
        loading={productsLoading}
        error={productsError}
        admin={admin}
        newLabel="Novo produto"
        onNew={() => openCreate('product')}
        onEdit={(item) => openEdit('product', item)}
      />
    </div>
  );
}
