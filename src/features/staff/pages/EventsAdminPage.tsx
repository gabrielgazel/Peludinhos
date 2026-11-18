import { useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin } from '../../../shared/types/role.types';
import { HttpError } from '../../../shared/api/httpsClient';
import type { Page } from '../../../shared/api/types';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { cn } from '../../../shared/lib/utils';
import { formatDate } from '../../../shared/utils/format';
import { TextField } from '../../../shared/components/TextField';
import { SelectField } from '../../../shared/components/SelectField';
import type { Animal } from '../../animals/types/animal.types';
import { animalService } from '../../animals/services/animalService';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import {
  eventService,
  type Event,
  type EventPayload,
} from '../services/eventService';

interface FormValues {
  description: string;
  eventDate: string;
  animalId: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const FIELD_ID: Record<keyof FormValues, string> = {
  description: 'event-description',
  eventDate: 'event-date',
  animalId: 'event-animal',
};

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

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
  return { description: '', eventDate: todayIso(), animalId: '' };
}

function toFormValues(event: Event | null): FormValues {
  if (!event) return emptyForm();
  return {
    description: event.description,
    eventDate: event.eventDate,
    animalId: event.animalId === null ? '' : String(event.animalId),
  };
}

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split('-');
  const name = MONTH_NAMES[Number(monthNumber) - 1];
  if (!year || !name) return 'Sem data';
  return `${name} de ${year}`;
}

const EMPTY_ANIMALS_PAGE: Page<Animal> = { items: [], total: 0, limit: 200, offset: 0 };

