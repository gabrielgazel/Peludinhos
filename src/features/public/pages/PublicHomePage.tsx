import { useAvailableAnimals } from '../../animals/hooks/useAnimals';
import { AdoptionTimeline } from '../components/AdoptionTimeline';
import { CareTicker } from '../components/CareTicker';
import { ContactPanel } from '../components/ContactPanel';
import { FeaturedAnimals } from '../components/FeaturedAnimals';
import { HomeHero } from '../components/HomeHero';
import { ProjectBento } from '../components/ProjectBento';
import { Reveal } from '../components/Reveal';
import { selectAvailableAnimals } from '../lib/homeAnimals';
import './PublicHomePage.css';

/**
 * Home pública: monta as seções na ordem editorial do mural do campus.
 * A lista é filtrada uma única vez (disponíveis e vivos) e compartilhada
 * entre a hero e a vitrine.
 */
export function PublicHomePage() {
  const { animals, loading, failed } = useAvailableAnimals();
  const available = selectAvailableAnimals(animals);

  return (
    <>
      <HomeHero animals={available} loading={loading} failed={failed} />
      <CareTicker />
      <Reveal>
        <ProjectBento />
      </Reveal>
      <Reveal>
        <AdoptionTimeline />
      </Reveal>
      <Reveal>
        <FeaturedAnimals animals={available} loading={loading} failed={failed} />
      </Reveal>
      <ContactPanel />
    </>
  );
}
