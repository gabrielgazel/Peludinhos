import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUp, Menu, X } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { PawIcon } from '../components/PawIcon';
import './PublicLayout.css';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Casca das páginas públicas (visitantes): cabeçalho com "Adoção"
 * em destaque, menu desdobrável no celular, link discreto para o
 * acesso da equipe e rodapé com atalhos de navegação.
 */
export function PublicLayout() {
  const { pathname, hash } = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Fecha o menu móvel quando a localização muda (inclusive voltar/
  // avançar do navegador). Padrão do React para estado derivado:
  // ajustar o estado durante o render, não em efeito.
  const locationKey = pathname + hash;
  const [lastLocationKey, setLastLocationKey] = useState(locationKey);
  if (lastLocationKey !== locationKey) {
    setLastLocationKey(locationKey);
    setMenuOpen(false);
  }

  // Rola para o topo ao trocar de página e para a seção quando a
  // rota traz um hash (ex.: /#projeto vindos do rodapé ou de "/sobre").
  useEffect(() => {
    const targetId = hash.replace(/^#/, '');
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  return (
    <div className="pub">
      <header className="pub-header">
        <div className="pub-container pub-header__inner">
          <Link to="/" className="pub-brand">
            <PawIcon size={26} />
            <span>Peludinhos</span>
          </Link>

          <button
            type="button"
            className="pub-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="pub-nav"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>

          <nav
            id="pub-nav"
            className={`pub-nav${menuOpen ? ' pub-nav--open' : ''}`}
            aria-label="Principal"
            onClick={() => setMenuOpen(false)}
          >
            <Link to="/#projeto" className="pub-nav__link">
              O projeto
            </Link>
            <NavLink to="/adocao" className="pub-btn pub-btn--primary pub-btn--sm">
              Quero adotar
            </NavLink>
            {isAuthenticated && user ? (
              <div className="pub-nav__auth">
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
              </div>
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
          <div className="pub-footer__brand">
            <PawIcon size={22} />
            <div>
              <p className="pub-footer__name">Peludinhos</p>
              <p className="pub-footer__tag">Projeto de Extensão da UFOPA · Campus Santarém</p>
            </div>
          </div>

          <nav className="pub-footer__links" aria-label="Rodapé">
            <Link to="/#projeto">O projeto</Link>
            <Link to="/adocao">Adoção</Link>
            <Link to="/login">Acesso da equipe</Link>
          </nav>

          <button type="button" className="pub-footer__top" onClick={scrollToTop}>
            Voltar ao topo
            <ArrowUp size={16} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  );
}
