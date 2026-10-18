import { createContext } from 'react';
import type {
  AuthUser,
  LoginCredentials,
  VisitorRegisterPayload,
} from '../types/auth.types';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Autentica e retorna o usuário (para redirecionar por papel). */
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  /** Autocadastro de visitante; já deixa o usuário autenticado. */
  register: (payload: VisitorRegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
