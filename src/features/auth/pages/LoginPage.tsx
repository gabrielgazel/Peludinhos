import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { HttpError } from '../../../shared/api/httpsClient'
import './Login.css'

function CatPaw() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="14" cy="17" rx="7" ry="6" fill="currentColor" />
      <ellipse cx="7" cy="11" rx="3.5" ry="4.5" fill="currentColor" />
      <ellipse cx="21" cy="11" rx="3.5" ry="4.5" fill="currentColor" />
      <ellipse cx="10.5" cy="6.5" rx="2.5" ry="3" fill="currentColor" />
      <ellipse cx="17.5" cy="6.5" rx="2.5" ry="3" fill="currentColor" />
    </svg>
  )
}

interface LocationState {
  from?: Location
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
      await login({ email, password })

      // Volta pra rota que o usuário tentou acessar antes de cair
      // no /login (guardada pelo ProtectedRoute); sem isso, vai pra home.
      const state = location.state as LocationState | null
      navigate(state?.from?.pathname ?? '/', { replace: true })
    } catch (err) {
      if (err instanceof HttpError && (err.status === 401 || err.status === 422)) {
        setError('E-mail ou senha inválidos.')
      } else {
        setError('Não foi possível entrar agora. Tenta de novo em instantes.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__dots" />

      <div className="deco deco--md deco--1" />
      <div className="deco deco--md deco--2" />
      <div className="deco deco--lg deco--3" />
      <div className="deco deco--lg deco--4" />

      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__brand">
            <CatPaw />
            <span className="login-card__brand-name">Peludinhos</span>
          </div>
          <h1 className="login-card__title">
            ACESSO
            <br />
            DA EQUIPE
          </h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="email">
              E-mail ou usuário
            </label>
            <input
              className="field__input"
              id="email"
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="equipe@peludinhos.org"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">
              Senha
            </label>
            <div className="field__wrapper">
              <input
                className="field__input field__input--password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••"
              />
              <button
                className="field__toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && (
            <p className="login-form__error" role="alert">
              {error}
            </p>
          )}

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
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>

          <p className="login-form__note">
            Acesso restrito à equipe do abrigo.
            <br />
            Fale com o administrador se precisar de uma conta.
          </p>
        </form>
      </div>
    </div>
  )
}