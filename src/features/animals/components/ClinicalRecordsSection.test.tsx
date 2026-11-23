import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ClinicalRecordsSection,
  type ClinicalColumn,
  type ClinicalRecord,
} from './ClinicalRecordsSection';

interface TestRecord extends ClinicalRecord {
  title: string;
}

const item: TestRecord = { id: 1, createdByMemberId: 7, title: 'Consulta' };

const columns: ClinicalColumn<TestRecord>[] = [
  { header: 'Título', render: (record) => record.title },
];

interface SectionOptions {
  items?: TestRecord[];
  loading?: boolean;
  error?: string | null;
  canCreate?: boolean;
  createLabel?: string;
  emptyMessage?: string;
  onNew?: () => void;
  canEdit?: (record: TestRecord) => boolean;
  onEdit?: (record: TestRecord) => void;
}

function buildSection({
  items = [item],
  loading = false,
  error = null,
  canCreate = true,
  createLabel = 'Novo registro',
  emptyMessage = 'Nenhum registro ainda.',
  onNew = vi.fn(),
  canEdit = () => true,
  onEdit = vi.fn(),
}: SectionOptions = {}) {
  return (
    <ClinicalRecordsSection<TestRecord>
      id="historico-veterinario"
      title="Histórico veterinário"
      columns={columns}
      items={items}
      loading={loading}
      error={error}
      canCreate={canCreate}
      createLabel={createLabel}
      emptyMessage={emptyMessage}
      onNew={onNew}
      canEdit={canEdit}
      onEdit={onEdit}
    />
  );
}

describe('ClinicalRecordsSection', () => {
  it('renderiza colunas, autor e ação de editar', () => {
    const onEdit = vi.fn();
    render(buildSection({ onEdit }));

    const region = screen.getByRole('region', { name: 'Histórico veterinário' });
    expect(region).toBeInTheDocument();
    expect(within(region).getByRole('columnheader', { name: 'Título' })).toBeInTheDocument();
    expect(within(region).getByText('Consulta')).toBeInTheDocument();
    expect(within(region).getByText('Membro #7')).toBeInTheDocument();

    fireEvent.click(within(region).getByRole('button', { name: 'Editar' }));
    expect(onEdit).toHaveBeenCalledWith(item);
  });

  it('mostra travessão quando o autor é desconhecido', () => {
    render(buildSection({ items: [{ ...item, createdByMemberId: null }] }));

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('mostra estado vazio e erro em alerta', () => {
    const view = render(buildSection({ items: [] }));
    expect(screen.getByText('Nenhum registro ainda.')).toBeInTheDocument();

    view.rerender(buildSection({ items: [], error: 'Não foi possível carregar.' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('desabilita criação e esconde edição sem permissão', () => {
    render(buildSection({ canCreate: false, canEdit: () => false }));

    expect(screen.getByRole('button', { name: 'Novo registro' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('não oferece exclusão', () => {
    render(buildSection());

    expect(screen.queryByRole('button', { name: /Excluir|Remover/i })).toBeNull();
  });
});
