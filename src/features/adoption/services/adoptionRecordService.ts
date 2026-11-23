import { httpClient } from '../../../shared/api/httpsClient';
import type { Adoption, AdoptionRecordPayload, ApiAdoption } from '../types/adoption.types';

/** Converte a linha da tabela `adoption` (snake_case) para o domínio (camelCase). */
export function mapAdoption(row: ApiAdoption): Adoption {
  return {
    id: row.adoption_id,
    adoptionIntentId: row.fk_adoption_intent_id,
    animalId: row.fk_animal_id,
    visitorId: row.fk_visitor_id,
    responsibleMemberId: row.fk_responsible_member_id,
    adoptionDate: row.adoption_date,
    termText: row.term_text,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export const adoptionRecordService = {
  /**
   * Registra a adoção a partir de uma intenção aprovada: grava o termo e
   * atualiza o animal para adotado na mesma transação (via API).
   */
  create: (payload: AdoptionRecordPayload) =>
    httpClient
      .post<ApiAdoption>('/adoptions', {
        adoption_intent_id: payload.adoptionIntentId,
        fk_responsible_member_id: payload.responsibleMemberId,
        adoption_date: payload.adoptionDate,
        term_text: payload.termText,
      })
      .then(mapAdoption),
};
