import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { animalService } from '../services/animalService';
import type { Animal } from '../types/animal.types';
import { useAnimal } from './useAnimals';

vi.mock('../services/animalService', () => ({
  animalService: { getById: vi.fn(), list: vi.fn() },
}));

const getById = vi.mocked(animalService.getById);

const mel: Animal = {
  id: 5,
  name: 'Mel',
  sex: 'F',
  colorDescription: null,
  age: '2 anos',
  isNeutered: true,
  status: 'disponivel',
  behavior: 'docil',
  notes: null,
  isDeceased: false,
  deathDate: null,
  deathCause: null,
  photoUrl: null,
  createdAt: null,
  updatedAt: null,
};

describe('useAnimal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reload refaz a busca do animal', async () => {
    getById
      .mockResolvedValueOnce(mel)
      .mockResolvedValueOnce({ ...mel, isDeceased: true, deathDate: '2026-11-20' });

    const { result } = renderHook(() => useAnimal(mel.id));

    await waitFor(() => expect(getById).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(getById).toHaveBeenCalledTimes(2));
    expect(result.current.animal?.deathDate).toBe('2026-11-20');
  });
});
