import { ANIMALS_MOCK } from '../data/animals.mock';
import type { Animal } from '../types/animal.types';

const FAKE_DELAY_MS = 400;

function respond<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), FAKE_DELAY_MS);
  });
}

/**
 * Service MOCKADO: a peludinhos-api ainda não tem endpoints de animais.
 * Quando existirem, trocar só o corpo destas funções, por exemplo:
 *
 *   listAvailable: () => httpClient.get<Animal[]>('/animals?status=disponivel'),
 *   getById: (id) => httpClient.get<Animal>(`/animals/${id}`),
 *
 * As páginas e hooks não precisam mudar.
 */
export const animalService = {
  listAvailable: (): Promise<Animal[]> =>
    respond(ANIMALS_MOCK.filter((animal) => animal.status === 'disponivel')),

  getById: (id: number): Promise<Animal | null> =>
    respond(ANIMALS_MOCK.find((animal) => animal.id === id) ?? null),
};
