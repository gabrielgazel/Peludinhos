import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import { foodService, mapFood, mapFoodMovement } from './foodService';
import type { ApiFood, ApiFoodMovement } from './foodService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const apiFood: ApiFood = {
  food_id: 5,
  name: 'Ração premium',
  weight_kg: 20,
  entry_date: '2026-11-18',
  balance_kg: 15.5,
  created_at: '2026-11-18T09:00:00Z',
  updated_at: '2026-11-18T10:00:00Z',
};

const mappedFood = {
  id: 5,
  name: 'Ração premium',
  weightKg: 20,
  entryDate: '2026-11-18',
  balanceKg: 15.5,
  createdAt: '2026-11-18T09:00:00Z',
  updatedAt: '2026-11-18T10:00:00Z',
};

const apiMovement: ApiFoodMovement = {
  food_movement_id: 9,
  food_id: 5,
  kind: 'consumo',
  quantity_kg: 4.5,
  movement_date: '2026-11-18',
  feeding_point_id: 3,
  member_id: 42,
  member_name: 'Maria Silva',
  notes: 'Bloco A',
  created_at: '2026-11-18T11:00:00Z',
};

const mappedMovement = {
  id: 9,
  foodId: 5,
  kind: 'consumo',
  quantityKg: 4.5,
  movementDate: '2026-11-18',
  feedingPointId: 3,
  memberId: 42,
  memberName: 'Maria Silva',
  notes: 'Bloco A',
  createdAt: '2026-11-18T11:00:00Z',
};

describe('foodService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mapeia food snake_case para camelCase com balanceKg vindo do servidor', () => {
    expect(mapFood(apiFood)).toEqual(mappedFood);
  });

  it('não arredonda nem recalcula o saldo no cliente', () => {
    expect(mapFood({ ...apiFood, balance_kg: 15.555 }).balanceKg).toBe(15.555);
  });

  it('mapeia movimentação com tipo, quantidade, ponto e autor', () => {
    expect(mapFoodMovement(apiMovement)).toEqual(mappedMovement);
  });

  it('mapeia movimentação sem ponto, observação ou data de criação', () => {
    const result = mapFoodMovement({
      ...apiMovement,
      feeding_point_id: null,
      notes: null,
      created_at: null,
    });

    expect(result.feedingPointId).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.createdAt).toBeNull();
  });

  it('list monta busca e paginação e mapeia os itens', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      items: [apiFood],
      total: 1,
      limit: 20,
      offset: 40,
    });

    const result = await foodService.list({ q: 'premium', limit: 20, offset: 40 });

    expect(httpClient.get).toHaveBeenCalledWith('/foods?q=premium&limit=20&offset=40');
    expect(result.items).toEqual([mappedFood]);
    expect(result.total).toBe(1);
  });

  it('list sem filtros não gera query string', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    await foodService.list();

    expect(httpClient.get).toHaveBeenCalledWith('/foods');
  });

  it('create envia compra em snake_case', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(apiFood);

    const result = await foodService.create({
      name: 'Ração premium',
      weightKg: 20,
      entryDate: '2026-11-18',
    });

    expect(httpClient.post).toHaveBeenCalledWith('/foods', {
      name: 'Ração premium',
      weight_kg: 20,
      entry_date: '2026-11-18',
    });
    expect(result).toEqual(mappedFood);
  });

  it('create omite data quando não informada', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(apiFood);

    await foodService.create({ name: 'Ração premium', weightKg: 20 });

    expect(httpClient.post).toHaveBeenCalledWith('/foods', {
      name: 'Ração premium',
      weight_kg: 20,
    });
  });

  it('update usa PATCH no id e envia apenas campos informados', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(apiFood);

    await foodService.update(5, { weightKg: 25 });

    expect(httpClient.patch).toHaveBeenCalledWith('/foods/5', { weight_kg: 25 });
  });

  it('listMovements busca as movimentações da ração com paginação', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      items: [apiMovement],
      total: 1,
      limit: 50,
      offset: 0,
    });

    const result = await foodService.listMovements(5, { limit: 50, offset: 0 });

    expect(httpClient.get).toHaveBeenCalledWith('/foods/5/movements?limit=50&offset=0');
    expect(result.items).toEqual([mappedMovement]);
  });

  it('listMovements sem parâmetros não gera query string', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    await foodService.listMovements(5);

    expect(httpClient.get).toHaveBeenCalledWith('/foods/5/movements');
  });

  it('createMovement envia kind e quantityKg em snake_case', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(apiMovement);

    const result = await foodService.createMovement(5, {
      kind: 'consumo',
      quantityKg: 4.5,
      movementDate: '2026-11-18',
      feedingPointId: 3,
      notes: 'Bloco A',
    });

    expect(httpClient.post).toHaveBeenCalledWith('/foods/5/movements', {
      kind: 'consumo',
      quantity_kg: 4.5,
      movement_date: '2026-11-18',
      feeding_point_id: 3,
      notes: 'Bloco A',
    });
    expect(result).toEqual(mappedMovement);
  });

  it('createMovement omite campos opcionais não informados', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(apiMovement);

    await foodService.createMovement(5, { kind: 'fim', quantityKg: 15 });

    expect(httpClient.post).toHaveBeenCalledWith('/foods/5/movements', {
      kind: 'fim',
      quantity_kg: 15,
    });
  });

  it('listAllMovements monta filtros, período e paginação', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      items: [apiMovement],
      total: 1,
      limit: 50,
      offset: 0,
    });

    const result = await foodService.listAllMovements({
      foodId: 5,
      kind: 'consumo',
      from: '2026-11-01',
      to: '2026-11-18',
      limit: 50,
      offset: 0,
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      '/food-movements?food_id=5&kind=consumo&from=2026-11-01&to=2026-11-18&limit=50&offset=0',
    );
    expect(result.items).toEqual([mappedMovement]);
  });

  it('listAllMovements sem filtros não gera query string', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    await foodService.listAllMovements();

    expect(httpClient.get).toHaveBeenCalledWith('/food-movements');
  });
});
