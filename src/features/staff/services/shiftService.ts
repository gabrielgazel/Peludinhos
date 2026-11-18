import { httpClient } from '../../../shared/api/httpsClient';
import type { Page } from '../../../shared/api/types';

export interface ShiftFeedingPoint {
  id: number;
  name: string;
  building: string | null;
  isActive: boolean;
}

export interface Shift {
  id: number;
  memberId: number;
  memberName: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  feedingPoints: ShiftFeedingPoint[];
  notes: string | null;
}

export interface ShiftPayload {
  feedingPointIds: number[];
  notes?: string | null;
}

export interface ShiftListParams {
  from?: string;
  to?: string;
  memberId?: number;
  limit?: number;
  offset?: number;
}

export interface ApiShiftFeedingPoint {
  feeding_point_id: number;
  name: string;
  building?: string | null;
  is_active: boolean;
}

export interface ApiShift {
  shift_id: number;
  member_id: number;
  member_name: string;
  started_at: string;
  ended_at?: string | null;
  duration_minutes: number;
  feeding_points?: ApiShiftFeedingPoint[] | null;
  notes?: string | null;
}

export function mapShiftFeedingPoint(row: ApiShiftFeedingPoint): ShiftFeedingPoint {
  return {
    id: row.feeding_point_id,
    name: row.name,
    building: row.building ?? null,
    isActive: row.is_active,
  };
}

export function mapShift(row: ApiShift): Shift {
  return {
    id: row.shift_id,
    memberId: row.member_id,
    memberName: row.member_name,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? null,
    durationMinutes: row.duration_minutes,
    feedingPoints: (row.feeding_points ?? []).map(mapShiftFeedingPoint),
    notes: row.notes ?? null,
  };
}

export const shiftService = {
  /** Turno aberto do usuário; devolve null quando a API responde 204. */
  current: () =>
    httpClient
      .get<ApiShift | undefined>('/shifts/current')
      .then((row) => (row ? mapShift(row) : null)),

  open: (payload: ShiftPayload) => {
    const body: Record<string, unknown> = {
      feeding_point_ids: payload.feedingPointIds,
    };
    if (payload.notes !== undefined) body.notes = payload.notes;
    return httpClient.post<ApiShift>('/shifts', body).then(mapShift);
  },

  close: (id: number) =>
    httpClient.post<ApiShift>(`/shifts/${id}/end`).then(mapShift),

  list: (params: ShiftListParams = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.memberId !== undefined) query.set('member_id', String(params.memberId));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return httpClient
      .get<Page<ApiShift>>(`/shifts${suffix}`)
      .then(
        (page): Page<Shift> => ({
          ...page,
          items: page.items.map(mapShift),
        }),
      );
  },
};
