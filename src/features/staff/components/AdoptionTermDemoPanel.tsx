import type { AdoptionIntent } from '../../adoption/types/adoption.types';
import { BEHAVIOR_LABEL, SEX_LABEL } from '../../animals/constants/animal.labels';
import { formatDateTime } from '../../../shared/utils/format';
import { DemoBanner } from './DemoBanner';

type AdoptionTermDemoPanelProps = {
  intent: AdoptionIntent;
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
 * Prévia somente leitura do termo de adoção (D4.5).
 *
 * Os dados vêm da intenção real e do animal que já estão carregados na tela:
 * não há service de adoção, escrita, mudança de status nem endpoint novo.
 * A marca d'água e a `DemoBanner` deixam claro que isto NÃO é um registro.
 */
export function AdoptionTermDemoPanel({ intent }: AdoptionTermDemoPanelProps) {
  const animal = intent.animal;
  const titleId = `termo-demo-title-${intent.id}`;

  return (
    <section
      id={`termo-demo-${intent.id}`}
      aria-labelledby={titleId}
      className="relative mt-4 overflow-hidden rounded-xl border border-dashed border-staff-line bg-staff-bg p-5"
    >
      <p
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center -rotate-12 text-5xl font-black tracking-[0.2em] text-staff-ink/10 sm:text-7xl"
      >
        DEMONSTRAÇÃO
      </p>

      <div className="relative flex flex-col gap-4">
        <h2 id={titleId} className="font-display text-lg font-semibold text-staff-ink">
          Termo de adoção (prévia)
        </h2>

        <DemoBanner />

        <dl className="rounded-lg border border-staff-line bg-staff-surface px-4 py-2">
          <Field label="Adotante" value={intent.visitor?.name ?? `Visitante #${intent.visitorId}`} />
          <Field label="E-mail" value={intent.visitor?.email ?? '—'} />
          <Field label="Animal" value={animal?.name ?? `Animal #${intent.animalId}`} />
          <Field label="Sexo" value={animal ? SEX_LABEL[animal.sex] : '—'} />
          <Field label="Idade" value={animal?.age ?? '—'} />
          <Field label="Pelagem" value={animal?.colorDescription ?? '—'} />
          <Field
            label="Temperamento"
            value={animal?.behavior ? BEHAVIOR_LABEL[animal.behavior] : '—'}
          />
          <Field label="Castrado" value={animal ? (animal.isNeutered ? 'Sim' : 'Não') : '—'} />
          <Field label="Pedido" value={`#${intent.id}`} />
          <Field label="Data do pedido" value={formatDateTime(intent.createdAt)} />
          <Field label="Motivação" value={intent.motivation} />
        </dl>

        <p className="text-sm font-semibold text-staff-ink">
          O registro definitivo da adoção entra no backlog (B3).
        </p>
        <p className="text-sm text-staff-muted">
          Esta prévia não altera o status da intenção e não registra a adoção.
        </p>
      </div>
    </section>
  );
}
