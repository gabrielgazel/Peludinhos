import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import { eventService, mapEvent } from './eventService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const apiEvent = {
  event_id: 21,
  description: 'Mel recebeu vermífugo',
  event_date: '2026-11-18',
  member_id: 42,
  member_name: 'Maria Silva',
  animal_id: 10,
  animal_name: 'Mel',
  created_at: '2026-11-18T09:00:00Z',
  updated_at: '2026-11-18T09:30:00Z',
};

const mappedEvent = {
  id: 21,
  description: 'Mel recebeu vermífugo',
  eventDate: '2026-11-18',
  memberId: 42,
  memberName: 'Maria Silva',
  animalId: 10,
  animalName: 'Mel',
  createdAt: '2026-11-18T09:00:00Z',
  updatedAt: '2026-11-18T09:30:00Z',
};

describe('eventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mapeia event snake_case para camelCase, incluindo autor e animal', () => {
    expect(mapEvent(apiEvent)).toEqual(mappedEvent);
  });

  it('mapeia ocorrência sem animal com campos nulos', () => {
    const result = mapEvent({
      ...apiEvent,
      animal_id: null,
      animal_name: null,
      created_at: null,
      updated_at: null,
    });

    expect(result.animalId).toBeNull();
    expect(result.animalName).toBeNull();
    expect(result.createdAt).toBeNull();
    expect(result.updatedAt).toBeNull();
  });

  it('list monta filtros e paginação na query string e mapeia os itens', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      items: [apiEvent],
      total: 1,
      limit: 20,
      offset: 40,
    });

    const result = await eventService.list({
      from: '2026-11-01',
      to: '2026-11-18',
      animalId: 10,
      q: 'vermífugo',
      limit: 20,
      offset: 40,
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      '/events?from=2026-11-01&to=2026-11-18&animal_id=10&q=verm%C3%ADfugo&limit=20&offset=40',
    );
    expect(result.items).toEqual([mappedEvent]);
    expect(result.total).toBe(1);
  });

  it('list sem filtros não gera query string', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    await eventService.list();

    expect(httpClient.get).toHaveBeenCalledWith('/events');
  });

  it('create envia payload em snake_case', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(apiEvent);

    const result = await eventService.create({
      description: 'Mel recebeu vermífugo',
      eventDate: '2026-11-18',
      animalId: 10,
    });

    expect(httpClient.post).toHaveBeenCalledWith('/events', {
      description: 'Mel recebeu vermífugo',
      event_date: '2026-11-18',
      animal_id: 10,
    });
    expect(result).toEqual(mappedEvent);
  });

  it('create omite campos opcionais não informados', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(apiEvent);

    await eventService.create({ description: 'Ração recolhida' });

    expect(httpClient.post).toHaveBeenCalledWith('/events', {
      description: 'Ração recolhida',
    });
  });

  it('update usa PATCH no id e envia apenas campos informados', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({ ...apiEvent, animal_id: null, animal_name: null });

    const result = await eventService.update(21, {
      description: 'Mel recebeu vermífugo e antipulgas',
      animalId: null,
    });

    expect(httpClient.patch).toHaveBeenCalledWith('/events/21', {
      description: 'Mel recebeu vermífugo e antipulgas',
      animal_id: null,
    });
    expect(result.animalId).toBeNull();
  });
});
