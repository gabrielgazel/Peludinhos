import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClinicalRecordForm, type FormField } from './ClinicalRecordForm';

const fields: FormField[] = [
  { name: 'title', label: 'Título' },
  { name: 'date', label: 'Data do registro', kind: 'date' },
  { name: 'notes', label: 'Descrição', kind: 'textarea' },
];

const initialValues: Record<string, string> = {
  title: 'Consulta',
  date: '2026-11-23',
  notes: 'Animal saudável',
};

interface FormOptions {
  error?: string | null;
  onCancel?: () => void;
  onSubmit?: (values: Record<string, string>) => void;
}

function renderForm({ error = null, onCancel = vi.fn(), onSubmit = vi.fn() }: FormOptions = {}) {
  render(
    <ClinicalRecordForm
      title="Novo registro"
      fields={fields}
      initialValues={initialValues}
      submitLabel="Salvar registro"
      error={error}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />,
  );
  return { onCancel, onSubmit };
}

describe('ClinicalRecordForm', () => {
  it('renderiza campos de texto, data e texto longo com os rótulos recebidos', () => {
    renderForm();

    expect(screen.getByLabelText('Título')).toHaveValue('Consulta');
    const date = screen.getByLabelText('Data do registro');
    expect(date).toHaveAttribute('type', 'date');
    expect(date).toHaveValue('2026-11-23');
    const notes = screen.getByLabelText('Descrição');
    expect(notes.tagName).toBe('TEXTAREA');
    expect(notes).toHaveValue('Animal saudável');
  });

  it('envia os valores atuais e permite cancelar', () => {
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    renderForm({ onCancel, onSubmit });

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nova consulta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar registro' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Nova consulta',
      date: '2026-11-23',
      notes: 'Animal saudável',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('mostra erro recebido em alerta', () => {
    renderForm({ error: 'Não foi possível salvar.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar.');
  });
});
