import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PawPrint,
  Users,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin, roleLabel } from '../../../shared/types/role.types';
import '../staff.css';

const NAV_ITEMS = [
  { to: '/painel', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/painel/animais', label: 'Animais', icon: PawPrint, end: false },
  { to: '/painel/intencoes', label: 'Intenções', icon: ClipboardList, end: false },
];

export function StaffLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="staff">
      <header className="staff-topbar">
        <Link to="/" className="staff-brand">
          <PawPrint size={22} aria-hidden="true" />
          <span>Peludinhos</span>
          <span className="staff-brand__tag">painel</span>
        </Link>

        <div className="staff-user">
          <span className="staff-user__name">{user?.name}</span>
          <span className="staff-user__role">{roleLabel(user?.role)}</span>
          <button
            type="button"
            className="staff-logout"
            onClick={() => void logout()}
          >
            <LogOut size={16} aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      <div className="staff-body">
        <aside className="staff-sidebar">
          <nav className="staff-nav" aria-label="Painel">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="staff-nav__link"
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
            {isAdmin(user?.role) && (
              <NavLink to="/painel/membros" className="staff-nav__link">
                <Users size={18} aria-hidden="true" />
                <span>Membros</span>
              </NavLink>
            )}
          </nav>
        </aside>

        <main className="staff-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
