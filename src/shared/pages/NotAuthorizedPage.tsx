import { Link } from 'react-router-dom';

export function NotAuthorizedPage() {
  return (
    <main className="status-page">
      <h1>Acesso não autorizado</h1>
      <p>Você não tem permissão para acessar esta página.</p>
      <div className="status-page__actions">
        <Link to="/" className="pub-btn pub-btn--primary">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
