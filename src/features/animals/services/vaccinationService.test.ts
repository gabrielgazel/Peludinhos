import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import {
  mapVaccination,
  vaccinationService,
  type ApiVaccination,
} from './vaccinationService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const row: ApiVaccination = {
  vaccination_id: 8,
  animal_id: 5,
  vaccine: 'V10',
  application_date: '2026-09-12',
  dose: '1ª dose',
  notes: null,
  created_by_member_id: 7,
  created_at: null,
  updated_at: null,
};

describe('vaccinationService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapeia vaccination_id e normaliza campos opcionais ausentes', () => {
    const mapped = {
      id: 8,
      animalId: 5,
      vaccine: 'V10',
      applicationDate: '2026-09-12',
      dose: '1ª dose',
      notes: null,
      createdByMemberId: 7,
      createdAt: null,
      updatedAt: null,
    };
    expect(mapVaccination(row)).toEqual(mapped);
    const semOpcionais: Omit<
      ApiVaccination,
      'dose' | 'notes' | 'created_at' | 'updated_at'
    > = {
      vaccination_id: 8,
      animal_id: 5,
      vaccine: 'V10',
      application_date: '2026-09-12',
      created_by_member_id: 7,
    };
    expect(mapVaccination(semOpcionais)).toEqual({
      ...mapped,
      dose: null,
      notes: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('list usa a rota aninhada e envia filtros em snake_case', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ items: [row], total: 1, limit: 200, offset: 0 });
    const page = await vaccinationService.list(5, { limit: 200 });
    expect(httpClient.get).toHaveBeenCalledWith('/animals/5/vaccinations?limit=200');
    expect(page.items[0].id).toBe(8);
  });

  it('create envia o autor da sessão em created_by_member_id', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(row);
    await vaccinationService.create(5, {
      vaccine: 'V10',
      applicationDate: '2026-09-12',
      dose: '1ª dose',
      notes: null,
      createdByMemberId: 7,
    });
    expect(httpClient.post).toHaveBeenCalledWith('/animals/5/vaccinations', {
      vaccine: 'V10',
      application_date: '2026-09-12',
      dose: '1ª dose',
      notes: null,
      created_by_member_id: 7,
    });
  });

  it('update envia somente os campos informados na rota do recurso', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(row);
    await vaccinationService.update(8, { notes: 'Reforço agendado.' });
    expect(httpClient.patch).toHaveBeenCalledWith('/vaccinations/8', {
      notes: 'Reforço agendado.',
    });
  });
});
