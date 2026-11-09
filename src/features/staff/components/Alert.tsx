import type { ReactNode } from 'react';
import { cn } from '../../../shared/lib/utils';

type AlertProps = {
  variant?: 'info' | 'danger';
  children: ReactNode;
};

export function Alert({ variant = 'info', children }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'font-body rounded-md border border-staff-line border-l-4 p-4 text-staff-ink',
        variant === 'danger'
          ? 'border-l-staff-danger bg-staff-danger/5'
          : 'border-l-staff-accent bg-staff-accent-soft/40',
      )}
    >
      {children}
    </div>
  );
}
