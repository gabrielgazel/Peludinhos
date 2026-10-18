import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { CheckboxField } from '../../../shared/components/CheckboxField';
import { SelectField } from '../../../shared/components/SelectField';
import { TextField } from '../../../shared/components/TextField';
import { HttpError } from '../../../shared/api/httpsClient';
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

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      if (isEdit) {
        await animalService.update(animalId, payload);
      } else {
        await animalService.create(payload);
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

  return (
    <>
      <Link to="/painel/animais" className="btn btn--sm" style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </Link>

      <header className="page-head">
        <div>
          <h1 className="page-head__title">
            {isEdit ? 'Editar animal' : 'Novo animal'}
          </h1>
          <p className="page-head__subtitle">
            {isEdit
              ? 'Atualize as informações do peludinho.'
              : 'Cadastre um animal para a página de adoção.'}
          </p>
        </div>
      </header>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="empty-state">Carregando animal...</p>
      ) : (
        <form className="panel" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-grid--full">
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
            <div style={{ alignSelf: 'end' }}>
              <CheckboxField
                id="animal-neutered"
                label="Castrado"
                checked={values.isNeutered}
                onChange={(checked) => setField('isNeutered', checked)}
              />
            </div>

            <div className="form-grid--full">
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

          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <Link to="/painel/animais" className="btn">
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
