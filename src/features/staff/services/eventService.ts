import { httpClient } from '../../../shared/api/httpsClient';
import type { Page } from '../../../shared/api/types';

export interface Event {
  id: number;
  description: string;
  eventDate: string;
  memberId: number;
  memberName: string;
  animalId: number | null;
  animalName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface EventPayload {
  description: string;
  eventDate?: string | null;
  animalId?: number | null;
}

export interface EventListParams {
  from?: string;
  to?: string;
  animalId?: number;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface ApiEvent {
  event_id: number;
  description: string;
  event_date: string;
  member_id: number;
  member_name: string;
  animal_id?: number | null;
  animal_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export function mapEvent(row: ApiEvent): Event {
  return {
    id: row.event_id,
    description: row.description,
    eventDate: row.event_date,
    memberId: row.member_id,
    memberName: row.member_name,
    animalId: row.animal_id ?? null,
    animalName: row.animal_name ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function toApiPayload(payload: Partial<EventPayload>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.eventDate !== undefined) body.event_date = payload.eventDate;
  if (payload.animalId !== undefined) body.animal_id = payload.animalId;
  return body;
}

export const eventService = {
  list: (params: EventListParams = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.animalId !== undefined) query.set('animal_id', String(params.animalId));
    if (params.q) query.set('q', params.q);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return httpClient
      .get<Page<ApiEvent>>(`/events${suffix}`)
      .then(
        (page): Page<Event> => ({
          ...page,
          items: page.items.map(mapEvent),
        }),
      );
  },

  create: (payload: EventPayload) =>
    httpClient.post<ApiEvent>('/events', toApiPayload(payload)).then(mapEvent),

  update: (id: number, payload: Partial<EventPayload>) =>
    httpClient.patch<ApiEvent>(`/events/${id}`, toApiPayload(payload)).then(mapEvent),
};
