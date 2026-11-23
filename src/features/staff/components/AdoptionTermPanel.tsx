import type { AdoptionIntent } from '../../adoption/types/adoption.types';
import { BEHAVIOR_LABEL, SEX_LABEL } from '../../animals/constants/animal.labels';
import { formatDate, formatDateTime } from '../../../shared/utils/format';
import './adoption-term.css';

type AdoptionTermPanelProps = {
  intent: AdoptionIntent;
  adoptionDate: string;
  responsibleMemberId: number | null;
  termText: string;
  onPrint: () => void;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,8rem)_1fr] gap-2 border-b border-staff-line py-2 last:border-b-0 sm:grid-cols-[minmax(0,11rem)_1fr]">
      <dt className="text-sm font-semibold text-staff-muted">{label}</dt>
      <dd className="text-sm text-staff-ink">{value}</dd>
    </div>
  );
}

/**
 * Termo de adoção (somente leitura) com a área imprimível.
 *
 * É 100% presentacional: quem decide imprimir é a página (`onPrint`); este
 * componente não chama `window.print()` e não tem nenhum campo editável.
 */
export function AdoptionTermPanel({
  intent,
  adoptionDate,
  responsibleMemberId,
  termText,
  onPrint,
}: AdoptionTermPanelProps) {
  const animal = intent.animal;
  const visitor = intent.visitor;
  const titleId = `termo-adocao-title-${intent.id}`;

  return (
    <section
      aria-labelledby={titleId}
      className="relative mt-4 overflow-hidden rounded-xl border border-staff-line bg-staff-bg p-5"
    >
      <div className="relative flex flex-col gap-4">
        <h2 id={titleId} className="font-display text-lg font-semibold text-staff-ink">
          Termo de adoção
        </h2>

        <dl className="rounded-lg border border-staff-line bg-staff-surface px-4 py-2">
          <Field label="Adotante" value={visitor?.name ?? `Visitante #${intent.visitorId}`} />
          <Field label="E-mail" value={visitor?.email ?? '—'} />
          <Field label="Animal" value={animal?.name ?? `Animal #${intent.animalId}`} />
          <Field label="Sexo" value={animal ? SEX_LABEL[animal.sex] : '—'} />
          <Field label="Temperamento" value={animal?.behavior ? BEHAVIOR_LABEL[animal.behavior] : '—'} />
          <Field label="Data da adoção" value={formatDate(adoptionDate)} />
          <Field label="Data do pedido" value={formatDateTime(intent.createdAt)} />
          <Field
            label="Responsável"
            value={responsibleMemberId ? `Membro #${responsibleMemberId}` : '—'}
          />
          <Field label="Motivação" value={intent.motivation} />
        </dl>

        <p className="whitespace-pre-line adoption-term-print text-sm text-staff-ink">{termText}</p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-no-print
            className="inline-flex min-h-11 items-center rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
            onClick={onPrint}
          >
            Imprimir termo
          </button>
        </div>
      </div>
    </section>
  );
}
