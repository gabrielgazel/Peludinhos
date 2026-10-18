import { httpClient } from '../../../shared/api/httpsClient';
import type { Page } from '../../../shared/api/types';
import type {
  AdoptionIntent,
  AdoptionIntentPayload,
  ApiAdoptionIntent,
  IntentStatus,
} from '../types/adoption.types';

export function mapIntent(row: ApiAdoptionIntent): AdoptionIntent {
  return {
    id: row.adoption_intent_id,
    motivation: row.motivation,
    status: row.status,
    animalId: row.fk_animal_id,
    visitorId: row.fk_visitor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    visitor: row.visitor
      ? {
          id: row.visitor.visitor_id,
          name: row.visitor.name,
          email: row.visitor.email,
          isUfopaMember: row.visitor.is_ufopa_member,
          hasPet: row.visitor.has_pet,
          cpf: row.visitor.cpf,
        }
      : null,
    animal: row.animal
      ? {
          id: row.animal.animal_id,
          name: row.animal.name,
          sex: row.animal.sex,
          age: row.animal.age,
          colorDescription: row.animal.color_description,
          status: row.animal.status,
          behavior: row.animal.behavior,
          isNeutered: row.animal.is_neutered,
        }
      : null,
  };
}

export interface IntentListParams {
  status?: IntentStatus;
  animalId?: number;
  visitorId?: number;
  limit?: number;
  offset?: number;
}

function toPage(page: Page<ApiAdoptionIntent>): Page<AdoptionIntent> {
  return { ...page, items: page.items.map(mapIntent) };
}

export const adoptionService = {
  /** F1.13 — manifestar intenção (visitante autenticado). */
  submitIntent: (payload: AdoptionIntentPayload) =>
    httpClient
      .post<ApiAdoptionIntent>('/adoption-intents', {
        animal_id: payload.animalId,
        motivation: payload.motivation,
      })
      .then(mapIntent),

  /** Minhas intenções (visitante). */
  listMine: (limit = 50, offset = 0) =>
    httpClient
      .get<Page<ApiAdoptionIntent>>(`/adoption-intents/mine?limit=${limit}&offset=${offset}`)
      .then(toPage),

  /** F2.9 — listar intenções (membros). */
  list: (params: IntentListParams = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.animalId !== undefined) query.set('animal_id', String(params.animalId));
    if (params.visitorId !== undefined) query.set('visitor_id', String(params.visitorId));
    query.set('limit', String(params.limit ?? 100));
    query.set('offset', String(params.offset ?? 0));
    return httpClient
      .get<Page<ApiAdoptionIntent>>(`/adoption-intents?${query.toString()}`)
      .then(toPage);
  },

  /** F1.25 — visitante edita a própria motivação. */
  updateMine: (id: number, motivation: string) =>
    httpClient
      .patch<ApiAdoptionIntent>(`/adoption-intents/${id}`, { motivation })
      .then(mapIntent),

  /** Avaliação pelos membros: pendente → aprovada/rejeitada. */
  review: (id: number, status: 'aprovada' | 'rejeitada') =>
    httpClient
      .patch<ApiAdoptionIntent>(`/adoption-intents/${id}`, { status })
      .then(mapIntent),
};
