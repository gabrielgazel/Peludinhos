import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import { feedingPointService, mapFeedingPoint } from './feedingPointService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const apiPoint = {
  feeding_point_id: 7,
  name: 'Bloco A',
  building: 'ICED',
  description: 'Próximo ao portão',
  latitude: '-2.417000',
  longitude: '-54.721000',
  is_active: true,
  created_at: '2026-11-16T10:00:00Z',
  updated_at: '2026-11-16T11:00:00Z',
};

describe('feedingPointService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mapeia feeding point snake_case para camelCase', () => {
    expect(mapFeedingPoint(apiPoint)).toEqual({
      id: 7,
      name: 'Bloco A',
      building: 'ICED',
      description: 'Próximo ao portão',
      latitude: -2.417,
      longitude: -54.721,
      isActive: true,
      createdAt: '2026-11-16T10:00:00Z',
      updatedAt: '2026-11-16T11:00:00Z',
    });
  });

  it('list monta query string e mapeia itens paginados', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      items: [apiPoint],
      total: 1,
      limit: 20,
      offset: 0,
    });

    const result = await feedingPointService.list({
      q: 'Bloco',
      isActive: true,
      limit: 20,
      offset: 0,
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      '/feeding-points?q=Bloco&is_active=true&limit=20&offset=0',
    );
    expect(result).toEqual({
      items: [
        {
          id: 7,
          name: 'Bloco A',
          building: 'ICED',
          description: 'Próximo ao portão',
          latitude: -2.417,
          longitude: -54.721,
          isActive: true,
          createdAt: '2026-11-16T10:00:00Z',
          updatedAt: '2026-11-16T11:00:00Z',
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });
  });

  it('get busca por id e mapeia resposta', async () => {
    vi.mocked(httpClient.get).mockResolvedValue(apiPoint);

    const result = await feedingPointService.get(7);

    expect(httpClient.get).toHaveBeenCalledWith('/feeding-points/7');
    expect(result.id).toBe(7);
    expect(result.isActive).toBe(true);
  });

  it('create envia payload em snake_case', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(apiPoint);

    await feedingPointService.create({
      name: 'Bloco A',
      building: 'ICED',
      description: 'Próximo ao portão',
      latitude: -2.417,
      longitude: -54.721,
      isActive: true,
    });

    expect(httpClient.post).toHaveBeenCalledWith('/feeding-points', {
      name: 'Bloco A',
      building: 'ICED',
      description: 'Próximo ao portão',
      latitude: -2.417,
      longitude: -54.721,
      is_active: true,
    });
  });

  it('update envia apenas campos informados em snake_case', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ ...apiPoint, is_active: false });

    const result = await feedingPointService.update(7, { isActive: false, building: null });

    expect(httpClient.patch).toHaveBeenCalledWith('/feeding-points/7', {
      is_active: false,
      building: null,
    });
    expect(result.isActive).toBe(false);
  });

  it('listByAnimal busca os pontos do animal e mapeia', async () => {
    vi.mocked(httpClient.get).mockResolvedValue([apiPoint]);

    const result = await feedingPointService.listByAnimal(3);

    expect(httpClient.get).toHaveBeenCalledWith('/animals/3/feeding-points');
    expect(result).toEqual([
      {
        id: 7,
        name: 'Bloco A',
        building: 'ICED',
        description: 'Próximo ao portão',
        latitude: -2.417,
        longitude: -54.721,
        isActive: true,
        createdAt: '2026-11-16T10:00:00Z',
        updatedAt: '2026-11-16T11:00:00Z',
      },
    ]);
  });

  it('setForAnimal envia os ids em snake_case e mapeia o retorno', async () => {
    vi.mocked(httpClient.put).mockResolvedValue([apiPoint]);

    const result = await feedingPointService.setForAnimal(3, [7, 9]);

    expect(httpClient.put).toHaveBeenCalledWith('/animals/3/feeding-points', {
      feeding_point_ids: [7, 9],
    });
    expect(result[0].id).toBe(7);
  });

  it('listAnimals busca e mapeia animais vinculados', async () => {
    vi.mocked(httpClient.get).mockResolvedValue([
      { animal_id: 1, name: 'Mel', status: 'disponivel' },
      { animal_id: 2, name: 'Thor', status: 'adotado' },
    ]);

    const result = await feedingPointService.listAnimals(7);

    expect(httpClient.get).toHaveBeenCalledWith('/feeding-points/7/animals');
    expect(result).toEqual([
      { animalId: 1, name: 'Mel', status: 'disponivel' },
      { animalId: 2, name: 'Thor', status: 'adotado' },
    ]);
  });
});
