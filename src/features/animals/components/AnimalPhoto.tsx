import { useState } from 'react';
import type { Animal } from '../types/animal.types';
import { PawIcon } from '../../../shared/components/PawIcon';
import './animals.css';

type PhotoSize = 'thumb' | 'card' | 'hero';

interface AnimalPhotoProps {
  animal: Animal;
  size?: PhotoSize;
}

const PAW_SIZE: Record<PhotoSize, number> = { thumb: 22, card: 72, hero: 120 };

/**
 * Foto do animal. Se o animal ainda não tem foto (ou a imagem falha ao
 * carregar), mostra uma ilustração com cor de fundo que varia por animal.
 */
export function AnimalPhoto({ animal, size = 'card' }: AnimalPhotoProps) {
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const tone = animal.id % 3;
  const url = animal.photoUrl;

  if (url && url !== brokenUrl) {
    return (
      <img
        className={`animal-photo animal-photo--${size}`}
        src={url}
        alt={`Foto de ${animal.name}`}
        loading="lazy"
        onError={() => setBrokenUrl(url)}
      />
    );
  }

  return (
    <div
      className={`animal-photo animal-photo--${size} animal-photo--tone-${tone}`}
      aria-hidden="true"
    >
      <PawIcon size={PAW_SIZE[size]} />
    </div>
  );
}
