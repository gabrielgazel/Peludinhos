import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin } from '../../../shared/types/role.types';
import { animalService } from '../../animals/services/animalService';
import {
  BEHAVIOR_LABEL,
  SEX_LABEL,
} from '../../animals/constants/animal.labels';
import type { Animal, AnimalStatus } from '../../animals/types/animal.types';
import { SelectField } from '../../../shared/components/SelectField';
import { TextField } from '../../../shared/components/TextField';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import {
  ANIMAL_STATUS_LABEL,
  ANIMAL_STATUS_TONE,
  type BadgeTone,
} from '../utils/badges';
import '../staff.css';

type StatusFilter = 'todos' | AnimalStatus;

const STATUS_FILTER_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'disponivel', label: ANIMAL_STATUS_LABEL.disponivel },
  { value: 'em_processo', label: ANIMAL_STATUS_LABEL.em_processo },
  { value: 'adotado', label: ANIMAL_STATUS_LABEL.adotado },
  { value: 'indisponivel', label: ANIMAL_STATUS_LABEL.indisponivel },
];

function toneClass(tone: BadgeTone) {
  return `badge badge--${tone}`;
}

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
    <>
      <header className="page-head">
        <div>
          <h1 className="page-head__title">Animais</h1>
          <p className="page-head__subtitle">
            Animais cadastrados no projeto, incluindo os que já encontraram um lar.
          </p>
        </div>
        {admin && (
          <div className="page-head__actions">
            <Link to="/painel/animais/novo" className="btn btn--primary">
              Novo animal
            </Link>
          </div>
        )}
      </header>

      {(error || actionError) && (
        <p className="alert alert--error" role="alert">
          {actionError ?? error}
        </p>
      )}

      <div className="panel">
        <div className="filter-bar">
          <div className="filter-bar__field">
            <TextField
              id="animals-search"
              label="Buscar por nome"
              type="search"
              inputMode="search"
              value={query}
              onChange={setQuery}
            />
          </div>
          <div className="filter-bar__field">
            <SelectField
              id="animals-status"
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as StatusFilter)}
              options={STATUS_FILTER_OPTIONS}
            />
          </div>
        </div>

        {loading ? (
          <p className="empty-state">Carregando animais...</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state">Nenhum animal encontrado com esses filtros.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Sexo</th>
                  <th>Status</th>
                  <th>Comportamento</th>
                  <th>Castrado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((animal) => (
                  <tr key={animal.id}>
                    <td>
                      <strong>{animal.name}</strong>
                      {animal.isDeceased && (
                        <span className="badge badge--gray" style={{ marginLeft: 8 }}>
                          Falecido
                        </span>
                      )}
                    </td>
                    <td>{SEX_LABEL[animal.sex]}</td>
                    <td>
                      <span className={toneClass(ANIMAL_STATUS_TONE[animal.status])}>
                        {ANIMAL_STATUS_LABEL[animal.status]}
                      </span>
                    </td>
                    <td className="data-table__muted">
                      {animal.behavior ? BEHAVIOR_LABEL[animal.behavior] : '—'}
                    </td>
                    <td className="data-table__muted">{animal.isNeutered ? 'Sim' : 'Não'}</td>
                    <td>
                      <div className="data-table__actions">
                        {admin && (
                          <Link
                            to={`/painel/animais/${animal.id}/editar`}
                            className="btn btn--sm"
                          >
                            Editar
                          </Link>
                        )}
                        {!animal.isDeceased && (
                          <button
                            type="button"
                            className="btn btn--sm btn--danger"
                            disabled={busyId === animal.id}
                            onClick={() => void handleMarkDeceased(animal)}
                          >
                            {busyId === animal.id ? 'Registrando...' : 'Registrar morte'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
