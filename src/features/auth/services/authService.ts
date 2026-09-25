import { httpClient } from '../../../shared/api/httpsClient.ts';
import type { AuthUser, LoginCredentials, LoginResponse } from '../types/auth.types';

/**
 * Endpoints ainda são um placeholder — ajustar os paths quando a
 * autenticação da peludinhos-api estiver confirmada com o backend.
 */
export const authService = {
  login: (credentials: LoginCredentials) =>
    httpClient.post<LoginResponse>('/auth/login', credentials),

  me: () => httpClient.get<AuthUser>('/auth/me'),

  logout: () => httpClient.post<void>('/auth/logout'),
};