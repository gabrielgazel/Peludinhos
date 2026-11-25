import { httpClient } from '../../../shared/api/httpsClient';
import type { Page } from '../../../shared/api/types';
import type {
  Animal,
  AnimalBehavior,
  AnimalPayload,
  AnimalStatus,
  ApiAnimal,
} from '../types/animal.types';

export function mapAnimal(row: ApiAnimal): Animal {
  return {
    id: row.animal_id,
    name: row.name,
    sex: row.sex,
    colorDescription: row.color_description,
    age: row.age,
    isNeutered: row.is_neutered,
    status: row.status,
    behavior: row.behavior,
    notes: row.notes,
    isDeceased: row.is_deceased,
    deathDate: row.death_date ?? null,
    deathCause: row.death_cause ?? null,
    photoUrl: row.photo_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AnimalListParams {
  status?: AnimalStatus;
  behavior?: AnimalBehavior;
  q?: string;
  includeDeceased?: boolean;
  limit?: number;
  offset?: number;
}

/** Correção de óbito enviada ao PATCH /animals/{id}/deceased. */
export interface DeceasedPayload {
  deathDate: string;
  deathCause: string | null;
}

const FALLBACK_DECEASED_ERROR = 'Não foi possível salvar o óbito.';
const GENERIC_ERROR = /^(erro \d{3}\b|failed to fetch\b|network error\b|request failed\b)/i;

function specificMessage(message: unknown): string | null {
  if (typeof message !== 'string') return null;
  const trimmed = message.trim();
  return trimmed && !GENERIC_ERROR.test(trimmed) ? trimmed : null;
}

/** Preserva o detail da API (string ou lista de msg); troca o resto pelo fallback. */
function deceasedErrorMessage(error: unknown): string {
  const body = error && typeof error === 'object' ? (error as { body?: unknown }).body : null;
  const detail = body && typeof body === 'object' ? (body as { detail?: unknown }).detail : null;

  const fromDetail = specificMessage(detail);
  if (fromDetail) return fromDetail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        item && typeof item === 'object' && 'msg' in item
          ? specificMessage((item as { msg: unknown }).msg)
          : specificMessage(item),
      )
      .filter((message): message is string => !!message);
    if (messages.length > 0) return messages.join(' ');
  }

  return specificMessage(error instanceof Error ? error.message : null) ?? FALLBACK_DECEASED_ERROR;
}

export const animalService = {
  /** Listagem — pública devolve só disponíveis; membros veem todos. */
  list: (params: AnimalListParams = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.behavior) query.set('behavior', params.behavior);
    if (params.q) query.set('q', params.q);
    if (params.includeDeceased) query.set('include_deceased', 'true');
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return httpClient.get<Page<ApiAnimal>>(`/animals${suffix}`).then((page) => ({
      ...page,
      items: page.items.map(mapAnimal),
    }));
  },

  getById: (id: number) => httpClient.get<ApiAnimal>(`/animals/${id}`).then(mapAnimal),

  create: (payload: AnimalPayload) =>
    httpClient.post<ApiAnimal>('/animals', payload).then(mapAnimal),

  update: (id: number, payload: Partial<AnimalPayload>) =>
    httpClient.patch<ApiAnimal>(`/animals/${id}`, payload).then(mapAnimal),

  /** Corrige data/causa de um óbito já registrado (PATCH auditável). */
  updateDeceased: async (id: number, payload: DeceasedPayload): Promise<Animal> => {
    try {
      return await httpClient
        .patch<ApiAnimal>(`/animals/${id}/deceased`, {
          death_date: payload.deathDate,
          death_cause: payload.deathCause,
        })
        .then(mapAnimal);
    } catch (error) {
      throw new Error(deceasedErrorMessage(error));
    }
  },

  markDeceased: (id: number) =>
    httpClient.post<ApiAnimal>(`/animals/${id}/deceased`).then(mapAnimal),

  /** Envia/substitui a foto do animal (multipart). Somente administração. */
  uploadPhoto: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return httpClient.post<ApiAnimal>(`/animals/${id}/photo`, form).then(mapAnimal);
  },

  /** Remove a foto do animal. Somente administração. */
  removePhoto: (id: number) =>
    httpClient.delete<ApiAnimal>(`/animals/${id}/photo`).then(mapAnimal),
};
