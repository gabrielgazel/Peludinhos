import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ExternalLink,
  Gavel,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  MapPin,
  Megaphone,
  MoveRight,
  Newspaper,
  Scale,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimalCard } from '../../animals/components/AnimalCard';
import { useAvailableAnimals } from '../../animals/hooks/useAnimals';
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

/** Pontos-chave do projeto exibidos no painel da hero. */
const FACTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: MapPin,
    title: 'Campus Santarém, Pará',
    text: 'O Peludinhos atua nas dependências da Universidade Federal do Oeste do Pará.',
  },
  {
    icon: GraduationCap,
    title: 'Projeto de Extensão',
    text: 'Iniciativa universitária levada adiante pela comunidade acadêmica.',
  },
  {
    icon: HeartHandshake,
    title: 'Cuidado e proteção',
    text: 'Alimentação, acompanhamento de saúde e apoio até a adoção.',
  },
  {
    icon: Gavel,
    title: 'Adoção responsável',
    text: 'Abandono e maus-tratos são crimes — Lei nº 9.605/98.',
  },
];

/** Pilares do projeto (conteúdo institucional). */
const PILLARS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: HeartPulse,
    title: 'Cuidados diários',
    text: 'Alimentação adequada e acompanhamento das condições de saúde dos animais.',
  },
  {
    icon: Users,
    title: 'Ações coletivas',
    text: 'Técnicos administrativos, professores, profissionais terceirizados e estudantes — muitos já ajudavam os animais de forma isolada; o Peludinhos organiza essas ações.',
  },
  {
    icon: Scale,
    title: 'Controle populacional',
    text: 'Ações para o controle populacional dos animais presentes no campus.',
  },
  {
    icon: Megaphone,
    title: 'Conscientização',
    text: 'Sensibilização sobre abandono e maus-tratos, com orientação à comunidade acadêmica.',
  },
];

const UFOPA_SOURCE_URL =
  'https://www.ufopa.edu.br/ufopa/comunica/noticias/projeto-peludinhos-da-ufopa-pretende-cuidar-de-animais-e-evitar-abandono-no-campus/';

export function PublicHomePage() {
  const { animals, loading, failed } = useAvailableAnimals();
  const featured = animals.slice(0, 3);

  return (
    <>
      {/* Hero: apresenta o projeto — não há mais seção "Sobre o
          projeto" no fim da página. */}
      <section className="home-hero">
        <div className="pub-container home-hero__inner">
          <div className="home-hero__text">
            <span className="pub-badge pub-badge--outline">
              Adoções abertas
            </span>
            <h1 className="home-hero__title">Todo peludinho merece um lar</h1>
            <p className="home-hero__lead">
              O Peludinhos é um projeto de extensão da UFOPA dedicado ao cuidado
              de cães e gatos de vida livre que vivem no campus — com
              alimentação, acompanhamento de saúde e o apoio da comunidade
              universitária. Cada peludinho é acompanhado pela equipe até
              encontrar uma família responsável.
            </p>
            <div className="home-hero__actions">
              <Link
                to="/adocao"
                className="pub-btn pub-btn--primary pub-btn--lg"
              >
                Ver animais para adoção
                <MoveRight size={22} aria-hidden="true" />
              </Link>
              <a href="#como-funciona" className="pub-btn pub-btn--ghost pub-btn--lg">
                Como funciona
                <ArrowDown size={22} aria-hidden="true" />
              </a>
            </div>
          </div>

          <aside className="home-hero__panel" aria-label="O Peludinhos em resumo">
            <ul className="home-hero__facts">
              {FACTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="home-fact">
                  <span className="home-fact__icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="home-fact__title">{title}</p>
                    <p className="home-fact__text">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section
        id="projeto"
        className="pub-container home-section"
        aria-labelledby="projeto-titulo"
      >
        <h2 id="projeto-titulo" className="home-section__title">
          O projeto
        </h2>
        <p className="home-section__lead">
          O “Peludinhos da UFOPA” nasceu da união de pessoas comprometidas com
          o bem-estar dos animais que vivem nos espaços da universidade. O
          objetivo é tratar, cuidar e alimentar os animais — especialmente cães
          e gatos de vida livre — garantindo maior qualidade de vida com ações
          responsáveis de cuidado e proteção.
        </p>

        <ul className="home-pillars">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="home-pillar">
              <span className="home-pillar__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
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

        {loading && <p className="pub-state">Carregando peludinhos...</p>}

        {failed && (
          <p className="pub-state" role="alert">
            Não foi possível carregar os peludinhos agora. Tente novamente em
            instantes.
          </p>
        )}

        {!loading && !failed && (
          featured.length > 0 ? (
            <div className="animal-grid">
              {featured.map((animal) => (
                <AnimalCard key={animal.id} animal={animal} />
              ))}
            </div>
          ) : (
            <p className="pub-state">
              Nenhum peludinho disponível no momento. Volte em breve!
            </p>
          )
        )}
      </section>

      <section className="pub-container home-section" aria-labelledby="contato-titulo">
        <h2 id="contato-titulo" className="home-section__title">
          Contato e informações
        </h2>

        <div className="home-info">
          <article className="home-info__card">
            <span className="home-info__icon">
              <MapPin size={20} aria-hidden="true" />
            </span>
            <h3>Local</h3>
            <p>
              Universidade Federal do Oeste do Pará (UFOPA) — Campus Santarém,
              Pará.
            </p>
          </article>

          <article className="home-info__card">
            <span className="home-info__icon">
              <GraduationCap size={20} aria-hidden="true" />
            </span>
            <h3>Contato</h3>
            <p>
              Professora responsável: <strong>Cintya Martins</strong> —
              Instituto de Engenharia e Geociências (IEG/UFOPA).
            </p>
          </article>

          <article className="home-info__card">
            <span className="home-info__icon">
              <Newspaper size={20} aria-hidden="true" />
            </span>
            <h3>Fonte</h3>
            <p>
              Publicado em 11 de abril de 2019.{' '}
              <a
                href={UFOPA_SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="home-info__link"
              >
                Notícia na UFOPA
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
