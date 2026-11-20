import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../../shared/api/httpsClient';
import { authService } from '../services/authService';
import { ForgotPasswordPage } from './ForgotPasswordPage';

vi.mock('../services/authService', () => ({
  authService: { recover: vi.fn(), resetPassword: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.recover).mockResolvedValue({ message: 'ok' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra o campo de e-mail, o botão e o link de voltar ao login', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /recuperar senha/i })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('type', 'email');
    expect(screen.getByRole('button', { name: /Enviar instruções/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Voltar para o login/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('envia apenas o e-mail e mostra confirmação neutra', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@peludinhos.org' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar instruções/i }));

    expect(authService.recover).toHaveBeenCalledTimes(1);
    expect(authService.recover).toHaveBeenCalledWith('ana@peludinhos.org');
    expect(
      await screen.findByText(/Se o e-mail existir, enviaremos as instruções/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Enviar instruções/i })).not.toBeInTheDocument();
  });

  it('mostra a mensagem da API em caso de erro', async () => {
    vi.mocked(authService.recover).mockRejectedValue(
      new HttpError(429, 'Muitas tentativas', null),
    );

    renderPage();
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@peludinhos.org' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar instruções/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas');
    expect(
      screen.queryByText(/Se o e-mail existir, enviaremos as instruções/i),
    ).not.toBeInTheDocument();
  });

  it('desabilita o botão e avisa que está enviando', async () => {
    let finish!: (value: { message: string }) => void;
    vi.mocked(authService.recover).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );

    renderPage();
    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'ana@peludinhos.org' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar instruções/i }));
    const button = screen.getByRole('button', { name: /Enviando/i });
    expect(button).toBeDisabled();

    finish({ message: 'ok' });
    expect(
      await screen.findByText(/Se o e-mail existir, enviaremos as instruções/i),
    ).toBeInTheDocument();
  });
});
