import type { Animal } from '../types/animal.types';
import { PawIcon } from '../../../shared/components/PawIcon';
import './animals.css';

interface AnimalPhotoProps {
  animal: Animal;
  size?: 'card' | 'hero';
}

/**
 * Foto do animal. Enquanto o modelo não tem foto, mostra uma
 * ilustração com uma cor de fundo que varia por animal.
 */
export function AnimalPhoto({ animal, size = 'card' }: AnimalPhotoProps) {
  const tone = animal.id % 3;

  if (animal.photoUrl) {
    return (
      <img
        className={`animal-photo animal-photo--${size}`}
        src={animal.photoUrl}
        alt={`Foto de ${animal.name}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`animal-photo animal-photo--${size} animal-photo--tone-${tone}`}
      aria-hidden="true"
    >
      <PawIcon size={size === 'hero' ? 120 : 72} />
    </div>
  );
}
