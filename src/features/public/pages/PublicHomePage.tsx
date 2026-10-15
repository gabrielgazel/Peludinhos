import { Link } from 'react-router-dom';
import { AnimalCard } from '../../animals/components/AnimalCard';
import { useAvailableAnimals } from '../../animals/hooks/useAnimals';
import { PawIcon } from '../../../shared/components/PawIcon';
import '../../animals/components/animals.css';
import './PublicHomePage.css';

const STEPS = [
  {
    title: 'Escolha um peludinho',
    text: 'Veja os animais disponíveis e conheça a história e o jeito de cada um.',
  },
  {
    title: 'Manifeste seu interesse',
    text: 'Preencha o formulário de intenção de adoção com seus dados e o motivo.',
  },
  {
    title: 'Converse com a equipe',
    text: 'A equipe analisa o pedido e entra em contato para os próximos passos.',
  },
];

export function PublicHomePage() {
  const { animals, loading } = useAvailableAnimals();
  const featured = animals.slice(0, 3);

  return (
    <>
      <section className="home-hero">
        <div className="pub-container home-hero__inner">
          <div className="home-hero__text">
            <p className="home-hero__eyebrow">Projeto de Extensão · Ufopa</p>
            <h1 className="home-hero__title">Todo peludinho merece um lar</h1>
            <p className="home-hero__lead">
              O Peludinhos cuida de animais acolhidos e ajuda cada um a encontrar
              uma família responsável.
            </p>
            <div className="home-hero__actions">
              <Link to="/adocao" className="pub-btn pub-btn--primary pub-btn--lg">
                Adoção
              </Link>
              <a href="#sobre" className="pub-btn pub-btn--secondary pub-btn--lg">
                Conheça o projeto
              </a>
            </div>
          </div>

          <div className="home-hero__art" aria-hidden="true">
            <PawIcon size={180} />
          </div>
        </div>
      </section>

      <section className="pub-container home-section" aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="home-section__title">
          Como funciona a adoção
        </h2>
        <ol className="home-steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="home-step">
              <span className="home-step__number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="pub-container home-section" aria-labelledby="esperando">
        <div className="home-section__head">
          <h2 id="esperando" className="home-section__title">
            Quem está esperando por você
          </h2>
          <Link to="/adocao" className="pub-btn pub-btn--ghost pub-btn--sm">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <p className="pub-state">Carregando peludinhos...</p>
        ) : (
          <div className="animal-grid">
            {featured.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}
      </section>

      <section
        id="sobre"
        className="pub-container home-section home-about"
        aria-labelledby="sobre-titulo"
      >
        <h2 id="sobre-titulo" className="home-section__title">
          Sobre o projeto
        </h2>
        <p>
          O Peludinhos é um projeto de extensão da Ufopa dedicado ao cuidado de
          animais, com a ajuda de voluntários, e à promoção da adoção
          responsável. Cada animal é acompanhado pela equipe até encontrar uma
          família.
        </p>
      </section>
    </>
  );
}
