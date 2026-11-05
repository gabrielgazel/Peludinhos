import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Breadcrumbs.css';

export interface Crumb {
  label: string;
  /** Rota do item (ausente = página atual, texto puro). */
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

/**
 * Trilha de navegação das páginas aninhadas (detalhe do animal e
 * intenção de adoção). O primeiro item costuma ser a volta à listagem;
 * o último é a página atual (aria-current="page").
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="crumbs" aria-label="Trilha de navegação">
      <ol className="crumbs__list">
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
            <li className="crumbs__item" key={item.label}>
              {item.to && !last ? (
                <Link to={item.to} className="crumbs__link">
                  {item.label}
                </Link>
              ) : (
                <span className="crumbs__current" aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && (
                <ChevronRight className="crumbs__sep" size={14} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
