import './AboutPeludinhosPage.css';

export function AboutPeludinhosPage() {
  return (
    <section className="pub-container about-page" aria-labelledby="sobre-projeto-title">
      <header className="about-page__header">
        <p className="about-page__eyebrow">Projeto de Extensão · UFOPA</p>
        <h1 id="sobre-projeto-title" className="about-page__title">
          Sobre o Projeto Peludinhos
        </h1>
        <p className="about-page__lead">
          O “Peludinhos da UFOPA” nasceu da união de pessoas comprometidas com o bem-estar dos animais
          que vivem nos espaços da Universidade Federal do Oeste do Pará.
        </p>
      </header>

      <article className="about-card" aria-labelledby="objetivo">
        <h2 id="objetivo" className="about-card__title">
          Objetivo
        </h2>
        <p className="about-card__text">
          Tratar, cuidar e alimentar os animais, especialmente cães e gatos de vida livre, que habitam
          as dependências da UFOPA. O projeto busca garantir maior qualidade de vida aos peludinhos,
          promovendo ações responsáveis de cuidado e proteção.
        </p>
      </article>

      <article className="about-card" aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="about-card__title">
          Como funciona
        </h2>
        <ul className="about-list">
          <li className="about-list__item">
            <strong>Cuidados diários:</strong> alimentação adequada e saudável, além de acompanhamento
            das condições de saúde dos animais.
          </li>
          <li className="about-list__item">
            <strong>Ações coletivas:</strong> envolve técnicos administrativos, professores,
            profissionais terceirizados e estudantes, unindo esforços para cuidar dos animais.
          </li>
          <li className="about-list__item">
            <strong>Controle populacional:</strong> busca ações para o controle populacional dos
            animais presentes no campus.
          </li>
          <li className="about-list__item">
            <strong>Conscientização:</strong> promove a sensibilização sobre o abandono e maus-tratos
            de animais, além de orientar a comunidade acadêmica.
          </li>
        </ul>
      </article>

      <article className="about-card" aria-labelledby="quem-participa">
        <h2 id="quem-participa" className="about-card__title">
          Quem participa
        </h2>
        <p className="about-card__text">
          O projeto é desenvolvido com a participação da comunidade universitária: técnicos
          administrativos, professores, profissionais terceirizados e estudantes. Muitas pessoas já
          auxiliavam os animais de forma isolada; o Peludinhos organiza essas ações de maneira mais
          efetiva e responsável.
        </p>
      </article>

      <article className="about-card" aria-labelledby="conscientizacao">
        <h2 id="conscientizacao" className="about-card__title">
          Conscientização
        </h2>
        <p className="about-card__text">
          É proibido abandonar animais nas dependências da UFOPA. O abandono e os maus-tratos são
          crimes, conforme a Lei nº 9.605/98. O projeto busca informar e sensibilizar a comunidade
          acadêmica para práticas de cuidado, respeito e adoção responsável.
        </p>
      </article>

      <article className="about-card" aria-labelledby="local">
        <h2 id="local" className="about-card__title">
          Local
        </h2>
        <p className="about-card__text">
          Universidade Federal do Oeste do Pará (UFOPA) – Campus Santarém, Pará.
        </p>
      </article>

      <article className="about-card" aria-labelledby="contato">
        <h2 id="contato" className="about-card__title">
          Contato
        </h2>
        <p className="about-card__text">
          Professora responsável: <strong>Cintya Martins</strong> – Instituto de Engenharia e
          Geociências (IEG/UFOPA).
        </p>
      </article>

      <article className="about-card" aria-labelledby="info-gerais">
        <h2 id="info-gerais" className="about-card__title">
          Informações gerais
        </h2>
        <dl className="about-dl">
          <div className="about-dl__row">
            <dt className="about-dl__term">Data da publicação (UFOPA)</dt>
            <dd className="about-dl__desc">11 de abril de 2019 (atualização: 17 de abril de 2019)</dd>
          </div>
          <div className="about-dl__row">
            <dt className="about-dl__term">Fonte</dt>
            <dd className="about-dl__desc">
              <a
                href="https://www.ufopa.edu.br/ufopa/comunica/noticias/projeto-peludinhos-da-ufopa-pretende-cuidar-de-animais-e-evitar-abandono-no-campus/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link"
              >
                UFOPA – Notícia: “Projeto Peludinhos da UFOPA pretende cuidar de animais e evitar
                abandono no campus”
              </a>
            </dd>
          </div>
        </dl>
      </article>
    </section>
  );
}
