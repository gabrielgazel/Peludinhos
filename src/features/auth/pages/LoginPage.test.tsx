import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../../shared/api/httpsClient';
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

function renderAt(
  entry: string | { pathname: string; state?: unknown },
  login = vi.fn().mockResolvedValue(user),
) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    login,
  } as unknown as ReturnType<typeof useAuth>);
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home pública</div>} />
        <Route path="/painel" element={<div>Painel da equipe</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function submitCredentials() {
  fireEvent.change(screen.getByLabelText('E-mail ou usuário'), {
    target: { value: 'ana@peludinhos.org' },
  });
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: 'segredo123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
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

  it('envia credenciais e vai para o painel por padrão', async () => {
    const login = vi.fn().mockResolvedValue(user);
    renderAt('/login', login);

    await submitCredentials();

    expect(login).toHaveBeenCalledWith({
      email: 'ana@peludinhos.org',
      password: 'segredo123',
    });
    expect(await screen.findByText('Painel da equipe')).toBeInTheDocument();
  });

  it.each([401, 422])('mostra erro de credenciais para HTTP %i', async (status) => {
    renderAt('/login', vi.fn().mockRejectedValue(new HttpError(status, 'x', null)));

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
  });

  it('mostra erro de e-mail não confirmado para HTTP 403', async () => {
    renderAt('/login', vi.fn().mockRejectedValue(new HttpError(403, 'x', null)));

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ainda não confirmado. Fale com a equipe.',
    );
  });

  it('mostra erro genérico para outras falhas', async () => {
    renderAt('/login', vi.fn().mockRejectedValue(new Error('boom')));

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível entrar agora. Tenta de novo em instantes.',
    );
  });

  it('desabilita o botão e avisa que está entrando', async () => {
    let finish!: (value: AuthUser) => void;
    const login = vi.fn().mockReturnValue(
      new Promise<AuthUser>((resolve) => {
        finish = resolve;
      }),
    );
    renderAt('/login', login);

    await submitCredentials();

    const button = screen.getByRole('button', { name: /Entrando/i });
    expect(button).toBeDisabled();
    expect(login).toHaveBeenCalledTimes(1);

    finish(user);
    expect(await screen.findByText('Painel da equipe')).toBeInTheDocument();
  });

  it('alterna a visibilidade da senha', () => {
    renderAt('/login');
    const password = screen.getByLabelText('Senha');

    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    expect(password).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('usa o design system no cartão, campos e botões', () => {
    renderAt('/login');

    const heading = screen.getByRole('heading', { name: /Acesso\s+da equipe/i });
    expect(heading.closest('[data-slot="card"]')).toBeInTheDocument();
    expect(heading.closest('[data-slot="card-header"]')).toHaveClass('bg-marker');
    expect(screen.getByLabelText('E-mail ou usuário')).toHaveClass('tf__input');
    expect(screen.getByLabelText('Senha')).toHaveClass('tf__input');
    expect(screen.getByRole('button', { name: 'Mostrar' })).toHaveAttribute(
      'data-variant',
      'link',
    );
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveAttribute(
      'data-slot',
      'button',
    );
    expect(screen.getByRole('link', { name: /Esqueci minha senha/i })).toHaveAttribute(
      'data-slot',
      'button',
    );
  });
});
