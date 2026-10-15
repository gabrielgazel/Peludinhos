import { useMemo, useState } from 'react';
import { AnimalCard } from '../components/AnimalCard';
import { useAvailableAnimals } from '../hooks/useAnimals';
import { TextField } from '../../../shared/components/TextField';
import type { AnimalSex } from '../types/animal.types';
import '../components/animals.css';

type SexFilter = 'todos' | AnimalSex;

const SEX_FILTERS: { value: SexFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'F', label: 'Fêmeas' },
  { value: 'M', label: 'Machos' },
];

export function AnimalListPage() {
  const { animals, loading, failed } = useAvailableAnimals();
  const [query, setQuery] = useState('');
  const [sex, setSex] = useState<SexFilter>('todos');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return animals.filter(
      (animal) =>
        (sex === 'todos' || animal.sex === sex) &&
        (term === '' || animal.name.toLowerCase().includes(term)),
    );
  }, [animals, query, sex]);

  return (
    <div className="pub-container pub-page">
      <h1 className="pub-page__title">Adoção</h1>
      <p className="pub-page__lead">
        Conheça os peludinhos que estão esperando por uma família. Escolha um
        deles e manifeste seu interesse em adotar.
      </p>

      <div className="animal-filters">
        <div className="animal-filters__search">
          <TextField
            id="busca"
            label="Buscar por nome"
            type="search"
            inputMode="search"
            value={query}
            onChange={setQuery}
          />
        </div>

        <div className="animal-filters__chips" role="group" aria-label="Filtrar por sexo">
          {SEX_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className="animal-chip"
              aria-pressed={sex === filter.value}
              onClick={() => setSex(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="pub-state">Carregando peludinhos...</p>}

      {failed && (
        <p className="pub-state" role="alert">
          Não foi possível carregar os animais agora. Tente novamente em instantes.
        </p>
      )}

      {!loading && !failed && (
        <>
          <p className="animal-count" aria-live="polite">
            {filtered.length === 1
              ? '1 peludinho disponível'
              : `${filtered.length} peludinhos disponíveis`}
          </p>

          {filtered.length > 0 ? (
            <div className="animal-grid">
              {filtered.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          ) : (
            <p className="pub-state">
              Nenhum peludinho encontrado com esses filtros.
            </p>
          )}
        </>
      )}
    </div>
  );
}
