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
    <div className="photo-field">
      <p className="tf__label" id="animal-photo-label">
        Foto do animal
      </p>

      <div className="photo-field__preview" aria-hidden={!hasPhoto}>
        {shownUrl ? (
          <img src={shownUrl} alt="Pré-visualização da foto do animal" />
        ) : (
          <span className="photo-field__empty">
            <ImagePlus size={30} aria-hidden="true" />
            Sem foto
          </span>
        )}
      </div>

      <p className="tf__hint">
        JPG, PNG, WEBP ou GIF, até 5 MB. A foto aparece no catálogo e nos
        detalhes do animal.
      </p>

      <div className="photo-field__actions">
        <label className="btn btn--sm photo-field__pick">
          {hasPhoto ? 'Trocar foto' : 'Escolher foto'}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            aria-labelledby="animal-photo-label"
            onChange={handleSelect}
            disabled={disabled}
          />
        </label>

        {hasPhoto && (
          <button
            type="button"
            className="btn btn--sm btn--danger"
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
            className="btn btn--sm"
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
