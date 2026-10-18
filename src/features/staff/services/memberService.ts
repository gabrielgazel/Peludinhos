import { httpClient } from '../../../shared/api/httpsClient';
import type { Page } from '../../../shared/api/types';
import type { StaffRole } from '../../../shared/types/role.types';

export interface Member {
  id: number | null;
  name: string;
  role: StaffRole;
  email: string | null;
  birthDate: string | null;
  cpf: string | null;
  ufopaRegistration: string | null;
  projectEntryDate: string | null;
  feedingDays: string[];
}

export interface MemberCreatePayload {
  email: string;
  password: string;
  name: string;
  role: StaffRole;
  birthDate?: string | null;
  cpf?: string | null;
  ufopaRegistration?: string | null;
  projectEntryDate?: string | null;
  feedingDays?: string[];
}

export interface MemberUpdatePayload {
  name?: string;
  role?: StaffRole;
  birthDate?: string | null;
  cpf?: string | null;
  ufopaRegistration?: string | null;
  projectEntryDate?: string | null;
  feedingDays?: string[];
  password?: string;
}

/**
 * Projeção devolvida pela API. Sem token só vêm `name`/`role`; para
 * membros acrescenta os demais campos; para a administração, cpf e
 * data de nascimento também.
 */
interface ApiMember {
  member_id?: number;
  name: string;
  role: StaffRole;
  email?: string | null;
  birth_date?: string | null;
  cpf?: string | null;
  ufopa_registration?: string | null;
  project_entry_date?: string | null;
  feeding_days?: string[] | null;
}

function mapMember(row: ApiMember): Member {
  return {
    id: row.member_id ?? null,
    name: row.name,
    role: row.role,
    email: row.email ?? null,
    birthDate: row.birth_date ?? null,
    cpf: row.cpf ?? null,
    ufopaRegistration: row.ufopa_registration ?? null,
    projectEntryDate: row.project_entry_date ?? null,
    feedingDays: row.feeding_days ?? [],
  };
}

export const memberService = {
  list: (params: { role?: StaffRole; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    query.set('limit', String(params.limit ?? 100));
    query.set('offset', String(params.offset ?? 0));
    return httpClient.get<Page<ApiMember>>(`/members?${query.toString()}`).then(
      (page): Page<Member> => ({ ...page, items: page.items.map(mapMember) }),
    );
  },

  getById: (id: number) =>
    httpClient.get<ApiMember>(`/members/${id}`).then(mapMember),

  create: (payload: MemberCreatePayload) =>
    httpClient
      .post<ApiMember>('/members', {
        email: payload.email,
        password: payload.password,
        name: payload.name,
        role: payload.role,
        birth_date: payload.birthDate || null,
        cpf: payload.cpf || null,
        ufopa_registration: payload.ufopaRegistration || null,
        project_entry_date: payload.projectEntryDate || null,
        feeding_days: payload.feedingDays ?? [],
      })
      .then(mapMember),

  update: (id: number, payload: MemberUpdatePayload) => {
    const body: Record<string, unknown> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.role !== undefined) body.role = payload.role;
    if (payload.birthDate !== undefined) body.birth_date = payload.birthDate || null;
    if (payload.cpf !== undefined) body.cpf = payload.cpf || null;
    if (payload.ufopaRegistration !== undefined) {
      body.ufopa_registration = payload.ufopaRegistration || null;
    }
    if (payload.projectEntryDate !== undefined) {
      body.project_entry_date = payload.projectEntryDate || null;
    }
    if (payload.feedingDays !== undefined) body.feeding_days = payload.feedingDays;
    if (payload.password) body.password = payload.password;
    return httpClient.patch<ApiMember>(`/members/${id}`, body).then(mapMember);
  },
};
