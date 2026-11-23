import type { ReactNode } from 'react';
import { cn } from '../../../shared/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/ui/table';
import { Alert } from '../../staff/components/Alert';
import { EmptyState } from '../../staff/components/EmptyState';
import { Panel } from '../../staff/components/Panel';

export interface ClinicalRecord {
  id: number;
  createdByMemberId: number | null;
}

export interface ClinicalColumn<T> {
  header: string;
  render: (item: T) => ReactNode;
}

interface ClinicalRecordsSectionProps<T> {
  id: string;
  title: string;
  columns: ClinicalColumn<T>[];
  items: T[];
  loading: boolean;
  error: string | null;
  canCreate: boolean;
  createLabel: string;
  emptyMessage: string;
  onNew: () => void;
  canEdit: (item: T) => boolean;
  onEdit: (item: T) => void;
}

const PRIMARY_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

const SECONDARY_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

export function ClinicalRecordsSection<T extends ClinicalRecord>({
  id,
  title,
  columns,
  items,
  loading,
  error,
  canCreate,
  createLabel,
  emptyMessage,
  onNew,
  canEdit,
  onEdit,
}: ClinicalRecordsSectionProps<T>) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={id} className="font-display text-xl font-semibold text-staff-ink">
          {title}
        </h2>
        <button
          type="button"
          onClick={onNew}
          disabled={!canCreate}
          className={cn(PRIMARY_BUTTON, 'px-3')}
        >
          {createLabel}
        </button>
      </div>

      <Panel className="p-0">
        {error ? (
          <div className="p-4">
            <Alert variant="danger">{error}</Alert>
          </div>
        ) : loading ? (
          <EmptyState>Carregando...</EmptyState>
        ) : items.length === 0 ? (
          <EmptyState>{emptyMessage}</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.header}>{column.header}</TableHead>
                ))}
                <TableHead>Autor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column) => (
                    <TableCell key={column.header}>{column.render(item)}</TableCell>
                  ))}
                  <TableCell>
                    {item.createdByMemberId === null
                      ? '—'
                      : `Membro #${item.createdByMemberId}`}
                  </TableCell>
                  <TableCell>
                    {canEdit(item) ? (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className={cn(SECONDARY_BUTTON, 'px-3')}
                      >
                        Editar
                      </button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </section>
  );
}
