import { httpClient } from '../../../shared/api/httpsClient';
import { withQuery } from '../../../shared/api/query';
import type { Page } from '../../../shared/api/types';

/** Registro do histórico veterinário, já com os campos da API em camelCase. */
export interface VeterinaryHistory {
  id: number;
  animalId: number;
  recordDate: string;
  title: string;
  description: string;
  createdByMemberId: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Linha devolvida pela API; os campos opcionais podem vir ausentes ou nulos. */
export interface ApiVeterinaryHistory {
  history_id: number;
  animal_id: number;
  record_date: string;
  title: string;
  description: string;
  created_by_member_id: number;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Corpo aceito por POST /animals/{id}/veterinary-history; no PATCH todos os campos são opcionais. */
export interface VeterinaryHistoryPayload {
  title: string;
  recordDate: string;
  description: string;
  createdByMemberId: number;
}

export function mapVeterinaryHistory(row: ApiVeterinaryHistory): VeterinaryHistory {
  return {
    id: row.history_id,
    animalId: row.animal_id,
    recordDate: row.record_date,
    title: row.title,
    description: row.description,
    createdByMemberId: row.created_by_member_id,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function toApiPayload(payload: VeterinaryHistoryPayload): Record<string, unknown> {
  return {
    title: payload.title,
    record_date: payload.recordDate,
    description: payload.description,
    created_by_member_id: payload.createdByMemberId,
  };
}

function toApiUpdatePayload(payload: Partial<VeterinaryHistoryPayload>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.recordDate !== undefined) body.record_date = payload.recordDate;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.createdByMemberId !== undefined) body.created_by_member_id = payload.createdByMemberId;
  return body;
}

export const veterinaryHistoryService = {
  list: (animalId: number, params: { q?: string; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    return httpClient
      .get<Page<ApiVeterinaryHistory>>(withQuery(`/animals/${animalId}/veterinary-history`, query))
      .then(
        (page): Page<VeterinaryHistory> => ({
          ...page,
          items: page.items.map(mapVeterinaryHistory),
        }),
      );
  },

  create: (animalId: number, payload: VeterinaryHistoryPayload) =>
    httpClient
      .post<ApiVeterinaryHistory>(`/animals/${animalId}/veterinary-history`, toApiPayload(payload))
      .then(mapVeterinaryHistory),

  update: (id: number, payload: Partial<VeterinaryHistoryPayload>) =>
    httpClient
      .patch<ApiVeterinaryHistory>(`/veterinary-history/${id}`, toApiUpdatePayload(payload))
      .then(mapVeterinaryHistory),
};
