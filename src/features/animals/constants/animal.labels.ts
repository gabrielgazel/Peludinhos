import type { AnimalBehavior, AnimalSex } from '../types/animal.types';

export const SEX_LABEL: Record<AnimalSex, string> = {
  M: 'Macho',
  F: 'Fêmea',
};

export const BEHAVIOR_LABEL: Record<AnimalBehavior, string> = {
  docil: 'Dócil',
  brincalhao: 'Brincalhão',
  timido: 'Tímido',
  agitado: 'Agitado',
};
