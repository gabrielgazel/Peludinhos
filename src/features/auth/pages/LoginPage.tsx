import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, type Location } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { HttpError } from '../../../shared/api/httpsClient'
import { PawIcon } from '../../../shared/components/PawIcon'
import { Button } from '../../../shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card'

interface LocationState {
  from?: Location
  /** Marca o retorno do fluxo de redefinição de senha. */
  passwordReset?: boolean
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const user = await login({ email, password })

      // Volta pra rota que o usuário tentou acessar antes de cair no
      // /login (guardada pelo ProtectedRoute). Sem isso, a equipe vai
      // pro painel e o visitante para a home pública.
      const state = location.state as LocationState | null
      const fallback = user.role === 'visitante' ? '/' : '/painel'
      navigate(state?.from?.pathname ?? fallback, { replace: true })
    } catch (err) {
      if (err instanceof HttpError && (err.status === 401 || err.status === 422)) {
        setError('E-mail ou senha inválidos.')
      } else if (err instanceof HttpError && err.status === 403) {
        setError('E-mail ainda não confirmado. Fale com a equipe.')
      } else {
        setError('Não foi possível entrar agora. Tenta de novo em instantes.')
      }
    } finally {
      setLoading(false)
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
            Acesso{' '}
            <br />
            da equipe
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 px-6 py-8">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {(location.state as LocationState | null)?.passwordReset && (
              <p
                role="status"
                className="rounded-xl border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-ink"
              >
                Senha redefinida com sucesso. Faça login com a nova senha.
              </p>
            )}

            <div className="tf">
              <label className="tf__label" htmlFor="email">
                E-mail ou usuário
              </label>
              <input
                className="tf__input"
                id="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="equipe@peludinhos.org"
              />
            </div>

            <div className="tf">
              <label className="tf__label" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  className="tf__input pr-24"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••"
                />
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-xs text-ink hover:text-ink"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
            </div>

            <Button asChild variant="link" className="self-center text-ink">
              <Link to="/recuperar-senha">Esqueci minha senha</Link>
            </Button>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-[#F6E1DA] px-4 py-3 text-sm font-bold text-[#7A2E20]"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>

            <p className="text-center text-xs leading-relaxed text-muted">
              Acesso restrito à equipe do abrigo.
              <br />
              Fale com o administrador se precisar de uma conta.
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
