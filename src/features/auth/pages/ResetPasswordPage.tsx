import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HttpError } from '../../../shared/api/httpsClient';
import { PawIcon } from '../../../shared/components/PawIcon';
import { authService } from '../services/authService';
import { extractRecoveryToken } from '../utils/recoveryToken';
import './Login.css';

/** Mesma regra do cadastro de visitante e do formulário de membro. */
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const FALLBACK_ERROR =
  'Não foi possível redefinir a senha. Solicite um novo link de recuperação.';

/** A API devolve `{"detail": ...}`; HttpError já extrai esse texto. */
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError && error.message ? error.message : fallback;
}

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // O token é lido do fragmento/query da URL e nunca é logado: é credencial
  // de uso único. Ver `utils/recoveryToken.ts` para os formatos aceitos.
  const token = extractRecoveryToken(location.search, location.hash);

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!token) return;

    // noValidate no form: as mensagens abaixo são as mesmas do cadastro.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use ao menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      setError(`Use no máximo ${MAX_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      navigate('/login', { replace: true, state: { passwordReset: true } });
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
          <h1 className="login-card__title">Nova senha</h1>
        </div>

        {!token ? (
          <div className="login-form">
            <p className="login-form__error" role="alert">
              Link de recuperação inválido ou expirado. Solicite um novo e-mail.
            </p>
            <Link className="login-button login-button--link" to="/recuperar-senha">
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <p className="login-form__intro">Escolha uma nova senha para acessar o painel.</p>

            <div className="field">
              <label className="field__label" htmlFor="new-password">
                Nova senha
              </label>
              <div className="field__wrapper">
                <input
                  className="field__input field__input--password"
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className="field__toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                </button>
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="confirm-password">
                Confirmar nova senha
              </label>
              <div className="field__wrapper">
                <input
                  className="field__input field__input--password"
                  id="confirm-password"
                  type={showConfirmation ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  required
                  placeholder="••••••••"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
                <button
                  className="field__toggle"
                  type="button"
                  onClick={() => setShowConfirmation((visible) => !visible)}
                >
                  {showConfirmation ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                </button>
              </div>
            </div>

            <p className="login-form__hint">Mínimo de {MIN_PASSWORD_LENGTH} caracteres.</p>

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
                  Salvando...
                </span>
              ) : (
                'Redefinir senha'
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
