import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import { mapProduct, productService, type ApiProduct } from './productService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const row: ApiProduct = {
  product_id: 7,
  name: 'Shampoo neutro',
  type: 'Higiene',
  quantity: 20,
  unit: 'frascos',
  validity: null,
  point: 'Depósito — prateleira 2',
  notes: null,
  created_at: null,
  updated_at: null,
};

const semOpcionais: Omit<ApiProduct, 'validity' | 'notes' | 'created_at' | 'updated_at'> = {
  product_id: 7,
  name: 'Shampoo neutro',
  type: 'Higiene',
  quantity: 20,
  unit: 'frascos',
  point: 'Depósito — prateleira 2',
};

describe('productService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapeia product_id para id e normaliza campos opcionais', () => {
    const mapped = {
      id: 7,
      name: 'Shampoo neutro',
      type: 'Higiene',
      quantity: 20,
      unit: 'frascos',
      validity: null,
      point: 'Depósito — prateleira 2',
      notes: null,
      createdAt: null,
      updatedAt: null,
    };
    expect(mapProduct(row)).toEqual(mapped);
    expect(mapProduct(semOpcionais)).toEqual(mapped);
  });

  it('list envia filtros em snake_case e mapeia a página', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ items: [row], total: 1, limit: 200, offset: 0 });
    const page = await productService.list({ limit: 200 });
    expect(httpClient.get).toHaveBeenCalledWith('/products?limit=200');
    expect(page.items[0].id).toBe(7);
  });

  it('create envia o payload em snake_case', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(row);
    await productService.create({
      name: 'Shampoo neutro', type: 'Higiene', quantity: 20,
      unit: 'frascos', validity: null, point: 'Depósito — prateleira 2',
      notes: 'Uso diário',
    });
    expect(httpClient.post).toHaveBeenCalledWith('/products', {
      name: 'Shampoo neutro', type: 'Higiene', quantity: 20,
      unit: 'frascos', validity: null, point: 'Depósito — prateleira 2',
      notes: 'Uso diário',
    });
  });

  it('update envia somente os campos informados', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(row);
    await productService.update(7, { quantity: 24 });
    expect(httpClient.patch).toHaveBeenCalledWith('/products/7', { quantity: 24 });
  });
});
