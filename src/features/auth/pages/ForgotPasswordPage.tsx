import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HttpError } from '../../../shared/api/httpsClient';
import { PawIcon } from '../../../shared/components/PawIcon';
import { authService } from '../services/authService';
import './Login.css';

const SUCCESS_MESSAGE = 'Se o e-mail existir, enviaremos as instruções.';
const FALLBACK_ERROR = 'Não foi possível enviar as instruções. Tente novamente em instantes.';

/** A API devolve `{"detail": ...}`; HttpError já extrai esse texto. */
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError && error.message ? error.message : fallback;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.recover(email);
      // A resposta é neutra de propósito: a API não diz se o e-mail existe.
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, FALLBACK_ERROR));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__brand">
            <PawIcon size={28} />
            <span className="login-card__brand-name">Peludinhos</span>
          </div>
          <h1 className="login-card__title">Recuperar senha</h1>
        </div>

        {sent ? (
          <div className="login-form">
            <p className="login-form__success" role="status">
              {SUCCESS_MESSAGE}
            </p>
            <p className="login-form__hint">
              Verifique sua caixa de entrada (e o spam). O link de recuperação pode expirar.
            </p>
            <Link className="login-button login-button--link" to="/login">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <p className="login-form__intro">
              Informe o e-mail da sua conta para receber as instruções de recuperação.
            </p>

            <div className="field">
              <label className="field__label" htmlFor="recovery-email">
                E-mail
              </label>
              <input
                className="field__input"
                id="recovery-email"
                type="email"
                autoComplete="email"
                placeholder="equipe@peludinhos.org"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            {error ? (
              <p className="login-form__error" role="alert">
                {error}
              </p>
            ) : null}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? (
                <span className="login-button__content">
                  <svg
                    className="login-button__spinner"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="9"
                      cy="9"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="35 10"
                    />
                  </svg>
                  Enviando...
                </span>
              ) : (
                'Enviar instruções'
              )}
            </button>

            <Link className="login-form__link" to="/login">
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
