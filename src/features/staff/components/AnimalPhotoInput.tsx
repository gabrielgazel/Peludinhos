import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react';

/** O que o formulário deve fazer com a foto ao salvar. */
export interface PhotoChange {
  /** Arquivo novo escolhido (null quando não há troca). */
  file: File | null;
  /** true quando o usuário pediu para remover a foto atual. */
  remove: boolean;
}

interface AnimalPhotoInputProps {
  /** URL da foto atual do animal (edição) ou null (novo animal). */
  currentUrl: string | null;
  onChange: (change: PhotoChange) => void;
  disabled?: boolean;
}

/**
 * Campo de foto do animal: mostra a imagem atual, permite escolher um
 * arquivo novo (com pré-visualização) ou remover a foto existente.
 * O upload em si é feito pelo formulário ao salvar.
 */
export function AnimalPhotoInput({
  currentUrl,
  onChange,
  disabled = false,
}: AnimalPhotoInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  function clearObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    clearObjectUrl();

    if (!file) {
      setPreviewUrl(null);
      setRemoved(false);
      onChange({ file: null, remove: false });
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
    setRemoved(false);
    onChange({ file, remove: false });
  }

  function handleRemove() {
    clearObjectUrl();
    setPreviewUrl(null);
    setRemoved(true);
    onChange({ file: null, remove: true });
  }

  function handleUndo() {
    clearObjectUrl();
    setPreviewUrl(null);
    setRemoved(false);
    onChange({ file: null, remove: false });
  }

  const shownUrl = previewUrl ?? (removed ? null : currentUrl);
  const hasPhoto = Boolean(shownUrl);

  return (
    <div className="space-y-3">
      <p className="tf__label" id="animal-photo-label">
        Foto do animal
      </p>

      <div
        className="flex h-40 w-full max-w-xs items-center justify-center overflow-hidden rounded-xl border border-staff-line bg-staff-bg"
        aria-hidden={!hasPhoto}
      >
        {shownUrl ? (
          <img
            src={shownUrl}
            alt="Pré-visualização da foto do animal"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm text-staff-muted">
            <ImagePlus size={30} aria-hidden="true" />
            Sem foto
          </span>
        )}
      </div>

      <p className="tf__hint">
        JPG, PNG, WEBP ou GIF, até 5 MB. A foto aparece no catálogo e nos
        detalhes do animal.
      </p>

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-staff-accent motion-reduce:transition-none">
          {hasPhoto ? 'Trocar foto' : 'Escolher foto'}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            aria-labelledby="animal-photo-label"
            onChange={handleSelect}
            disabled={disabled}
            className="sr-only"
          />
        </label>

        {hasPhoto && (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-danger/40 bg-staff-surface px-3 text-sm font-bold text-staff-danger transition-colors hover:bg-staff-danger/10 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
            onClick={handleRemove}
            disabled={disabled}
          >
            <Trash2 size={16} aria-hidden="true" />
            Remover foto
          </button>
        )}

        {removed && currentUrl && (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
            onClick={handleUndo}
            disabled={disabled}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Desfazer remoção
          </button>
        )}
      </div>
    </div>
  );
}
