import { httpClient } from '../../../shared/api/httpsClient';
import { withQuery } from '../../../shared/api/query';
import type { Page } from '../../../shared/api/types';

/** Vacinação do animal, já com os campos da API em camelCase. */
export interface Vaccination {
  id: number;
  animalId: number;
  vaccine: string;
  applicationDate: string;
  dose: string | null;
  notes: string | null;
  createdByMemberId: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Linha devolvida pela API; os campos opcionais podem vir ausentes ou nulos. */
export interface ApiVaccination {
  vaccination_id: number;
  animal_id: number;
  vaccine: string;
  application_date: string;
  dose?: string | null;
  notes?: string | null;
  created_by_member_id: number;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Corpo aceito por POST /animals/{id}/vaccinations; no PATCH todos os campos são opcionais. */
export interface VaccinationPayload {
  vaccine: string;
  applicationDate: string;
  dose?: string | null;
  notes?: string | null;
  createdByMemberId: number;
}

export function mapVaccination(row: ApiVaccination): Vaccination {
  return {
    id: row.vaccination_id,
    animalId: row.animal_id,
    vaccine: row.vaccine,
    applicationDate: row.application_date,
    dose: row.dose ?? null,
    notes: row.notes ?? null,
    createdByMemberId: row.created_by_member_id,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function toApiPayload(payload: VaccinationPayload): Record<string, unknown> {
  return {
    vaccine: payload.vaccine,
    application_date: payload.applicationDate,
    dose: payload.dose ?? null,
    notes: payload.notes ?? null,
    created_by_member_id: payload.createdByMemberId,
  };
}

function toApiUpdatePayload(payload: Partial<VaccinationPayload>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.vaccine !== undefined) body.vaccine = payload.vaccine;
  if (payload.applicationDate !== undefined) body.application_date = payload.applicationDate;
  if (payload.dose !== undefined) body.dose = payload.dose;
  if (payload.notes !== undefined) body.notes = payload.notes;
  if (payload.createdByMemberId !== undefined) body.created_by_member_id = payload.createdByMemberId;
  return body;
}

export const vaccinationService = {
  list: (animalId: number, params: { q?: string; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    return httpClient
      .get<Page<ApiVaccination>>(withQuery(`/animals/${animalId}/vaccinations`, query))
      .then(
        (page): Page<Vaccination> => ({
          ...page,
          items: page.items.map(mapVaccination),
        }),
      );
  },

  create: (animalId: number, payload: VaccinationPayload) =>
    httpClient
      .post<ApiVaccination>(`/animals/${animalId}/vaccinations`, toApiPayload(payload))
      .then(mapVaccination),

  update: (id: number, payload: Partial<VaccinationPayload>) =>
    httpClient
      .patch<ApiVaccination>(`/vaccinations/${id}`, toApiUpdatePayload(payload))
      .then(mapVaccination),
};
