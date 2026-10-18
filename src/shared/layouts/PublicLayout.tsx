import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { PawIcon } from '../components/PawIcon';
import './PublicLayout.css';

/**
 * Casca das páginas públicas (visitantes): cabeçalho com "Adoção"
 * em destaque, link discreto para o acesso da equipe e rodapé.
 */
export function PublicLayout() {
  const { pathname } = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="pub">
      <header className="pub-header">
        <div className="pub-container pub-header__inner">
          <Link to="/" className="pub-brand">
            <PawIcon size={26} />
            <span>Peludinhos</span>
          </Link>

          <nav className="pub-nav" aria-label="Principal">
            <NavLink to="/sobre" className="pub-nav__link">
              Sobre o projeto
            </NavLink>
            <NavLink to="/adocao" className="pub-btn pub-btn--primary pub-btn--sm">
              Quero adotar
            </NavLink>
            {isAuthenticated && user ? (
              <>
                {user.role !== 'visitante' && (
                  <Link to="/painel" className="pub-btn pub-btn--secondary pub-btn--sm">
                    Painel
                  </Link>
                )}
                <button
                  type="button"
                  className="pub-btn pub-btn--ghost pub-btn--sm"
                  onClick={() => void logout()}
                >
                  Sair
                </button>
              </>
            ) : (
              <Link to="/login" className="pub-btn pub-btn--ghost pub-btn--sm">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="pub-main">
        <Outlet />
      </main>

      <footer className="pub-footer">
        <div className="pub-container pub-footer__inner">
          <p>Peludinhos · Projeto de Extensão da Ufopa</p>
          <Link to="/login" className="pub-footer__link">
            Acesso da equipe
          </Link>
        </div>
      </footer>
    </div>
  );
}
