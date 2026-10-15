import { Link } from 'react-router-dom';
import { BEHAVIOR_LABEL, SEX_LABEL } from '../constants/animal.labels';
import type { Animal } from '../types/animal.types';
import { AnimalPhoto } from './AnimalPhoto';
import './animals.css';

export function AnimalCard({ animal }: { animal: Animal }) {
  return (
    <article className="animal-card">
      <AnimalPhoto animal={animal} />

      <div className="animal-card__body">
        <h3 className="animal-card__name">{animal.name}</h3>

        <div className="animal-card__badges">
          <span className="pub-badge">{SEX_LABEL[animal.sex]}</span>
          <span className="pub-badge pub-badge--accent">
            {BEHAVIOR_LABEL[animal.behavior]}
          </span>
        </div>

        <p className="animal-card__info">
          {animal.age} · {animal.colorDescription}
        </p>

        <div className="animal-card__actions">
          <Link
            to={`/adocao/${animal.id}`}
            className="pub-btn pub-btn--secondary pub-btn--sm"
          >
            Ver detalhes
          </Link>
          <Link
            to={`/adocao/${animal.id}/intencao`}
            className="pub-btn pub-btn--primary pub-btn--sm"
          >
            Tenho interesse
          </Link>
        </div>
      </div>
    </article>
  );
}
