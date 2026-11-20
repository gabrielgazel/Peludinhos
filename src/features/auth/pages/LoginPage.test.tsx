import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../types/auth.types';
import { useAuth } from '../hooks/useAuth';
import { LoginPage } from './LoginPage';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));

const user: AuthUser = {
  id: 'user-1',
  email: 'ana@peludinhos.org',
  name: 'Ana Souza',
  actorType: 'membro',
  role: 'voluntario',
  memberId: 5,
  visitorId: null,
};

function renderAt(entry: string | { pathname: string; state?: unknown }) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    login: vi.fn().mockResolvedValue(user),
  } as unknown as ReturnType<typeof useAuth>);
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('oferece o link para recuperação de senha', () => {
    renderAt('/login');

    expect(screen.getByRole('link', { name: /Esqueci minha senha/i })).toHaveAttribute(
      'href',
      '/recuperar-senha',
    );
  });

  it('mostra a confirmação depois que a senha foi redefinida', () => {
    renderAt({ pathname: '/login', state: { passwordReset: true } });

    expect(screen.getByRole('status')).toHaveTextContent(
      /Senha redefinida com sucesso/i,
    );
  });
});
