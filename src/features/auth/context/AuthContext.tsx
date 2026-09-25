import { useEffect, useState, type ReactNode } from 'react';
import { configureHttpClient } from '../../../shared/api/httpsClient'
import { authService } from '../services/authService';
import type { AuthUser, LoginCredentials } from '../types/auth.types';
import { AuthContext } from './auth-context';

const TOKEN_STORAGE_KEY = '@peludinhos:token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  // Se já existe um token salvo, começamos "carregando" pra tentar
  // recuperar o usuário via /auth/me antes de liberar as rotas
  // protegidas. Sem token, não há nada pra carregar.
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);

  function clearSession() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  // Registra no httpClient como pegar o token atual e o que fazer
  // quando a API responder 401 (sessão expirada/inválida).
  useEffect(() => {
    configureHttpClient({
      getToken: () => token,
      onUnauthorized: clearSession,
    });
  }, [token]);

  // Ao carregar a aplicação, se já existe um token salvo, tenta
  // recuperar o usuário autenticado antes de liberar as rotas
  // protegidas (evita "piscar" tela de login por um instante).
  useEffect(() => {
    if (!token) {
      return;
    }

    authService
      .me()
      .then(setUser)
      .catch(clearSession)
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(credentials: LoginCredentials) {
    const response = await authService.login(credentials);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }

  function logout() {
    authService.logout().catch(() => {});
    clearSession();
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}