import type {
  AnimalBehavior,
  AnimalSex,
  AnimalStatus,
} from '../types/animal.types';

export const SEX_LABEL: Record<AnimalSex, string> = {
  M: 'Macho',
  F: 'Fêmea',
};

export const BEHAVIOR_LABEL: Record<AnimalBehavior, string> = {
  docil: 'Dócil',
  sociavel: 'Sociável',
  assustado: 'Assustado',
  agressivo: 'Agressivo',
  independente: 'Independente',
};

export const STATUS_LABEL: Record<AnimalStatus, string> = {
  disponivel: 'Disponível',
  em_processo: 'Em processo',
  adotado: 'Adotado',
  indisponivel: 'Indisponível',
};

export const BEHAVIOR_OPTIONS: { value: AnimalBehavior; label: string }[] = [
  { value: 'docil', label: BEHAVIOR_LABEL.docil },
  { value: 'sociavel', label: BEHAVIOR_LABEL.sociavel },
  { value: 'assustado', label: BEHAVIOR_LABEL.assustado },
  { value: 'agressivo', label: BEHAVIOR_LABEL.agressivo },
  { value: 'independente', label: BEHAVIOR_LABEL.independente },
];

export const STATUS_OPTIONS: { value: AnimalStatus; label: string }[] = [
  { value: 'disponivel', label: STATUS_LABEL.disponivel },
  { value: 'em_processo', label: STATUS_LABEL.em_processo },
  { value: 'adotado', label: STATUS_LABEL.adotado },
  { value: 'indisponivel', label: STATUS_LABEL.indisponivel },
];
