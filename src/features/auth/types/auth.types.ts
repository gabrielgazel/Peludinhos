import type { Role, StaffRole } from '../../../shared/types/role.types';

export type ActorType = 'membro' | 'visitante';

/** Usuário autenticado já normalizado para o front (camelCase). */
export interface AuthUser {
  /** id do usuário no Supabase Auth (uuid). */
  id: string;
  email: string;
  name: string;
  actorType: 'membro' | 'visitante';
  /** Papel efetivo para RBAC: papel de membro ou `visitante`. */
  role: Role;
  memberId: number | null;
  visitorId: number | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Sessão devolvida por login/register/refresh. */
export interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AddressPayload {
  street: string;
  number: string;
  neighborhood: string;
  cep: string;
  referencePoint?: string;
}

export interface VisitorRegisterPayload {
  email: string;
  password: string;
  name: string;
  birthDate?: string;
  cpf?: string;
  isUfopaMember: boolean;
  hasPet: boolean;
  address?: AddressPayload;
}

/** ---- Formatos vindos da API (snake_case) ---- */

export interface ApiUser {
  id: string;
  email: string;
  actor_type: 'membro' | 'visitante';
  name: string;
  role: StaffRole | null;
  member_id: number | null;
  visitor_id: number | null;
}

export interface ApiSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number | null;
  user: ApiUser;
}

export interface ApiMemberFull {
  member_id: number;
  name: string;
  email: string;
  role: StaffRole;
  birth_date: string | null;
  cpf: string | null;
  ufopa_registration: string | null;
  project_entry_date: string | null;
  feeding_days: string[];
}

export interface ApiMe {
  user: ApiUser;
  member: ApiMemberFull | null;
  visitor: unknown | null;
}
