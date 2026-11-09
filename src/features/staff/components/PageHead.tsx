import type { ReactNode } from 'react';
import { cn } from '../../../shared/lib/utils';

type PageHeadProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHead({ title, subtitle, actions }: PageHeadProps) {
  return (
    <div className={cn('font-body flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between')}>
      <div>
        <h1 className={cn('font-body text-2xl font-semibold text-staff-ink')}>{title}</h1>
        {subtitle ? <p className={cn('mt-1 text-staff-muted')}>{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className={cn('flex flex-wrap items-center gap-3')}>{actions}</div>
      ) : null}
    </div>
  );
}
