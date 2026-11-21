import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../../shared/api/httpsClient';
import { authService } from '../services/authService';
import { ResetPasswordPage } from './ResetPasswordPage';

vi.mock('../services/authService', () => ({
  authService: { recover: vi.fn(), resetPassword: vi.fn() },
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/recuperar-senha" element={<div>Solicitar novo link</div>} />
        <Route path="/login" element={<div>Login de destino</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillForm(password = 'senha-forte-123', confirmation = password) {
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirmar nova senha'), {
    target: { value: confirmation },
  });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /Redefinir senha/i }));
}

const TOKEN = 'token-do-email-123';

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.resetPassword).mockResolvedValue({ message: 'ok' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lê o token do fragmento, envia a nova senha e vai para o login', async () => {
    renderAt(`/redefinir-senha#access_token=${TOKEN}&type=recovery`);
    fillForm();
    submit();

    expect(authService.resetPassword).toHaveBeenCalledTimes(1);
    expect(authService.resetPassword).toHaveBeenCalledWith(TOKEN, 'senha-forte-123');
    expect(await screen.findByText('Login de destino')).toBeInTheDocument();
  });

  it('lê o token da query string', async () => {
    renderAt(`/redefinir-senha?access_token=${TOKEN}&type=recovery`);
    fillForm('outra-senha-123');
    submit();

    expect(authService.resetPassword).toHaveBeenCalledWith(TOKEN, 'outra-senha-123');
    expect(await screen.findByText('Login de destino')).toBeInTheDocument();
  });

  it('bloqueia o formulário quando não há token de recuperação', () => {
    renderAt('/redefinir-senha?code=pkce-sem-token');

    expect(screen.getByRole('alert')).toHaveTextContent(
      /Link de recuperação inválido ou expirado/i,
    );
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /Solicitar novo link/i })).toHaveAttribute(
      'href',
      '/recuperar-senha',
    );
    expect(screen.getByRole('link', { name: /Solicitar novo link/i })).toHaveAttribute(
      'data-slot',
      'button',
    );
  });

  it('rejeita senhas que não coincidem sem chamar a API', () => {
    renderAt(`/redefinir-senha#access_token=${TOKEN}`);
    fillForm('senha-forte-123', 'senha-diferente-123');
    submit();

    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem.');
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('exige no mínimo 8 caracteres, como no cadastro', () => {
    renderAt(`/redefinir-senha#access_token=${TOKEN}`);
    fillForm('curta');
    submit();

    expect(screen.getByRole('alert')).toHaveTextContent('Use ao menos 8 caracteres.');
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('mostra a mensagem da API sem sair da página', async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue(
      new HttpError(400, 'Token inválido ou expirado.', null),
    );

    renderAt(`/redefinir-senha#access_token=${TOKEN}`);
    fillForm();
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Token inválido ou expirado.');
    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument();
  });

  it('desabilita o botão enquanto salva', async () => {
    let finish!: (value: { message: string }) => void;
    vi.mocked(authService.resetPassword).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );

    renderAt(`/redefinir-senha#access_token=${TOKEN}`);
    fillForm();
    submit();
    const button = screen.getByRole('button', { name: /Salvando/i });
    expect(button).toBeDisabled();

    finish({ message: 'ok' });
    expect(await screen.findByText('Login de destino')).toBeInTheDocument();
  });

  it('alterna a visibilidade das duas senhas', () => {
    renderAt(`/redefinir-senha#access_token=${TOKEN}`);
    const password = screen.getByLabelText('Nova senha');
    const confirmation = screen.getByLabelText('Confirmar nova senha');

    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(password).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(password).toHaveAttribute('type', 'password');

    expect(confirmation).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar confirmação' }));
    expect(confirmation).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar confirmação' }));
    expect(confirmation).toHaveAttribute('type', 'password');
  });

  it('usa o design system no cartão, campos e botões', () => {
    renderAt(`/redefinir-senha#access_token=${TOKEN}`);

    const heading = screen.getByRole('heading', { name: 'Nova senha' });
    expect(heading.closest('[data-slot="card"]')).toBeInTheDocument();
    expect(heading.closest('[data-slot="card-header"]')).toHaveClass('bg-marker');
    expect(screen.getByLabelText('Nova senha')).toHaveClass('tf__input');
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveClass('tf__input');
    expect(screen.getByRole('button', { name: 'Mostrar senha' })).toHaveAttribute(
      'data-variant',
      'link',
    );
    expect(screen.getByRole('button', { name: /Redefinir senha/i })).toHaveAttribute(
      'data-slot',
      'button',
    );
    expect(screen.getByRole('link', { name: /Voltar para o login/i })).toHaveAttribute(
      'data-slot',
      'button',
    );
  });
});
