import type { Animal } from '../../animals/types/animal.types';
import { AnimalPhoto } from '../../animals/components/AnimalPhoto';
import { SEX_LABEL } from '../../animals/constants/animal.labels';
import { PawIcon } from '../../../shared/components/PawIcon';
import { cn } from '../../../shared/lib/utils';
import { Badge } from '../../../shared/ui/badge';

interface HeroPhotoStackProps {
  animals: Animal[];
}

/** Rotação das fotos da pilha, por índice. */
const STACK_TILT = ['-rotate-[3deg]', 'rotate-[2deg]', '-rotate-[1.5deg]'];

/** Tons alternados dos blocos vazios da pilha. */
const EMPTY_TONES = ['bg-marker-soft', 'bg-leaf-soft', 'bg-card'];

/**
 * Pilha de fotos da hero: até três polares levemente rotacionados com nome e
 * sexo. Sem animais, mostra blocos decorativos com a pata do projeto.
 */
export function HeroPhotoStack({ animals }: HeroPhotoStackProps) {
  const stack = animals.slice(0, 3);

  if (stack.length === 0) {
    return (
      <div className="hero-photo-stack" aria-hidden="true">
        {EMPTY_TONES.map((tone, index) => (
          <figure
            key={tone}
            data-visible="true"
            className={cn(
              'hero-photo-stack__figure rounded-home border border-line p-4 shadow-sm',
              STACK_TILT[index],
              tone,
            )}
          >
            <div className="flex h-44 items-center justify-center rounded-home bg-paper/60 text-marker">
              <PawIcon size={54} />
            </div>
            <figcaption className="flex items-center justify-between pt-3">
              <span className="font-display text-sm text-muted">Peludinho</span>
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <div className="hero-photo-stack">
      {stack.map((animal, index) => (
        <figure
          key={animal.id}
          data-visible="true"
          className={cn(
            'hero-photo-stack__figure rounded-home border border-line bg-card p-3 shadow-sm',
            STACK_TILT[index],
          )}
        >
          <div className="overflow-hidden rounded-home">
            <AnimalPhoto animal={animal} size="card" />
          </div>
          <figcaption className="flex items-center justify-between gap-2 pt-3">
            <span className="font-display text-lg text-ink">{animal.name}</span>
            <Badge variant="outline">{SEX_LABEL[animal.sex]}</Badge>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