export function EventsAdminPage() {
  const { user } = useAuth();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () => eventService.list({ limit: 200 }),
    [],
  );
  const events = useMemo(() => data?.items ?? [], [data]);

  // Os animais só são necessários quando o formulário está aberto.
  const { data: animalsData, loading: animalsLoading } = useAsyncData<Page<Animal>>(
    () => (formOpen ? animalService.list({ limit: 200 }) : Promise.resolve(EMPTY_ANIMALS_PAGE)),
    [formOpen],
  );

  const animalOptions = useMemo(() => {
    const options = (animalsData?.items ?? []).map((animal) => ({
      value: String(animal.id),
      label: animal.name,
    }));
    if (
      editing?.animalId != null &&
      !options.some((option) => option.value === String(editing.animalId))
    ) {
      options.push({
        value: String(editing.animalId),
        label: editing.animalName ?? `Animal #${editing.animalId}`,
      });
    }
    return options;
  }, [animalsData, editing]);

  const groups = useMemo(() => {
    const byMonth = new Map<string, Event[]>();
    for (const item of events) {
      const key = item.eventDate.slice(0, 7);
      const bucket = byMonth.get(key);
      if (bucket) {
        bucket.push(item);
      } else {
        byMonth.set(key, [item]);
      }
    }
    return Array.from(byMonth, ([month, items]) => ({ month, items }));
  }, [events]);

  function canEditEvent(event: Event): boolean {
    if (isAdmin(user?.role)) return true;
    return user?.memberId != null && event.memberId === user.memberId;
  }

  function openCreate() {
    setEditing(null);
    setValues(emptyForm());
    setErrors({});
    setActionError(null);
    setConfirming(false);
    setFormOpen(true);
  }

  function openEdit(event: Event) {
    setEditing(event);
    setValues(toFormValues(event));
    setErrors({});
    setActionError(null);
    setConfirming(false);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setErrors({});
    setActionError(null);
    setConfirming(false);
  }

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate(): FormErrors {
    const found: FormErrors = {};
    if (values.description.trim().length === 0) {
      found.description = 'Descreva a ocorrência.';
    }
    if (!values.eventDate) {
      found.eventDate = 'Informe a data.';
    }
    return found;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0] as keyof FormValues;
      document.getElementById(FIELD_ID[first])?.focus();
      return;
    }

    setConfirming(true);
  }

  async function handleConfirm() {
    if (saving) return;
    setActionError(null);
    setSaving(true);

    const payload: EventPayload = {
      description: values.description.trim(),
      eventDate: values.eventDate,
      animalId: values.animalId ? Number(values.animalId) : null,
    };

    try {
      if (editing) {
        await eventService.update(editing.id, payload);
      } else {
        await eventService.create(payload);
      }
      setFormOpen(false);
      setEditing(null);
      setValues(emptyForm());
      setErrors({});
      setConfirming(false);
      reload();
    } catch (err) {
      setActionError(
        err instanceof HttpError ? err.message : 'Não foi possível salvar a ocorrência.',
      );
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Ocorrências"
        subtitle="Registre e consulte o dia a dia do abrigo."
        actions={
          <button type="button" onClick={openCreate} className={PRIMARY_BUTTON}>
            <Plus size={16} aria-hidden="true" />
            Nova ocorrência
          </button>
        }
      />

      {(error || actionError) && !formOpen && (
        <Alert variant="danger">{actionError ?? error}</Alert>
      )}

      {formOpen && (
        <Panel>
          <div className="mb-4 flex items-center gap-2 text-staff-ink">
            <CalendarDays size={18} aria-hidden="true" />
            <h2 className="text-lg font-semibold">
              {editing ? 'Editar ocorrência' : 'Registrar ocorrência'}
            </h2>
          </div>

          {actionError && <Alert variant="danger">{actionError}</Alert>}

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField
                  id="event-description"
                  label="Descrição"
                  required
                  multiline
                  rows={3}
                  value={values.description}
                  error={errors.description}
                  onChange={(value) => setField('description', value)}
                />
              </div>
              <TextField
                id="event-date"
                label="Data"
                type="date"
                required
                value={values.eventDate}
                error={errors.eventDate}
                onChange={(value) => setField('eventDate', value)}
              />
              <SelectField
                id="event-animal"
                label="Animal"
                optional
                placeholder="Sem vínculo com animal"
                value={values.animalId}
                options={animalOptions}
                hint={animalsLoading ? 'Carregando animais...' : undefined}
                onChange={(value) => setField('animalId', value)}
              />
            </div>

            {confirming ? (
              <div className="space-y-3 rounded-xl border border-staff-line bg-staff-bg p-4">
                <p className="font-semibold text-staff-ink">
                  {editing ? 'Salvar alterações nesta ocorrência?' : 'Registrar esta ocorrência?'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleConfirm()}
                    disabled={saving}
                    className={PRIMARY_BUTTON}
                  >
                    {saving
                      ? 'Salvando...'
                      : editing
                        ? 'Confirmar alterações'
                        : 'Confirmar registro'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={saving}
                    className={SECONDARY_BUTTON}
                  >
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 border-t border-staff-line pt-4">
                <button type="submit" className={PRIMARY_BUTTON} disabled={saving}>
                  {editing ? 'Salvar alterações' : 'Registrar ocorrência'}
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
            )}
          </form>
        </Panel>
      )}

      <Panel>
        {loading ? (
          <EmptyState>Carregando ocorrências...</EmptyState>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : events.length === 0 ? (
          <EmptyState>
            <p>Nenhuma ocorrência registrada ainda.</p>
            <button type="button" onClick={openCreate} className={cn(PRIMARY_BUTTON, 'mt-4')}>
              <Plus size={16} aria-hidden="true" />
              Registrar primeira ocorrência
            </button>
          </EmptyState>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section
                key={group.month || 'sem-data'}
                aria-labelledby={`events-month-${group.month || 'sem-data'}`}
                className="space-y-3"
              >
                <h2
                  id={`events-month-${group.month || 'sem-data'}`}
                  className="font-body text-[11px] font-bold tracking-[0.08em] text-staff-muted uppercase"
                >
                  {monthLabel(group.month)}
                </h2>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-staff-line bg-staff-surface p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold tracking-[0.04em] text-staff-muted">
                              {formatDate(item.eventDate)}
                            </span>
                            {item.animalName ? (
                              <StatusBadge tone="amber">Animal: {item.animalName}</StatusBadge>
                            ) : null}
                          </div>
                          <p className="whitespace-pre-line text-staff-ink">{item.description}</p>
                          <p className="text-sm text-staff-muted">por {item.memberName}</p>
                        </div>
                        {canEditEvent(item) ? (
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className={cn(SECONDARY_BUTTON, 'shrink-0 px-3')}
                          >
                            Editar
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
