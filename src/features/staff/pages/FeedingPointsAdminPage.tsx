import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin } from '../../../shared/types/role.types';
import { HttpError } from '../../../shared/api/httpsClient';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { cn } from '../../../shared/lib/utils';
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
import {
  feedingPointService,
  type FeedingPoint,
  type FeedingPointPayload,
} from '../services/feedingPointService';

interface FormValues {
  name: string;
  building: string;
  description: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  name: '',
  building: '',
  description: '',
  latitude: '',
  longitude: '',
  isActive: true,
};

function toFormValues(point?: FeedingPoint | null): FormValues {
  if (!point) return EMPTY_FORM;
  return {
    name: point.name,
    building: point.building ?? '',
    description: point.description ?? '',
    latitude: point.latitude === null ? '' : String(point.latitude),
    longitude: point.longitude === null ? '' : String(point.longitude),
    isActive: point.isActive,
  };
}

function parseOptionalNumber(value: string): number | null | 'invalid' {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const normalized = trimmed.replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 'invalid';
}

export function FeedingPointsAdminPage() {
  const { user } = useAuth();
  const canManage = isAdmin(user?.role);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [animalCounts, setAnimalCounts] = useState<Record<number, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FeedingPoint | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, loading, error, reload } = useAsyncData(
    () => feedingPointService.list({ limit: 200 }),
    [],
  );
  const points = useMemo(() => data?.items ?? [], [data]);

  useEffect(() => {
    let cancelled = false;
    if (points.length === 0) {
      setAnimalCounts({});
      return;
    }
    setCountsLoading(true);
    Promise.allSettled(
      points.map((point) =>
        feedingPointService
          .listAnimals(point.id)
          .then((animals) => ({ id: point.id, count: animals.length })),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        const next: Record<number, number> = {};
        for (const result of results) {
          if (result.status === 'fulfilled') {
            next[result.value.id] = result.value.count;
          }
        }
        setAnimalCounts(next);
      })
      .finally(() => {
        if (!cancelled) setCountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [points]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return points;
    return points.filter((point) => {
      const building = point.building?.toLowerCase() ?? '';
      return point.name.toLowerCase().includes(q) || building.includes(q);
    });
  }, [points, debouncedSearch]);

  function openCreate() {
    setEditing(null);
    setValues(EMPTY_FORM);
    setErrors({});
    setActionError(null);
    setFormOpen(true);
  }

  function openEdit(point: FeedingPoint) {
    setEditing(point);
    setValues(toFormValues(point));
    setErrors({});
    setActionError(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setErrors({});
  }

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate(): FormErrors {
    const found: FormErrors = {};
    if (values.name.trim().length === 0) {
      found.name = 'Informe o nome do ponto.';
    }
    if (parseOptionalNumber(values.latitude) === 'invalid') {
      found.latitude = 'Informe uma latitude válida.';
    }
    if (parseOptionalNumber(values.longitude) === 'invalid') {
      found.longitude = 'Informe uma longitude válida.';
    }
    return found;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    setActionError(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      document.getElementById(`feeding-point-${first}`)?.focus();
      return;
    }

    const latitude = parseOptionalNumber(values.latitude);
    const longitude = parseOptionalNumber(values.longitude);
    if (latitude === 'invalid' || longitude === 'invalid') return;

    const payload: FeedingPointPayload = {
      name: values.name.trim(),
      building: values.building.trim() || null,
      description: values.description.trim() || null,
      latitude,
      longitude,
      isActive: values.isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await feedingPointService.update(editing.id, payload);
      } else {
        await feedingPointService.create(payload);
      }
      setFormOpen(false);
      setEditing(null);
      setValues(EMPTY_FORM);
      reload();
    } catch (err) {
      setActionError(
        err instanceof HttpError
          ? err.message
          : 'Não foi possível salvar o ponto de alimentação.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Pontos de alimentação"
        subtitle="Cadastre e acompanhe os pontos de alimentação do campus."
        actions={
          canManage ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
            >
              <Plus size={16} aria-hidden="true" />
              Novo ponto
            </button>
          ) : undefined
        }
      />

      {(error || actionError) && !formOpen && (
        <Alert variant="danger">{actionError ?? error}</Alert>
      )}

      {canManage && formOpen && (
        <Panel>
          <div className="mb-4 flex items-center gap-2 text-staff-ink">
            <MapPin size={18} aria-hidden="true" />
            <h2 className="text-lg font-semibold">
              {editing ? 'Editar ponto' : 'Novo ponto'}
            </h2>
          </div>

          {actionError && <Alert variant="danger">{actionError}</Alert>}

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField
                  id="feeding-point-name"
                  label="Nome"
                  required
                  value={values.name}
                  error={errors.name}
                  onChange={(value) => setField('name', value)}
                />
              </div>
              <TextField
                id="feeding-point-building"
                label="Prédio"
                optional
                value={values.building}
                onChange={(value) => setField('building', value)}
              />
              <div className="flex items-end pb-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-staff-ink">
                  <input
                    id="feeding-point-isActive"
                    type="checkbox"
                    checked={values.isActive}
                    onChange={(e) => setField('isActive', e.target.checked)}
                    className="h-4 w-4 rounded border-staff-line text-staff-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent"
                  />
                  Ponto ativo
                </label>
              </div>
              <div className="sm:col-span-2">
                <TextField
                  id="feeding-point-description"
                  label="Descrição"
                  optional
                  multiline
                  rows={3}
                  value={values.description}
                  onChange={(value) => setField('description', value)}
                />
              </div>
              <TextField
                id="feeding-point-latitude"
                label="Latitude"
                optional
                inputMode="text"
                placeholder="-2.417"
                value={values.latitude}
                error={errors.latitude}
                onChange={(value) => setField('latitude', value)}
              />
              <TextField
                id="feeding-point-longitude"
                label="Longitude"
                optional
                inputMode="text"
                placeholder="-54.721"
                value={values.longitude}
                error={errors.longitude}
                onChange={(value) => setField('longitude', value)}
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-staff-line pt-4">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </form>
        </Panel>
      )}

      <Panel>
        <div className="mb-4 grid gap-4 sm:max-w-sm">
          <TextField
            id="feeding-points-search"
            label="Buscar"
            placeholder="Nome ou prédio"
            value={search}
            onChange={setSearch}
          />
        </div>

        {loading ? (
          <EmptyState>Carregando pontos de alimentação...</EmptyState>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : filtered.length === 0 ? (
          <EmptyState>Nenhum ponto de alimentação encontrado.</EmptyState>
        ) : (
          <Table
            containerProps={{
              tabIndex: 0,
              role: 'region',
              'aria-label':
                'Tabela de pontos de alimentação — role horizontalmente para ver todas as colunas',
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Prédio</TableHead>
                <TableHead>Animais vinculados</TableHead>
                <TableHead>Status</TableHead>
                {canManage ? <TableHead>Ações</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((point) => {
                const count = animalCounts[point.id];
                const linkedLabel =
                  count === undefined
                    ? countsLoading
                      ? 'Carregando...'
                      : '—'
                    : `${count} ${count === 1 ? 'animal' : 'animais'}`;
                return (
                  <TableRow key={point.id}>
                    <TableCell className="font-medium">{point.name}</TableCell>
                    <TableCell>{point.building ?? '—'}</TableCell>
                    <TableCell>{linkedLabel}</TableCell>
                    <TableCell>
                      <StatusBadge tone={point.isActive ? 'green' : 'gray'}>
                        {point.isActive ? 'Ativo' : 'Inativo'}
                      </StatusBadge>
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => openEdit(point)}
                          className={cn(
                            'inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors',
                            'hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none',
                          )}
                        >
                          Editar
                        </button>
                      </TableCell>
                    ) : null}
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
