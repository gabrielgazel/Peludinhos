import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import type { NavLinkProps } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PawPrint,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin, roleLabel } from '../../../shared/types/role.types';
import { cn } from '../../../shared/lib/utils';

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

const GERAL_ITEMS: NavItem[] = [
  { to: '/painel', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/painel/animais', label: 'Animais', icon: PawPrint, end: false },
  { to: '/painel/operacao/pontos', label: 'Pontos', icon: MapPin, end: false },
  { to: '/painel/operacao/turnos', label: 'Turnos', icon: Clock, end: false },
  { to: '/painel/intencoes', label: 'Intenções', icon: ClipboardList, end: false },
];

const MEMBROS_ITEM: NavItem = { to: '/painel/membros', label: 'Membros', icon: Users, end: false };

const FOCUS_CLASSES =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent';

const NAV_LINK_BASE_CLASSES =
  'flex min-h-[44px] items-center gap-2.5 rounded-lg border-l-2 border-transparent px-3 py-2 text-[15px] font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent';

export function StaffLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((open) => !open);

  const navLinkClass: NavLinkProps['className'] = ({ isActive }) =>
    cn(
      NAV_LINK_BASE_CLASSES,
      isActive
        ? 'border-staff-accent bg-staff-accent-soft text-staff-ink'
        : 'text-staff-muted hover:bg-staff-bg hover:text-staff-ink',
    );

  const renderNavItem = ({ to, label, icon: Icon, end }: NavItem) => (
    <li key={to}>
      <NavLink to={to} end={end} className={navLinkClass} onClick={closeMenu}>
        <Icon size={18} aria-hidden="true" className="shrink-0" />
        <span>{label}</span>
      </NavLink>
    </li>
  );

  return (
    <div className="flex min-h-svh flex-col bg-staff-bg font-body text-staff-ink">
      <header className="sticky top-0 z-30 border-b border-staff-line bg-staff-surface">
        <div className="mx-auto flex min-h-16 w-full max-w-[1240px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className={cn(
                'grid min-h-[44px] min-w-[44px] place-items-center rounded-lg text-staff-muted transition-colors hover:bg-staff-bg hover:text-staff-ink motion-reduce:transition-none lg:hidden',
                FOCUS_CLASSES,
              )}
              aria-expanded={menuOpen}
              aria-controls="painel-navegacao"
              aria-label={menuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
              onClick={toggleMenu}
            >
              {menuOpen ? (
                <X size={24} aria-hidden="true" />
              ) : (
                <Menu size={24} aria-hidden="true" />
              )}
            </button>
            <Link
              to="/"
              className={cn(
                'inline-flex min-h-11 items-center gap-2.5 font-display text-xl font-bold text-staff-ink',
                FOCUS_CLASSES,
              )}
            >
              <PawPrint size={22} aria-hidden="true" className="text-staff-accent" />
              <span>Peludinhos</span>
              <span className="rounded-full bg-staff-accent-soft px-2 py-0.5 font-body text-[11px] font-bold tracking-[0.08em] text-staff-ink uppercase">
                Painel
              </span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <span className="text-sm font-bold text-staff-ink">{user?.name}</span>
            <span className="rounded-full border border-staff-line bg-staff-bg px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-staff-muted">
              {roleLabel(user?.role)}
            </span>
            <button
              type="button"
              className={cn(
                'inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-staff-line px-3 text-sm font-semibold text-staff-muted transition-colors hover:bg-staff-bg hover:text-staff-ink motion-reduce:transition-none',
                FOCUS_CLASSES,
              )}
              onClick={() => void logout()}
            >
              <LogOut size={16} aria-hidden="true" className="shrink-0" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          aria-hidden="true"
          onClick={closeMenu}
          className="fixed inset-0 z-30 bg-staff-ink/40 lg:hidden"
        />
      )}

      <div className="mx-auto flex w-full max-w-[1240px] flex-1 items-stretch">
        <aside
          id="painel-navegacao"
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-[220px] shrink-0 overflow-y-auto border-r border-staff-line bg-staff-surface p-4 transition-[transform,visibility] duration-200 motion-reduce:transition-none',
            menuOpen ? 'translate-x-0' : '-translate-x-full',
            menuOpen ? 'visible' : 'invisible',
            'lg:sticky lg:top-16 lg:right-auto lg:bottom-auto lg:left-auto lg:z-auto lg:h-[calc(100svh-4rem)] lg:visible lg:translate-x-0 lg:self-start',
          )}
        >
          <div className="mb-1 flex justify-end lg:hidden">
            <button
              type="button"
              className={cn(
                'grid min-h-[44px] min-w-[44px] place-items-center rounded-lg text-staff-muted transition-colors hover:bg-staff-bg hover:text-staff-ink motion-reduce:transition-none',
                FOCUS_CLASSES,
              )}
              aria-label="Fechar navegação"
              onClick={closeMenu}
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Painel">
            <div>
              <h2 className="px-3 pt-1 font-body text-[11px] font-bold tracking-[0.08em] text-staff-muted uppercase">
                Geral
              </h2>
              <ul className="mt-2 flex flex-col gap-1">{GERAL_ITEMS.map(renderNavItem)}</ul>
            </div>

            {isAdmin(user?.role) && (
              <div className="mt-5">
                <h2 className="px-3 pt-1 font-body text-[11px] font-bold tracking-[0.08em] text-staff-muted uppercase">
                  Equipe
                </h2>
                <ul className="mt-2 flex flex-col gap-1">{renderNavItem(MEMBROS_ITEM)}</ul>
              </div>
            )}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 bg-staff-bg p-4 text-staff-ink sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
