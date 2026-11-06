import { Link } from 'react-router-dom';
import type { Animal } from '../../animals/types/animal.types';
import { availabilityLabel } from '../lib/homeAnimals';
import { HeroPhotoStack } from './HeroPhotoStack';
import { ArrowDown, MoveRight } from 'lucide-react';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';

interface HomeHeroProps {
  /** Animais já filtrados pela página — o hero apenas empilha as três primeiras fotos. */
  animals: Animal[];
  loading: boolean;
  failed: boolean;
}

const LEAD =
  'O Peludinhos é um projeto de extensão da UFOPA dedicado ao cuidado de cães e gatos de vida livre ' +
  'que vivem no campus — com alimentação, acompanhamento de saúde e o apoio da comunidade ' +
  'universitária. Cada peludinho é acompanhado pela equipe até encontrar uma família responsável.';

/** Hero editorial da home: mensagem do projeto, contador e pilha de fotos. */
export function HomeHero({ animals, loading, failed }: HomeHeroProps) {
  return (
    <section className="home-paper bg-paper">
      <div className="pub-container grid gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="flex flex-col items-start gap-6">
          <Badge variant="default">
            <span className="size-1.5 rounded-full bg-leaf" aria-hidden="true" />
            Adoções abertas
          </Badge>

          <h1 className="max-w-[16ch] font-display text-[clamp(44px,6.4vw,72px)] leading-[0.98] tracking-[-0.025em] text-ink">
            Todo peludinho merece um lar
          </h1>

          <p className="max-w-prose font-body text-base leading-relaxed text-muted md:text-lg">
            {LEAD}
          </p>

          <p className="font-body text-sm font-bold text-ink" aria-live="polite">
            {availabilityLabel({ count: animals.length, loading, failed })}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/adocao">
                Conhecer os peludinhos
                <MoveRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a href="#como-funciona">
                Como funciona
                <ArrowDown aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>

        <HeroPhotoStack animals={animals} />
      </div>
    </section>
  );
}
