import { httpClient } from '../../../shared/api/httpsClient';
import { withQuery } from '../../../shared/api/query';
import type { Page } from '../../../shared/api/types';

/** Receita veterinária, já com os campos da API em camelCase. */
export interface Prescription {
  id: number;
  animalId: number;
  medication: string;
  dosage: string;
  prescriptionDate: string;
  notes: string | null;
  createdByMemberId: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Linha devolvida pela API; os campos opcionais podem vir ausentes ou nulos. */
export interface ApiPrescription {
  prescription_id: number;
  animal_id: number;
  medication: string;
  dosage: string;
  prescription_date: string;
  notes?: string | null;
  created_by_member_id: number;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Corpo aceito por POST /animals/{id}/prescriptions; no PATCH todos os campos são opcionais. */
export interface PrescriptionPayload {
  medication: string;
  dosage: string;
  prescriptionDate: string;
  notes?: string | null;
  createdByMemberId: number;
}

export function mapPrescription(row: ApiPrescription): Prescription {
  return {
    id: row.prescription_id,
    animalId: row.animal_id,
    medication: row.medication,
    dosage: row.dosage,
    prescriptionDate: row.prescription_date,
    notes: row.notes ?? null,
    createdByMemberId: row.created_by_member_id,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function toApiPayload(payload: PrescriptionPayload): Record<string, unknown> {
  return {
    medication: payload.medication,
    dosage: payload.dosage,
    prescription_date: payload.prescriptionDate,
    notes: payload.notes ?? null,
    created_by_member_id: payload.createdByMemberId,
  };
}

function toApiUpdatePayload(payload: Partial<PrescriptionPayload>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.medication !== undefined) body.medication = payload.medication;
  if (payload.dosage !== undefined) body.dosage = payload.dosage;
  if (payload.prescriptionDate !== undefined) body.prescription_date = payload.prescriptionDate;
  if (payload.notes !== undefined) body.notes = payload.notes;
  if (payload.createdByMemberId !== undefined) body.created_by_member_id = payload.createdByMemberId;
  return body;
}

export const prescriptionService = {
  list: (animalId: number, params: { q?: string; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    return httpClient
      .get<Page<ApiPrescription>>(withQuery(`/animals/${animalId}/prescriptions`, query))
      .then(
        (page): Page<Prescription> => ({
          ...page,
          items: page.items.map(mapPrescription),
        }),
      );
  },

  create: (animalId: number, payload: PrescriptionPayload) =>
    httpClient
      .post<ApiPrescription>(`/animals/${animalId}/prescriptions`, toApiPayload(payload))
      .then(mapPrescription),

  update: (id: number, payload: Partial<PrescriptionPayload>) =>
    httpClient
      .patch<ApiPrescription>(`/prescriptions/${id}`, toApiUpdatePayload(payload))
      .then(mapPrescription),
};
