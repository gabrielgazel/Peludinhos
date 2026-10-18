import './form-controls.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  /** Texto da opção vazia (ex.: "Selecione..."). Sem ele, não há opção vazia. */
  placeholder?: string;
  disabled?: boolean;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
  hint,
  required = false,
  optional = false,
  placeholder,
  disabled = false,
}: SelectFieldProps) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className="tf">
      <label className="tf__label" htmlFor={id}>
        {label}
        {optional && <span className="tf__optional"> (opcional)</span>}
      </label>

      <select
        className="tf__input tf__select"
        id={id}
        name={id}
        value={value}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hint && (
        <p className="tf__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="tf__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
