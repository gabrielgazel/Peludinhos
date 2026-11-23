import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import {
  mapVeterinaryHistory,
  veterinaryHistoryService,
  type ApiVeterinaryHistory,
} from './veterinaryHistoryService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const row: ApiVeterinaryHistory = {
  history_id: 3,
  animal_id: 5,
  record_date: '2026-10-02',
  title: 'Consulta de rotina',
  description: 'Animal saudável.',
  created_by_member_id: 7,
  created_at: '2026-10-02T10:00:00',
  updated_at: null,
};

describe('veterinaryHistoryService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapeia history_id e normaliza campos opcionais ausentes', () => {
    const mapped = {
      id: 3,
      animalId: 5,
      recordDate: '2026-10-02',
      title: 'Consulta de rotina',
      description: 'Animal saudável.',
      createdByMemberId: 7,
      createdAt: '2026-10-02T10:00:00',
      updatedAt: null,
    };
    expect(mapVeterinaryHistory(row)).toEqual(mapped);
    const semOpcionais: Omit<ApiVeterinaryHistory, 'created_at' | 'updated_at'> = {
      history_id: 3,
      animal_id: 5,
      record_date: '2026-10-02',
      title: 'Consulta de rotina',
      description: 'Animal saudável.',
      created_by_member_id: 7,
    };
    expect(mapVeterinaryHistory(semOpcionais)).toEqual({ ...mapped, createdAt: null });
  });

  it('list usa a rota aninhada e envia filtros em snake_case', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ items: [row], total: 1, limit: 200, offset: 0 });
    const page = await veterinaryHistoryService.list(5, { q: 'consulta', limit: 200 });
    expect(httpClient.get).toHaveBeenCalledWith(
      '/animals/5/veterinary-history?q=consulta&limit=200',
    );
    expect(page.items[0].id).toBe(3);
  });

  it('create envia o autor da sessão em created_by_member_id', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(row);
    await veterinaryHistoryService.create(5, {
      title: 'Consulta de rotina',
      recordDate: '2026-10-02',
      description: 'Animal saudável.',
      createdByMemberId: 7,
    });
    expect(httpClient.post).toHaveBeenCalledWith('/animals/5/veterinary-history', {
      title: 'Consulta de rotina',
      record_date: '2026-10-02',
      description: 'Animal saudável.',
      created_by_member_id: 7,
    });
  });

  it('update envia somente os campos informados na rota do recurso', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(row);
    await veterinaryHistoryService.update(3, { description: 'Reavaliado.' });
    expect(httpClient.patch).toHaveBeenCalledWith('/veterinary-history/3', {
      description: 'Reavaliado.',
    });
  });
});
