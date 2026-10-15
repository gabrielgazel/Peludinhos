import type { HTMLInputTypeAttribute } from 'react';
import './form-controls.css';

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'email' | 'search';
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  /** Mostra "(opcional)" ao lado do rótulo. */
  optional?: boolean;
  multiline?: boolean;
  rows?: number;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
  required = false,
  optional = false,
  multiline = false,
  rows = 5,
}: TextFieldProps) {
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

      {multiline ? (
        <textarea
          className="tf__input"
          id={id}
          name={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="tf__input"
          id={id}
          name={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

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
