import type { ReactNode } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { cn } from '../../../shared/lib/utils';

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Aplica o reveal de seção: os filhos ficam dentro de um wrapper que marca
 * `data-visible` quando entra na viewport (a animação vive no CSS da Task 8).
 */
export function Reveal({ children, className }: RevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-visible={isVisible}
      className={cn('home-reveal', className)}
    >
      {children}
    </div>
  );
}
