import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import { adoptionRecordService, mapAdoption } from './adoptionRecordService';
import type { Adoption, ApiAdoption } from '../types/adoption.types';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const row: ApiAdoption = {
  adoption_id: 21,
  fk_adoption_intent_id: 3,
  fk_animal_id: 6,
  fk_visitor_id: 11,
  fk_responsible_member_id: 7,
  adoption_date: '2026-11-20',
  term_text: 'Termo registrado.',
  created_at: null,
  updated_at: null,
};

const expectedAdoption: Adoption = {
  id: 21,
  adoptionIntentId: 3,
  animalId: 6,
  visitorId: 11,
  responsibleMemberId: 7,
  adoptionDate: '2026-11-20',
  termText: 'Termo registrado.',
  createdAt: null,
  updatedAt: null,
};

describe('adoptionRecordService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapeia linha da API para camelCase', () => {
    expect(mapAdoption(row)).toEqual(expectedAdoption);
  });

  it('aceita campos opcionais ausentes', () => {
    const semOpcionais: Omit<ApiAdoption, 'created_at' | 'updated_at'> = {
      adoption_id: 21,
      fk_adoption_intent_id: 3,
      fk_animal_id: 6,
      fk_visitor_id: 11,
      fk_responsible_member_id: 7,
      adoption_date: '2026-11-20',
      term_text: 'Termo registrado.',
    };
    expect(mapAdoption(semOpcionais)).toEqual({
      ...expectedAdoption,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('cria adoção convertendo o payload', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(row);
    const adoption = await adoptionRecordService.create({
      adoptionIntentId: 3,
      responsibleMemberId: 7,
      adoptionDate: '2026-11-23',
      termText: 'Termo registrado.',
    });

    expect(httpClient.post).toHaveBeenCalledWith('/adoptions', {
      adoption_intent_id: 3,
      fk_responsible_member_id: 7,
      adoption_date: '2026-11-23',
      term_text: 'Termo registrado.',
    });
    expect(adoption).toEqual(expectedAdoption);
  });
});
