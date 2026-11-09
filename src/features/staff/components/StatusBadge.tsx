import type { ReactNode } from 'react';
import { cn } from '../../../shared/lib/utils';
import type { BadgeTone } from '../utils/badges';

const TONE_CLASS: Record<BadgeTone, string> = {
  green: 'bg-staff-success/20 text-staff-ink',
  amber: 'bg-staff-accent-soft text-staff-ink',
  red: 'bg-staff-danger/10 text-staff-danger',
  gray: 'bg-staff-line/50 text-staff-muted',
};

type StatusBadgeProps = {
  tone: BadgeTone;
  children: ReactNode;
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASS[tone],
      )}
    >
      {children}
    </span>
  );
}
