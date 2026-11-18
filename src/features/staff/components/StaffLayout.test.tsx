import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../auth/context/auth-context';
import type { AuthContextValue } from '../../auth/context/auth-context';
import type { AuthUser } from '../../auth/types/auth.types';
import { StaffLayout } from './StaffLayout';

const adminUser: AuthUser = {
  id: 'user-admin-1',
  email: 'admin@peludinhos.example',
  name: 'Maria Silva',
  actorType: 'membro',
  role: 'administrador',
  memberId: 42,
  visitorId: null,
};

const bolsistaUser: AuthUser = {
  ...adminUser,
  id: 'user-bolsista-1',
  email: 'bolsista@peludinhos.example',
  role: 'bolsista',
};

function renderLayout(
  user: AuthUser,
  logout = vi.fn(async () => {}),
  initialEntries = ['/painel'],
) {
  const authValue: AuthContextValue = {
    user,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(async () => user),
    register: vi.fn(async () => user),
    logout,
  };

  render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/painel" element={<StaffLayout />}>
            <Route index element={<div>conteúdo da página</div>} />
            <Route path="animais" element={<div>conteúdo da página</div>} />
            <Route path="intencoes" element={<div>conteúdo da página</div>} />
            <Route path="membros" element={<div>conteúdo da página</div>} />
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  return { logout };
}

describe('StaffLayout', () => {
  it('exibe a marca Peludinhos e a tag Painel', () => {
    renderLayout(adminUser);

    expect(screen.getByText('Peludinhos')).toBeInTheDocument();
    expect(screen.getByText('Painel')).toBeInTheDocument();
  });

  it('exibe o nome do usuário e o rótulo do papel', () => {
    renderLayout(adminUser);

    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('exibe a navegação com Visão geral, Animais, Turnos e Intenções', () => {
    renderLayout(adminUser);

    expect(screen.getByRole('link', { name: 'Visão geral' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Animais' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Turnos' })).toHaveAttribute(
      'href',
      '/painel/operacao/turnos',
    );
    expect(screen.getByRole('link', { name: 'Intenções' })).toBeInTheDocument();
  });

  it('agrupa a navegação em Geral e Equipe', () => {
    renderLayout(adminUser);

    expect(screen.getByRole('heading', { name: 'Geral' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Equipe' })).toBeInTheDocument();
  });

  it('exibe Membros para administrador', () => {
    renderLayout(adminUser);

    expect(screen.getByRole('link', { name: 'Membros' })).toBeInTheDocument();
  });

  it('oculta Membros para bolsista', () => {
    renderLayout(bolsistaUser);

    expect(screen.queryByRole('link', { name: 'Membros' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Equipe' })).not.toBeInTheDocument();
  });

  it('marca o item da rota atual com aria-current="page"', () => {
    renderLayout(adminUser);

    expect(screen.getByRole('link', { name: 'Visão geral' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Animais' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Intenções' })).not.toHaveAttribute('aria-current');
  });

  it('chama logout ao clicar em Sair', () => {
    const { logout } = renderLayout(adminUser);

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('oferece botão hambúrguer acessível e fecha ao clicar num link', () => {
    renderLayout(adminUser);

    const toggle = screen.getByRole('button', { name: /menu de navegação/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'painel-navegacao');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('link', { name: 'Animais' }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
