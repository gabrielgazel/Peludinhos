import { httpClient } from '../../../shared/api/httpsClient';
import type { MessageOut } from '../../../shared/api/types';
import type {
  ApiMe,
  ApiSession,
  ApiUser,
  LoginCredentials,
  Session,
  VisitorRegisterPayload,
} from '../types/auth.types';

/** Converte o usuário da API (snake_case) no formato usado pelo front. */
export function mapApiUser(user: ApiUser): Session['user'] {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    actorType: user.actor_type,
    // Visitante não tem `role` na API; usamos 'visitante' no RBAC.
    role: user.actor_type === 'visitante' ? 'visitante' : (user.role ?? 'voluntario'),
    memberId: user.member_id,
    visitorId: user.visitor_id,
  };
}

function mapSession(session: ApiSession): Session {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    user: mapApiUser(session.user),
  };
}

export const authService = {
  login: (credentials: LoginCredentials) =>
    httpClient
      .post<ApiSession>('/auth/login', credentials)
      .then(mapSession),

  register: (payload: VisitorRegisterPayload) =>
    httpClient
      .post<ApiSession>('/auth/register', {
        email: payload.email,
        password: payload.password,
        name: payload.name,
        birth_date: payload.birthDate ?? null,
        cpf: payload.cpf ?? null,
        is_ufopa_member: payload.isUfopaMember,
        has_pet: payload.hasPet,
        address: payload.address
          ? {
              street: payload.address.street,
              number: payload.address.number,
              neighborhood: payload.address.neighborhood,
              cep: payload.address.cep,
              reference_point: payload.address.referencePoint ?? null,
            }
          : null,
      })
      .then(mapSession),

  refresh: (refreshToken: string) =>
    httpClient
      .post<ApiSession>('/auth/refresh', { refresh_token: refreshToken })
      .then(mapSession),

  me: () =>
    httpClient.get<ApiMe>('/auth/me').then((response) => mapApiUser(response.user)),

  logout: () => httpClient.post<MessageOut>('/auth/logout'),

  recover: (email: string) => httpClient.post<MessageOut>('/auth/recover', { email }),

  resetPassword: (accessToken: string, password: string) =>
    httpClient.post<MessageOut>('/auth/reset-password', {
      access_token: accessToken,
      password,
    }),
};
