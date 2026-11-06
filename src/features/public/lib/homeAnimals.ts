import type { Animal } from '../../animals/types/animal.types';

/**
 * Utilidades da home: seleção de animais disponíveis e rótulo de
 * disponibilidade exibido na hero.
 */

/** Filtra apenas animais aptos a aparecem na vitrine: disponíveis e vivos. */
export function selectAvailableAnimals(animals: Animal[]): Animal[] {
  return animals.filter((a) => a.status === 'disponivel' && !a.isDeceased);
}

interface AvailabilityLabelInput {
  count: number;
  loading: boolean;
  failed: boolean;
}

/**
 * Rótulo do contador da hero, em pt-BR. Precedência: carregando →
 * falha na busca → lista vazia → singular/plural.
 */
export function availabilityLabel({ count, loading, failed }: AvailabilityLabelInput): string {
  if (loading) return 'Buscando peludinhos...';
  if (failed) return 'Adoções no campus da UFOPA';
  if (count === 0) return 'Nenhum peludinho disponível agora';
  if (count === 1) return '1 peludinho esperando agora';
  return `${count} peludinhos esperando agora`;
}
