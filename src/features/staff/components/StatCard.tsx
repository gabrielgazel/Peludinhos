import { isValidElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../shared/lib/utils';

type StatCardProps = {
  to: string;
  label: string;
  value: ReactNode;
  icon?: ReactNode;
};

function renderDecorativeIcon(icon: ReactNode): ReactNode {
  if (!icon) return null;

  if (isValidElement(icon)) {
    const props = icon.props as Record<string, unknown>;
    if (
      props['aria-hidden'] !== undefined ||
      props['aria-label'] !== undefined ||
      props['aria-labelledby'] !== undefined
    ) {
      return icon;
    }
  }

  return (
    <span aria-hidden="true" className={cn('inline-flex text-staff-muted')}>
      {icon}
    </span>
  );
}

export function StatCard({ to, label, value, icon }: StatCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        'font-body block rounded-xl border border-staff-line bg-staff-surface p-5 transition-colors hover:border-staff-faint motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent',
      )}
    >
      {renderDecorativeIcon(icon)}
      <p className={cn('text-sm text-staff-muted')}>{label}</p>
      <p className={cn('mt-1 text-2xl font-bold text-staff-ink')}>{value}</p>
    </Link>
  );
}
