import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HttpError } from '../../../shared/api/httpsClient';
import { PawIcon } from '../../../shared/components/PawIcon';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { authService } from '../services/authService';
import { extractRecoveryToken } from '../utils/recoveryToken';

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
    <main className="flex min-h-svh items-center justify-center bg-paper px-6 py-10">
      <Card className="w-full max-w-md gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-col items-center gap-4 bg-marker px-6 py-8 text-center text-ink">
          <div className="flex items-center gap-2">
            <PawIcon size={28} />
            <span className="font-display text-sm font-bold uppercase tracking-[0.08em]">
              Peludinhos
            </span>
          </div>
          <CardTitle className="text-3xl leading-tight font-normal text-ink">
            Nova senha
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 px-6 py-8">
          {!token ? (
            <div className="flex flex-col gap-5">
              <p
                role="alert"
                className="rounded-xl bg-[#F6E1DA] px-4 py-3 text-sm font-bold text-[#7A2E20]"
              >
                Link de recuperação inválido ou expirado. Solicite um novo e-mail.
              </p>
              <Button asChild className="w-full">
                <Link to="/recuperar-senha">Solicitar novo link</Link>
              </Button>
            </div>
          ) : (
            <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
              <p className="text-sm leading-relaxed text-muted">
                Escolha uma nova senha para acessar o painel.
              </p>

              <div className="tf">
                <label className="tf__label" htmlFor="new-password">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    className="tf__input pr-28"
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
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 px-2 text-xs text-ink hover:text-ink"
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  </Button>
                </div>
              </div>

              <div className="tf">
                <label className="tf__label" htmlFor="confirm-password">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <input
                    className="tf__input pr-32"
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
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 px-2 text-xs text-ink hover:text-ink"
                    onClick={() => setShowConfirmation((visible) => !visible)}
                  >
                    {showConfirmation ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted">Mínimo de {MIN_PASSWORD_LENGTH} caracteres.</p>

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-[#F6E1DA] px-4 py-3 text-sm font-bold text-[#7A2E20]"
                >
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    />
                    Salvando...
                  </span>
                ) : (
                  'Redefinir senha'
                )}
              </Button>

              <Button asChild variant="link" className="self-center text-ink">
                <Link to="/login">Voltar para o login</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
