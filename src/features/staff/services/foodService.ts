import { httpClient } from '../../../shared/api/httpsClient';
import type { Page } from '../../../shared/api/types';

/** Tipos de movimentação aceitos pela API (`FoodMovementKind`). */
export type FoodMovementKind = 'compra' | 'consumo' | 'fim';

/**
 * Ração com o saldo calculado no servidor.
 *
 * `balanceKg` é sempre lido de `balance_kg`; o cliente não soma nem subtrai
 * movimentações. Também não arredonda: o servidor já devolve o saldo com
 * duas casas.
 */
export interface Food {
  id: number;
  name: string;
  weightKg: number;
  entryDate: string;
  balanceKg: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface FoodMovement {
  id: number;
  foodId: number;
  kind: FoodMovementKind;
  quantityKg: number;
  movementDate: string;
  feedingPointId: number | null;
  memberId: number;
  memberName: string;
  notes: string | null;
  createdAt: string | null;
}

export interface FoodPayload {
  name: string;
  weightKg: number;
  entryDate?: string | null;
}

export interface FoodMovementPayload {
  kind: FoodMovementKind;
  quantityKg: number;
  movementDate?: string | null;
  feedingPointId?: number | null;
  notes?: string | null;
}

export interface ApiFood {
  food_id: number;
  name: string;
  weight_kg: number;
  entry_date: string;
  balance_kg: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApiFoodMovement {
  food_movement_id: number;
  food_id: number;
  kind: FoodMovementKind;
  quantity_kg: number;
  movement_date: string;
  feeding_point_id?: number | null;
  member_id: number;
  member_name: string;
  notes?: string | null;
  created_at?: string | null;
}

export function mapFood(row: ApiFood): Food {
  return {
    id: row.food_id,
    name: row.name,
    weightKg: row.weight_kg,
    entryDate: row.entry_date,
    balanceKg: row.balance_kg,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function mapFoodMovement(row: ApiFoodMovement): FoodMovement {
  return {
    id: row.food_movement_id,
    foodId: row.food_id,
    kind: row.kind,
    quantityKg: row.quantity_kg,
    movementDate: row.movement_date,
    feedingPointId: row.feeding_point_id ?? null,
    memberId: row.member_id,
    memberName: row.member_name,
    notes: row.notes ?? null,
    createdAt: row.created_at ?? null,
  };
}

function toApiFoodPayload(payload: FoodPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: payload.name,
    weight_kg: payload.weightKg,
  };
  if (payload.entryDate !== undefined) body.entry_date = payload.entryDate;
  return body;
}

function toApiFoodUpdatePayload(
  payload: Partial<Omit<FoodPayload, 'entryDate'>>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.weightKg !== undefined) body.weight_kg = payload.weightKg;
  return body;
}

function toApiMovementPayload(
  payload: Partial<FoodMovementPayload>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.kind !== undefined) body.kind = payload.kind;
  if (payload.quantityKg !== undefined) body.quantity_kg = payload.quantityKg;
  if (payload.movementDate !== undefined) body.movement_date = payload.movementDate;
  if (payload.feedingPointId !== undefined) body.feeding_point_id = payload.feedingPointId;
  if (payload.notes !== undefined) body.notes = payload.notes;
  return body;
}

function withQuery(path: string, query: URLSearchParams): string {
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export const foodService = {
  list: (params: { q?: string; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    return httpClient
      .get<Page<ApiFood>>(withQuery('/foods', query))
      .then((page): Page<Food> => ({ ...page, items: page.items.map(mapFood) }));
  },

  create: (payload: FoodPayload) =>
    httpClient.post<ApiFood>('/foods', toApiFoodPayload(payload)).then(mapFood),

  /** O PATCH de ração não aceita `entry_date`; só nome e peso. */
  update: (id: number, payload: Partial<Omit<FoodPayload, 'entryDate'>>) =>
    httpClient.patch<ApiFood>(`/foods/${id}`, toApiFoodUpdatePayload(payload)).then(mapFood),

  listMovements: (foodId: number, params: { limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    return httpClient
      .get<Page<ApiFoodMovement>>(withQuery(`/foods/${foodId}/movements`, query))
      .then(
        (page): Page<FoodMovement> => ({
          ...page,
          items: page.items.map(mapFoodMovement),
        }),
      );
  },

  createMovement: (foodId: number, payload: FoodMovementPayload) =>
    httpClient
      .post<ApiFoodMovement>(
        `/foods/${foodId}/movements`,
        toApiMovementPayload(payload),
      )
      .then(mapFoodMovement),

  listAllMovements: (
    params: {
      foodId?: number;
      kind?: FoodMovementKind;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) => {
    const query = new URLSearchParams();
    if (params.foodId !== undefined) query.set('food_id', String(params.foodId));
    if (params.kind) query.set('kind', params.kind);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    return httpClient
      .get<Page<ApiFoodMovement>>(withQuery('/food-movements', query))
      .then(
        (page): Page<FoodMovement> => ({
          ...page,
          items: page.items.map(mapFoodMovement),
        }),
      );
  },
};
