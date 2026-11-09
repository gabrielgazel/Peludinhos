import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { animalService } from '../../animals/services/animalService';
import {
  BEHAVIOR_OPTIONS,
  STATUS_OPTIONS,
} from '../../animals/constants/animal.labels';
import type {
  AnimalBehavior,
  AnimalPayload,
  AnimalSex,
  AnimalStatus,
} from '../../animals/types/animal.types';
import {
  AnimalPhotoInput,
  type PhotoChange,
} from '../components/AnimalPhotoInput';
import { CheckboxField } from '../../../shared/components/CheckboxField';
import { SelectField } from '../../../shared/components/SelectField';
import { TextField } from '../../../shared/components/TextField';
import { HttpError } from '../../../shared/api/httpsClient';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import '../staff.css';

interface FormValues {
  name: string;
  sex: AnimalSex;
  status: AnimalStatus;
  behavior: '' | AnimalBehavior;
  age: string;
  colorDescription: string;
  isNeutered: boolean;
  notes: string;
}

const INITIAL_VALUES: FormValues = {
  name: '',
  sex: 'F',
  status: 'disponivel',
  behavior: '',
  age: '',
  colorDescription: '',
  isNeutered: false,
  notes: '',
};

const SEX_OPTIONS = [
  { value: 'F', label: 'Fêmea' },
  { value: 'M', label: 'Macho' },
];

export function AnimalFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const animalId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [photoChange, setPhotoChange] = useState<PhotoChange>({
    file: null,
    remove: false,
  });
  const [error, setError] = useState<string | null>(
    () => (location.state as { photoError?: string } | null)?.photoError ?? null,
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loading = isEdit && loadedId !== animalId;

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    animalService
      .getById(animalId)
      .then((animal) => {
        if (cancelled) return;
        setValues({
          name: animal.name,
          sex: animal.sex,
          status: animal.status,
          behavior: animal.behavior ?? '',
          age: animal.age ?? '',
          colorDescription: animal.colorDescription ?? '',
          isNeutered: animal.isNeutered,
          notes: animal.notes ?? '',
        });
        setCurrentPhotoUrl(animal.photoUrl);
        setLoadedId(animalId);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar o animal.');
          setLoadedId(animalId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, animalId]);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (values.name.trim().length === 0) {
      setNameError('Informe o nome do animal.');
      document.getElementById('animal-name')?.focus();
      return;
    }
    setNameError(null);

    const payload: AnimalPayload = {
      name: values.name.trim(),
      sex: values.sex,
      status: values.status,
      behavior: values.behavior || null,
      age: values.age.trim() || null,
      color_description: values.colorDescription.trim() || null,
      is_neutered: values.isNeutered,
      notes: values.notes.trim() || null,
    };

    setSaving(true);
    try {
      let targetId = animalId;
      if (isEdit) {
        await animalService.update(animalId, payload);
      } else {
        const created = await animalService.create(payload);
        targetId = created.id;
      }

      const photoError = await savePhoto(targetId);
      if (photoError) {
        if (isEdit) {
          setError(photoError);
          return;
        }
        // O animal já foi criado; leva para a edição para tentar a foto de novo.
        navigate(`/painel/animais/${targetId}/editar`, {
          replace: true,
          state: {
            photoError: `Animal cadastrado, mas a foto não foi enviada: ${photoError}`,
          },
        });
        return;
      }

      navigate('/painel/animais');
    } catch (err) {
      setError(
        err instanceof HttpError
          ? err.message
          : 'Não foi possível salvar. Tente de novo em instantes.',
      );
    } finally {
      setSaving(false);
    }
  }

  /** Envia/remove a foto conforme a escolha; devolve a mensagem de erro, se houver. */
  async function savePhoto(targetId: number): Promise<string | null> {
    if (!photoChange.file && !photoChange.remove) return null;
    try {
      if (photoChange.file) {
        await animalService.uploadPhoto(targetId, photoChange.file);
      } else {
        await animalService.removePhoto(targetId);
      }
      return null;
    } catch (err) {
      return err instanceof HttpError
        ? err.message
        : 'Não foi possível enviar a foto. Tente novamente.';
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link
          to="/painel/animais"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar
        </Link>
      </div>

      <PageHead
        title={isEdit ? 'Editar animal' : 'Novo animal'}
        subtitle={
          isEdit
            ? 'Atualize as informações do peludinho.'
            : 'Cadastre um animal para a página de adoção.'
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <EmptyState>Carregando animal...</EmptyState>
      ) : (
        <Panel>
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <AnimalPhotoInput
                  currentUrl={currentPhotoUrl}
                  onChange={setPhotoChange}
                  disabled={saving}
                />
              </div>

              <div className="sm:col-span-2">
                <TextField
                  id="animal-name"
                  label="Nome"
                  required
                  value={values.name}
                  error={nameError ?? undefined}
                  onChange={(value) => setField('name', value)}
                />
              </div>

              <SelectField
                id="animal-sex"
                label="Sexo"
                value={values.sex}
                onChange={(value) => setField('sex', value as AnimalSex)}
                options={SEX_OPTIONS}
              />
              <SelectField
                id="animal-status"
                label="Status"
                value={values.status}
                onChange={(value) => setField('status', value as AnimalStatus)}
                options={STATUS_OPTIONS}
              />

              <SelectField
                id="animal-behavior"
                label="Comportamento"
                optional
                placeholder="Não informado"
                value={values.behavior}
                onChange={(value) => setField('behavior', value as '' | AnimalBehavior)}
                options={BEHAVIOR_OPTIONS}
              />
              <TextField
                id="animal-age"
                label="Idade aproximada"
                optional
                placeholder="ex.: 2 anos"
                value={values.age}
                onChange={(value) => setField('age', value)}
              />

              <TextField
                id="animal-color"
                label="Cor / pelagem"
                optional
                value={values.colorDescription}
                onChange={(value) => setField('colorDescription', value)}
              />
              <div className="self-end">
                <CheckboxField
                  id="animal-neutered"
                  label="Castrado"
                  checked={values.isNeutered}
                  onChange={(checked) => setField('isNeutered', checked)}
                />
              </div>

              <div className="sm:col-span-2">
                <TextField
                  id="animal-notes"
                  label="Observações"
                  optional
                  multiline
                  hint="Temperamento, saúde, história do animal..."
                  value={values.notes}
                  onChange={(value) => setField('notes', value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-staff-line pt-4">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <Link
                to="/painel/animais"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </Panel>
      )}
    </div>
  );
}
