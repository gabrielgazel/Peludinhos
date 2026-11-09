import type { ReactNode } from 'react';
import { cn } from '../../../shared/lib/utils';

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return (
    <div className={cn('font-body rounded-home border border-staff-line bg-staff-surface p-5', className)}>
      {children}
    </div>
  );
}
