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
