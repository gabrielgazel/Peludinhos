import { httpClient } from '../../../shared/api/httpsClient';
import { withQuery } from '../../../shared/api/query';
import type { Page } from '../../../shared/api/types';

/** Produto do inventário, já com os campos da API em camelCase. */
export interface Product {
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
export interface ApiProduct {
  product_id: number;
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

/** Corpo aceito por POST /products; no PATCH todos os campos são opcionais. */
export interface ProductPayload {
  name: string;
  type: string;
  quantity: number;
  unit: string;
  point: string;
  validity?: string | null;
  notes?: string | null;
}

export function mapProduct(row: ApiProduct): Product {
  return {
    id: row.product_id,
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

function toApiProductPayload(payload: ProductPayload): Record<string, unknown> {
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

function toApiProductUpdatePayload(payload: Partial<ProductPayload>): Record<string, unknown> {
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

export const productService = {
  list: (params: { q?: string; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    return httpClient
      .get<Page<ApiProduct>>(withQuery('/products', query))
      .then((page): Page<Product> => ({ ...page, items: page.items.map(mapProduct) }));
  },

  create: (payload: ProductPayload) =>
    httpClient.post<ApiProduct>('/products', toApiProductPayload(payload)).then(mapProduct),

  update: (id: number, payload: Partial<ProductPayload>) =>
    httpClient
      .patch<ApiProduct>(`/products/${id}`, toApiProductUpdatePayload(payload))
      .then(mapProduct),
};
