import { useState, type FormEvent } from 'react';
import { TextField } from '../../../shared/components/TextField';
import { Alert } from '../../staff/components/Alert';
import { Panel } from '../../staff/components/Panel';

export interface FormField {
  name: string;
  label: string;
  kind?: 'text' | 'date' | 'textarea';
  required?: boolean;
  optional?: boolean;
  maxLength?: number;
}

interface ClinicalRecordFormProps {
  title: string;
  fields: FormField[];
  initialValues: Record<string, string>;
  submitLabel: string;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>) => void;
}

const PRIMARY_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

const SECONDARY_BUTTON =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

export function ClinicalRecordForm({
  title,
  fields,
  initialValues,
  submitLabel,
  error,
  onCancel,
  onSubmit,
}: ClinicalRecordFormProps) {
  const initialKey = JSON.stringify(initialValues);
  const [state, setState] = useState(() => ({
    key: initialKey,
    values: { ...initialValues },
  }));

  // Reutilizar a instância para outro registro deve recomeçar com os novos valores.
  // A chave serializada evita resetar o formulário quando só a identidade do objeto muda.
  if (state.key !== initialKey) {
    setState({ key: initialKey, values: { ...initialValues } });
  }
  const values = state.values;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <Panel>
      <h2 className="font-display text-lg font-semibold text-staff-ink">{title}</h2>

      {error ? (
        <div className="mt-4">
          <Alert variant="danger">{error}</Alert>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const kind = field.kind ?? 'text';
            return (
              <div key={field.name} className={kind === 'textarea' ? 'sm:col-span-2' : undefined}>
                <TextField
                  id={field.name}
                  label={field.label}
                  value={values[field.name] ?? ''}
                  onChange={(value) =>
                    setState((current) => ({
                      key: current.key,
                      values: { ...current.values, [field.name]: value },
                    }))
                  }
                  type={kind === 'date' ? 'date' : 'text'}
                  multiline={kind === 'textarea'}
                  rows={kind === 'textarea' ? 3 : undefined}
                  required={field.required}
                  optional={field.optional}
                  maxLength={field.maxLength}
                />
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-staff-line pt-4">
          <button type="submit" className={PRIMARY_BUTTON}>
            {submitLabel}
          </button>
          <button type="button" onClick={onCancel} className={SECONDARY_BUTTON}>
            Cancelar
          </button>
        </div>
      </form>
    </Panel>
  );
}
