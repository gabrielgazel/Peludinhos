import { cn } from '../../../shared/lib/utils';

/** Passos reais da adoção — textos preservados da página anterior. */
const STEPS = [
  {
    title: 'Escolha um peludinho',
    text: 'Veja os animais disponíveis e conheça a história e o jeito de cada um.',
  },
  {
    title: 'Manifeste seu interesse',
    text: 'Preencha o formulário de intenção de adoção com seus dados e o motivo.',
  },
  {
    title: 'Converse com a equipe',
    text: 'A equipe analisa o pedido e entra em contato para os próximos passos.',
  },
];

/**
 * Timeline da adoção em passos numerados. No desktop os passos ficam lado a
 * lado; no mobile, empilhados com a sequência à esquerda. A linha tracejada
 * que liga os círculos é desenhada pelo CSS da página (Task 8), por isso as
 * classes `home-timeline*`.
 */
export function AdoptionTimeline() {
  return (
    <section
      aria-labelledby="como-funciona"
      className="pub-container py-[clamp(56px,8vw,96px)]"
    >
      <h2 id="como-funciona" className="font-display text-3xl text-ink">
        Como funciona a adoção
      </h2>

      <ol
        role="list"
        className={cn(
          'home-timeline relative mt-10 grid list-none grid-cols-1 gap-8 p-0',
          'lg:grid-cols-3 lg:gap-10',
        )}
      >
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="home-timeline__item relative grid grid-cols-[44px_1fr] items-start gap-4 lg:block"
          >
            <span
              aria-hidden="true"
              className="home-timeline__number flex size-11 shrink-0 items-center justify-center rounded-full bg-marker font-display text-lg font-bold text-ink"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="lg:mt-5">
              <h3 className="font-display text-xl text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
