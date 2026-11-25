import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import type { ApiAnimal } from '../types/animal.types';
import { animalService, mapAnimal } from './animalService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const row: ApiAnimal = {
  animal_id: 5,
  name: 'Mel',
  sex: 'F',
  color_description: null,
  age: null,
  is_neutered: true,
  status: 'indisponivel',
  behavior: null,
  notes: null,
  is_deceased: true,
  photo_path: null,
  photo_url: null,
  fk_administrator_member_id: null,
  fk_mother: null,
  created_at: null,
  updated_at: null,
};

describe('animalService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapeia data e causa do óbito e normaliza campos ausentes', () => {
    const mapeado = mapAnimal({
      ...row,
      death_date: '2026-11-20',
      death_cause: 'Atropelamento',
    });
    expect(mapeado.deathDate).toBe('2026-11-20');
    expect(mapeado.deathCause).toBe('Atropelamento');

    const semObito = mapAnimal(row);
    expect(semObito.deathDate).toBeNull();
    expect(semObito.deathCause).toBeNull();
  });

  it('updateDeceased usa PATCH e envia snake_case', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({
      ...row,
      death_date: '2026-11-20',
      death_cause: 'Atropelamento',
    });

    const result = await animalService.updateDeceased(5, {
      deathDate: '2026-11-20',
      deathCause: 'Atropelamento',
    });

    expect(httpClient.patch).toHaveBeenCalledWith('/animals/5/deceased', {
      death_date: '2026-11-20',
      death_cause: 'Atropelamento',
    });
    expect(result.deathDate).toBe('2026-11-20');
    expect(result.deathCause).toBe('Atropelamento');
  });

  it('updateDeceased preserva detail da API', async () => {
    vi.mocked(httpClient.patch).mockRejectedValue(
      Object.assign(new Error('Erro 422'), {
        body: { detail: 'Data do óbito não pode ser futura.' },
      }),
    );

    await expect(
      animalService.updateDeceased(5, {
        deathDate: '2026-11-20',
        deathCause: null,
      }),
    ).rejects.toThrow('Data do óbito não pode ser futura.');
  });

  it('updateDeceased traduz erro genérico', async () => {
    vi.mocked(httpClient.patch).mockRejectedValue(new Error('Failed to fetch'));

    await expect(
      animalService.updateDeceased(5, {
        deathDate: '2026-11-20',
        deathCause: null,
      }),
    ).rejects.toThrow('Não foi possível salvar o óbito.');
  });

  it('markDeceased continua em POST sem corpo', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      ...row,
      death_date: '2026-11-20',
      death_cause: null,
    });

    const result = await animalService.markDeceased(5);

    expect(httpClient.post).toHaveBeenCalledWith('/animals/5/deceased');
    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(result.deathDate).toBe('2026-11-20');
    expect(result.deathCause).toBeNull();
  });
});
