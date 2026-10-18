import type { AnimalStatus } from '../../animals/types/animal.types';
import { STATUS_LABEL } from '../../animals/constants/animal.labels';
import type { IntentStatus } from '../../adoption/types/adoption.types';

export type BadgeTone = 'green' | 'amber' | 'red' | 'gray';

export const ANIMAL_STATUS_TONE: Record<AnimalStatus, BadgeTone> = {
  disponivel: 'green',
  em_processo: 'amber',
  adotado: 'gray',
  indisponivel: 'gray',
};

export { STATUS_LABEL as ANIMAL_STATUS_LABEL };

export const INTENT_STATUS_LABEL: Record<IntentStatus, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  cancelada: 'Cancelada',
};

export const INTENT_STATUS_TONE: Record<IntentStatus, BadgeTone> = {
  pendente: 'amber',
  aprovada: 'green',
  rejeitada: 'red',
  cancelada: 'gray',
};

export const INTENT_STATUS_OPTIONS = [
  { value: 'pendente', label: INTENT_STATUS_LABEL.pendente },
  { value: 'aprovada', label: INTENT_STATUS_LABEL.aprovada },
  { value: 'rejeitada', label: INTENT_STATUS_LABEL.rejeitada },
  { value: 'cancelada', label: INTENT_STATUS_LABEL.cancelada },
];
