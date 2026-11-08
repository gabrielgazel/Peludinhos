import { Heart } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

/** Cuidados fixos exibidos na fita animada (na ordem do conteúdo). */
const CARES = [
  'alimentação',
  'saúde',
  'castração',
  'adoção responsável',
  'vida livre no campus',
];

interface CareListProps {
  /** A segunda lista é apenas visual (laço da animação) e escondida de leitores. */
  hidden?: boolean;
}

function CareList({ hidden = false }: CareListProps) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={cn(
        'flex shrink-0 items-center gap-8 whitespace-nowrap px-4 py-1 font-display text-sm',
        // No mobile (< 640px) a fita é só a lista real: a cópia visual aparece a partir do sm.
        hidden && 'hidden sm:flex',
      )}
    >
      {CARES.map((care) => (
        <li key={care} className="flex items-center gap-8">
          <span>{care}</span>
          <Heart size={14} strokeWidth={2.5} aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Fita horizontal com os cuidados do projeto. A lista acessível aparece uma
 * única vez; a cópia `aria-hidden` serve apenas de laço visual — a animação
 * de rolagem fica no CSS global da Task 8 (`.care-ticker__track`).
 * No mobile (< 640px) a fita vira uma linha com scroll horizontal, sem animação.
 */
export function CareTicker() {
  return (
    <section aria-label="Cuidados do projeto" className="overflow-hidden bg-ink text-paper">
      <div className="mx-auto flex h-11 max-w-[1120px] items-center overflow-x-auto [scrollbar-width:none] sm:overflow-hidden [&::-webkit-scrollbar]:hidden">
        <div
          className={cn(
            'care-ticker__track',
            'flex w-max min-w-full items-center sm:mx-auto',
          )}
        >
          <CareList />
          <CareList hidden />
        </div>
      </div>
    </section>
  );
}
