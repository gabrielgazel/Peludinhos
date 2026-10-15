import { Link, useParams } from 'react-router-dom';
import { AnimalPhoto } from '../components/AnimalPhoto';
import { BEHAVIOR_LABEL, SEX_LABEL } from '../constants/animal.labels';
import { useAnimal } from '../hooks/useAnimals';
import '../components/animals.css';

export function AnimalDetailPage() {
  const { id } = useParams();
  const animalId = Number(id);
  const { animal, loading, failed } = useAnimal(animalId);

  if (loading) {
    return (
      <div className="pub-container pub-page">
        <p className="pub-state">Carregando...</p>
      </div>
    );
  }

  if (failed || animal === null) {
    return (
      <div className="pub-container pub-page">
        <p className="pub-state" role="alert">
          {failed
            ? 'Não foi possível carregar este animal agora.'
            : 'Não encontramos este animal.'}
        </p>
        <p className="pub-state">
          <Link to="/adocao" className="pub-btn pub-btn--secondary">
            Ver todos os animais
          </Link>
        </p>
      </div>
    );
  }

  const available = animal.status === 'disponivel';

  return (
    <div className="pub-container pub-page">
      <Link to="/adocao" className="pub-back">
        ← Voltar para a lista
      </Link>

      <div className="animal-detail">
        <AnimalPhoto animal={animal} size="hero" />

        <div>
          <h1 className="animal-detail__name">{animal.name}</h1>

          <dl className="animal-detail__facts">
            <div className="animal-fact">
              <dt>Sexo</dt>
              <dd>{SEX_LABEL[animal.sex]}</dd>
            </div>
            <div className="animal-fact">
              <dt>Idade</dt>
              <dd>{animal.age}</dd>
            </div>
            <div className="animal-fact">
              <dt>Cor</dt>
              <dd>{animal.colorDescription}</dd>
            </div>
            <div className="animal-fact">
              <dt>Castrado</dt>
              <dd>{animal.isNeutered ? 'Sim' : 'Não'}</dd>
            </div>
            <div className="animal-fact">
              <dt>Comportamento</dt>
              <dd>{BEHAVIOR_LABEL[animal.behavior]}</dd>
            </div>
          </dl>

          <section className="animal-detail__notes">
            <h2>Sobre {animal.name}</h2>
            <p>{animal.notes}</p>
          </section>

          {available ? (
            <Link
              to={`/adocao/${animal.id}/intencao`}
              className="pub-btn pub-btn--primary pub-btn--lg"
            >
              Tenho interesse em adotar
            </Link>
          ) : (
            <p className="pub-badge pub-badge--accent">
              Este animal não está disponível para adoção no momento.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
