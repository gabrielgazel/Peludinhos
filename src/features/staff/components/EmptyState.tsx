import type { ReactNode } from 'react';
import { cn } from '../../../shared/lib/utils';

type EmptyStateProps = {
  children: ReactNode;
};

export function EmptyState({ children }: EmptyStateProps) {
  return (
    <div role="status" className={cn('font-body p-8 text-center text-staff-muted')}>
      {children}
    </div>
  );
}
