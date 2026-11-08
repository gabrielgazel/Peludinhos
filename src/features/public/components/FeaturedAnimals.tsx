import { Link } from 'react-router-dom';
import { BEHAVIOR_LABEL, SEX_LABEL } from '../../animals/constants/animal.labels';
import { AnimalPhoto } from '../../animals/components/AnimalPhoto';
import type { Animal } from '../../animals/types/animal.types';
import { PawIcon } from '../../../shared/components/PawIcon';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../../../shared/ui/carousel';

/** Limite de animais na vitrine da home. */
const MAX_FEATURED = 8;

const SKELETON_COUNT = 3;

interface FeaturedAnimalsProps {
  animals: Animal[];
  loading: boolean;
  failed: boolean;
}

function FeaturedAnimalCard({ animal }: { animal: Animal }) {
  const info = [animal.age, animal.colorDescription].filter(Boolean).join(' · ');

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-home border border-line bg-card">
      <div className="relative">
        <AnimalPhoto animal={animal} />
        <div className="absolute inset-x-3 bottom-3">
          <div className="inline-block max-w-full rounded-2xl bg-card px-3 py-1.5">
            <h3 className="line-clamp-2 break-words font-display text-lg leading-snug text-ink">
              {animal.name}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{SEX_LABEL[animal.sex]}</Badge>
          {animal.behavior && (
            <Badge variant="accent">{BEHAVIOR_LABEL[animal.behavior]}</Badge>
          )}
        </div>

        {info && <p className="text-sm text-muted">{info}</p>}

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Button asChild variant="secondary" size="sm">
            <Link to={`/adocao/${animal.id}`}>Ver mais</Link>
          </Button>
          <Button asChild size="sm">
            <Link to={`/adocao/${animal.id}/intencao`}>Tenho interesse</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function FeaturedAnimalsSkeletons() {
  return (
    <div className="mt-8">
      <p role="status" className="sr-only">
        Carregando peludinhos...
      </p>
      <div
        aria-hidden="true"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <div
            key={index}
            data-testid="animal-skeleton"
            className="aspect-[4/3] animate-pulse rounded-home border border-line bg-marker-soft motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}

function FeaturedAnimalsError() {
  return (
    <div
      role="alert"
      className="mt-8 flex flex-col items-start gap-4 rounded-home border border-line bg-card p-6"
    >
      <p className="text-sm text-ink">
        Não foi possível carregar os peludinhos agora. Verifique sua conexão e
        tente de novo.
      </p>
      <Button asChild variant="secondary" size="sm">
        <a href="/">Tentar novamente</a>
      </Button>
    </div>
  );
}

function FeaturedAnimalsEmpty() {
  return (
    <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-home border border-dashed border-line bg-card px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-leaf-soft text-ink-soft"
      >
        <PawIcon size={28} />
      </span>
      <p className="font-display text-xl text-ink">Nenhum peludinho disponível agora</p>
      <Button asChild variant="secondary" size="sm">
        <Link to="/#projeto">Conhecer o projeto</Link>
      </Button>
    </div>
  );
}

/**
 * Vitrine de animais em destaque: carrossel com no máximo oito animais.
 * Estados de carga, vazio e erro são renderizados no lugar do carrossel.
 */
export function FeaturedAnimals({ animals, loading, failed }: FeaturedAnimalsProps) {
  const displayed = animals.slice(0, MAX_FEATURED);
  const total = displayed.length;
  const counter = `${total} ${total === 1 ? 'disponível' : 'disponíveis'}`;

  return (
    <section
      aria-labelledby="animais-titulo"
      className="mx-auto w-full max-w-6xl px-4 py-[clamp(56px,8vw,96px)]"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="animais-titulo" className="font-display text-3xl text-ink">
            Quem está esperando
          </h2>
          {!loading && !failed && (
            <p className="mt-2 text-sm font-bold text-ink" aria-live="polite">
              {counter}
            </p>
          )}
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/adocao">Ver todos</Link>
        </Button>
      </div>

      {loading && <FeaturedAnimalsSkeletons />}

      {!loading && failed && <FeaturedAnimalsError />}

      {!loading && !failed && total === 0 && <FeaturedAnimalsEmpty />}

      {!loading && !failed && total > 0 && (
        <Carousel
          aria-label="Peludinhos disponíveis para adoção"
          className="mt-8 pb-12"
        >
          <CarouselContent>
            {displayed.map((animal) => (
              <CarouselItem
                key={animal.id}
                aria-label={`${animal.name} de ${total}`}
                className="basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <FeaturedAnimalCard animal={animal} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="top-auto bottom-0 left-[calc(50%-3rem)] translate-y-0 border-line bg-card text-ink hover:bg-marker-soft" />
          <CarouselNext className="top-auto bottom-0 right-[calc(50%-3rem)] translate-y-0 border-line bg-card text-ink hover:bg-marker-soft" />
        </Carousel>
      )}
    </section>
  );
}
