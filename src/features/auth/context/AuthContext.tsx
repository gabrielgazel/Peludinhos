import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { configureHttpClient, setAccessToken } from '../../../shared/api/httpsClient';
import { authService } from '../services/authService';
import type {
  AuthUser,
  LoginCredentials,
  Session,
  VisitorRegisterPayload,
} from '../types/auth.types';
import { AuthContext } from './auth-context';

const ACCESS_TOKEN_KEY = '@peludinhos:access-token';
const REFRESH_TOKEN_KEY = '@peludinhos:refresh-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Se já existe um access token salvo, começamos "carregando" até
  // validar a sessão via /auth/me — evita piscar a tela de login.
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem(ACCESS_TOKEN_KEY));

  const accessTokenRef = useRef<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  const refreshTokenRef = useRef<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));

  const persistSession = useCallback((session: Session) => {
    accessTokenRef.current = session.accessToken;
    refreshTokenRef.current = session.refreshToken;
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(() => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  // Renova a sessão a partir do refresh token. Devolve o novo access
  // token ou null (e limpa a sessão) quando o refresh também falha.
  const renewSession = useCallback(async (): Promise<string | null> => {
    const currentRefreshToken = refreshTokenRef.current;
    if (!currentRefreshToken) {
      return null;
    }
    try {
      const session = await authService.refresh(currentRefreshToken);
      persistSession(session);
      return session.accessToken;
    } catch {
      clearSession();
      return null;
    }
  }, [persistSession, clearSession]);

  // Registra no httpClient como renovar a sessão e o que fazer quando ela
  // é realmente inválida (401 após tentar refresh).
  useEffect(() => {
    setAccessToken(accessTokenRef.current);
    configureHttpClient({ refresh: renewSession, onUnauthorized: clearSession });
  }, [renewSession, clearSession]);

  // Ao carregar a aplicação, valida a sessão salva antes de liberar as
  // rotas protegidas (evita "piscar" a tela de login por um instante).
  useEffect(() => {
    if (!accessTokenRef.current) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    authService
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const session = await authService.login(credentials);
      persistSession(session);
      return session.user;
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: VisitorRegisterPayload) => {
      const session = await authService.register(payload);
      persistSession(session);
      return session.user;
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Sessão já inválida no servidor: descartar localmente resolve.
    }
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
