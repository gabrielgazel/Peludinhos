import type { Role } from '../../../shared/types/role.types';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}