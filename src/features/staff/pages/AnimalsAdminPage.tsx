import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin } from '../../../shared/types/role.types';
import { animalService } from '../../animals/services/animalService';
import {
  BEHAVIOR_LABEL,
  SEX_LABEL,
} from '../../animals/constants/animal.labels';
import type { Animal, AnimalStatus } from '../../animals/types/animal.types';
import { AnimalPhoto } from '../../animals/components/AnimalPhoto';
import { SelectField } from '../../../shared/components/SelectField';
import { TextField } from '../../../shared/components/TextField';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { ANIMAL_STATUS_LABEL, ANIMAL_STATUS_TONE } from '../utils/badges';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/ui/table';
import '../staff.css';

type StatusFilter = 'todos' | AnimalStatus;

const STATUS_FILTER_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'disponivel', label: ANIMAL_STATUS_LABEL.disponivel },
  { value: 'em_processo', label: ANIMAL_STATUS_LABEL.em_processo },
  { value: 'adotado', label: ANIMAL_STATUS_LABEL.adotado },
  { value: 'indisponivel', label: ANIMAL_STATUS_LABEL.indisponivel },
];

export function AnimalsAdminPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);

  const [status, setStatus] = useState<StatusFilter>('todos');
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data, loading, error, reload } = useAsyncData(
    () => animalService.list({ limit: 200, includeDeceased: true }),
    [],
  );
  const animals = data?.items ?? [];

  const filtered = animals.filter((animal) => {
    const matchesStatus = status === 'todos' || animal.status === status;
    const term = query.trim().toLowerCase();
    const matchesQuery = term === '' || animal.name.toLowerCase().includes(term);
    return matchesStatus && matchesQuery;
  });

  async function handleMarkDeceased(animal: Animal) {
    const confirmed = window.confirm(
      `Registrar o falecimento de ${animal.name}? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    setActionError(null);
    setBusyId(animal.id);
    try {
      await animalService.markDeceased(animal.id);
      reload();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Não foi possível registrar o falecimento.',
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Animais"
        subtitle="Animais cadastrados no projeto, incluindo os que já encontraram um lar."
        actions={
          admin ? (
            <Link
              to="/painel/animais/novo"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
            >
              <Plus size={16} aria-hidden="true" />
              Novo animal
            </Link>
          ) : undefined
        }
      />

      {(error || actionError) && (
        <Alert variant="danger">{actionError ?? error}</Alert>
      )}

      <Panel>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <TextField
            id="animals-search"
            label="Buscar por nome"
            type="search"
            inputMode="search"
            value={query}
            onChange={setQuery}
          />
          <SelectField
            id="animals-status"
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as StatusFilter)}
            options={STATUS_FILTER_OPTIONS}
          />
        </div>

        {loading ? (
          <EmptyState>Carregando animais...</EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState>Nenhum animal encontrado com esses filtros.</EmptyState>
        ) : (
          <Table
            containerProps={{
              role: 'region',
              tabIndex: 0,
              'aria-label': 'Tabela de animais — role horizontalmente para ver todas as colunas',
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comportamento</TableHead>
                <TableHead>Castrado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((animal) => (
                <TableRow key={animal.id}>
                  <TableCell>
                    <AnimalPhoto animal={animal} size="thumb" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-staff-ink">{animal.name}</span>
                      {animal.isDeceased && (
                        <StatusBadge tone="gray">Falecido</StatusBadge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{SEX_LABEL[animal.sex]}</TableCell>
                  <TableCell>
                    <StatusBadge tone={ANIMAL_STATUS_TONE[animal.status]}>
                      {ANIMAL_STATUS_LABEL[animal.status]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-staff-muted">
                    {animal.behavior ? BEHAVIOR_LABEL[animal.behavior] : '—'}
                  </TableCell>
                  <TableCell className="text-staff-muted">
                    {animal.isNeutered ? 'Sim' : 'Não'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {admin && (
                        <Link
                          to={`/painel/animais/${animal.id}/editar`}
                          className="inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                        >
                          Editar
                        </Link>
                      )}
                      {!animal.isDeceased && (
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center rounded-xl border border-staff-danger/40 bg-staff-surface px-3 text-sm font-bold text-staff-danger transition-colors hover:bg-staff-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                          disabled={busyId === animal.id}
                          onClick={() => void handleMarkDeceased(animal)}
                        >
                          {busyId === animal.id ? 'Registrando...' : 'Registrar morte'}
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
