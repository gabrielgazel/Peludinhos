import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { HttpError } from '../../../shared/api/httpsClient';
import { PawIcon } from '../../../shared/components/PawIcon';
import { Button } from '../../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card';
import { authService } from '../services/authService';

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
            Recuperar senha
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 px-6 py-8">
          {sent ? (
            <div className="flex flex-col gap-5">
              <p
                role="status"
                className="rounded-xl border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-ink"
              >
                {SUCCESS_MESSAGE}
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Verifique sua caixa de entrada (e o spam). O link de recuperação pode expirar.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <p className="text-sm leading-relaxed text-muted">
                Informe o e-mail da sua conta para receber as instruções de recuperação.
              </p>

              <div className="tf">
                <label className="tf__label" htmlFor="recovery-email">
                  E-mail
                </label>
                <input
                  className="tf__input"
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
                    Enviando...
                  </span>
                ) : (
                  'Enviar instruções'
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
