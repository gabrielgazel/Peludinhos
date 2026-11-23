import type { AdoptionIntent } from '../../adoption/types/adoption.types';
import { formatDate } from '../../../shared/utils/format';

const TERM_COMMITMENT =
  'Declaro que recebo o animal acima em adoção definitiva e me comprometo a proporcionar-lhe cuidados, alimentação, abrigo e acompanhamento veterinário adequados, conforme as informações fornecidas no pedido de adoção.';

/**
 * Gera o texto do termo de adoção (somente leitura).
 *
 * O termo tem duas linhas: o cabeçalho com os dados da adoção e a declaração
 * de compromisso. O responsável por trás da adoção usa `—` quando não há vínculo.
 */
export function buildAdoptionTerm(
  intent: AdoptionIntent,
  responsibleMemberId: number | null,
  adoptionDate: string,
): string {
  const responsible = responsibleMemberId === null ? '—' : `Membro #${responsibleMemberId}`;
  const firstLine = `Adoção definitiva — Pedido #${intent.id} — Animal ${
    intent.animal?.name ?? `Animal #${intent.animalId}`
  } — Adotante ${intent.visitor?.name ?? `Visitante #${intent.visitorId}`} — Data ${formatDate(
    adoptionDate,
  )} — Responsável ${responsible}.`;

  return `${firstLine}\n${TERM_COMMITMENT}`;
}
