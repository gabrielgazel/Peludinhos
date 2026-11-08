import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="status-page">
      <h1>404</h1>
      <p>A página que você procura não existe ou foi movida.</p>
      <div className="status-page__actions">
        <Link to="/" className="pub-btn pub-btn--primary">
          Voltar ao início
        </Link>
        <Link to="/adocao" className="pub-btn pub-btn--secondary">
          Ver animais para adoção
        </Link>
      </div>
    </section>
  );
}
