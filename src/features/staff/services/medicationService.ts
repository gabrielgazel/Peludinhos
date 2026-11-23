import { httpClient } from '../../../shared/api/httpsClient';
import { withQuery } from '../../../shared/api/query';
import type { Page } from '../../../shared/api/types';

/** Medicamento do inventário, já com os campos da API em camelCase. */
export interface Medication {
  id: number;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  validity: string | null;
  point: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Linha devolvida pela API; os campos opcionais podem vir ausentes ou nulos. */
export interface ApiMedication {
  medication_id: number;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  point: string;
  validity?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Corpo aceito por POST /medications; no PATCH todos os campos são opcionais. */
export interface SupplyPayload {
  name: string;
  type: string;
  quantity: number;
  unit: string;
  point: string;
  validity?: string | null;
  notes?: string | null;
}

export function mapMedication(row: ApiMedication): Medication {
  return {
    id: row.medication_id,
    name: row.name,
    type: row.type,
    quantity: row.quantity,
    unit: row.unit,
    validity: row.validity ?? null,
    point: row.point,
    notes: row.notes ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function toApiSupplyPayload(payload: SupplyPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: payload.name,
    type: payload.type,
    quantity: payload.quantity,
    unit: payload.unit,
    point: payload.point,
  };
  if (payload.validity !== undefined) body.validity = payload.validity;
  if (payload.notes !== undefined) body.notes = payload.notes;
  return body;
}

function toApiSupplyUpdatePayload(payload: Partial<SupplyPayload>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.type !== undefined) body.type = payload.type;
  if (payload.quantity !== undefined) body.quantity = payload.quantity;
  if (payload.unit !== undefined) body.unit = payload.unit;
  if (payload.point !== undefined) body.point = payload.point;
  if (payload.validity !== undefined) body.validity = payload.validity;
  if (payload.notes !== undefined) body.notes = payload.notes;
  return body;
}

export const medicationService = {
  list: (params: { q?: string; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    return httpClient
      .get<Page<ApiMedication>>(withQuery('/medications', query))
      .then((page): Page<Medication> => ({ ...page, items: page.items.map(mapMedication) }));
  },

  create: (payload: SupplyPayload) =>
    httpClient.post<ApiMedication>('/medications', toApiSupplyPayload(payload)).then(mapMedication),

  update: (id: number, payload: Partial<SupplyPayload>) =>
    httpClient
      .patch<ApiMedication>(`/medications/${id}`, toApiSupplyUpdatePayload(payload))
      .then(mapMedication),
};
