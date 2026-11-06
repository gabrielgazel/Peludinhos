import { describe, expect, it } from 'vitest';
import type { Animal } from '../../animals/types/animal.types';
import { availabilityLabel, selectAvailableAnimals } from './homeAnimals';

const base: Animal = {
  id: 1, name: 'Mel', sex: 'F', colorDescription: 'Caramelo', age: '2 anos',
  isNeutered: true, status: 'disponivel', behavior: 'docil', notes: null,
  isDeceased: false, photoUrl: null, createdAt: null, updatedAt: null,
};

describe('selectAvailableAnimals', () => {
  it('remove adotados, em processo, indisponíveis e falecidos', () => {
    const animals: Animal[] = [
      base,
      { ...base, id: 2, status: 'adotado' },
      { ...base, id: 3, status: 'em_processo' },
      { ...base, id: 4, status: 'indisponivel' },
      { ...base, id: 5, isDeceased: true },
    ];
    expect(selectAvailableAnimals(animals).map((a) => a.id)).toEqual([1]);
  });
});

describe('availabilityLabel', () => {
  it('descreve carregamento', () => {
    expect(availabilityLabel({ count: 0, loading: true, failed: false }))
      .toBe('Buscando peludinhos...');
  });
  it('descreve erro', () => {
    expect(availabilityLabel({ count: 0, loading: false, failed: true }))
      .toBe('Adoções no campus da UFOPA');
  });
  it('concorda no singular', () => {
    expect(availabilityLabel({ count: 1, loading: false, failed: false }))
      .toBe('1 peludinho esperando agora');
  });
  it('concorda no plural', () => {
    expect(availabilityLabel({ count: 3, loading: false, failed: false }))
      .toBe('3 peludinhos esperando agora');
  });
  it('descreve lista vazia', () => {
    expect(availabilityLabel({ count: 0, loading: false, failed: false }))
      .toBe('Nenhum peludinho disponível agora');
  });
});
