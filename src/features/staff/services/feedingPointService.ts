import { httpClient } from '../../../shared/api/httpsClient';
import type { Page } from '../../../shared/api/types';

export interface FeedingPoint {
  id: number;
  name: string;
  building: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface FeedingPointAnimal {
  animalId: number;
  name: string;
  status: string;
}

export interface FeedingPointPayload {
  name: string;
  building?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
}

export interface FeedingPointListParams {
  q?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface ApiFeedingPoint {
  feeding_point_id: number;
  name: string;
  building?: string | null;
  description?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApiFeedingPointAnimal {
  animal_id: number;
  name: string;
  status: string;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export function mapFeedingPoint(row: ApiFeedingPoint): FeedingPoint {
  return {
    id: row.feeding_point_id,
    name: row.name,
    building: row.building ?? null,
    description: row.description ?? null,
    latitude: toNumberOrNull(row.latitude),
    longitude: toNumberOrNull(row.longitude),
    isActive: row.is_active,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function mapFeedingPointAnimal(row: ApiFeedingPointAnimal): FeedingPointAnimal {
  return {
    animalId: row.animal_id,
    name: row.name,
    status: row.status,
  };
}

function toApiPayload(payload: Partial<FeedingPointPayload>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.building !== undefined) body.building = payload.building;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.latitude !== undefined) body.latitude = payload.latitude;
  if (payload.longitude !== undefined) body.longitude = payload.longitude;
  if (payload.isActive !== undefined) body.is_active = payload.isActive;
  return body;
}

export const feedingPointService = {
  list: (params: FeedingPointListParams = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.isActive !== undefined) query.set('is_active', String(params.isActive));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return httpClient
      .get<Page<ApiFeedingPoint>>(`/feeding-points${suffix}`)
      .then((page): Page<FeedingPoint> => ({
        ...page,
        items: page.items.map(mapFeedingPoint),
      }));
  },

  get: (id: number) =>
    httpClient.get<ApiFeedingPoint>(`/feeding-points/${id}`).then(mapFeedingPoint),

  create: (payload: FeedingPointPayload) =>
    httpClient
      .post<ApiFeedingPoint>('/feeding-points', toApiPayload(payload))
      .then(mapFeedingPoint),

  update: (id: number, payload: Partial<FeedingPointPayload>) =>
    httpClient
      .patch<ApiFeedingPoint>(`/feeding-points/${id}`, toApiPayload(payload))
      .then(mapFeedingPoint),

  listAnimals: (id: number) =>
    httpClient
      .get<ApiFeedingPointAnimal[]>(`/feeding-points/${id}/animals`)
      .then((items) => items.map(mapFeedingPointAnimal)),
};
