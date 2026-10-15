import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimalPhoto } from '../../animals/components/AnimalPhoto';
import { useAnimal } from '../../animals/hooks/useAnimals';
import { CheckboxField } from '../../../shared/components/CheckboxField';
import { TextField } from '../../../shared/components/TextField';
import { adoptionService } from '../services/adoptionService';
import {
  formatCep,
  formatCpf,
  isAdult,
  isValidCpf,
  isValidEmail,
  onlyDigits,
} from '../utils/validators';
import './adoption.css';

interface FormValues {
  name: string;
  email: string;
  birthDate: string;
  cpf: string;
  isUfopaMember: boolean;
  hasPet: boolean;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  referencePoint: string;
  motivation: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  name: '',
  email: '',
  birthDate: '',
  cpf: '',
  isUfopaMember: false,
  hasPet: false,
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  referencePoint: '',
  motivation: '',
};

// Ordem em que os campos aparecem, usada para focar o primeiro com erro.
const FIELD_ORDER: (keyof FormValues)[] = [
  'name',
  'email',
  'birthDate',
  'cpf',
  'cep',
  'street',
  'number',
  'neighborhood',
  'motivation',
];

const MIN_MOTIVATION_LENGTH = 20;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.name.trim().length < 3) {
    errors.name = 'Informe seu nome completo.';
  }
  if (!isValidEmail(values.email)) {
    errors.email = 'Informe um e-mail válido.';
  }
  if (!values.birthDate) {
    errors.birthDate = 'Informe sua data de nascimento.';
  } else if (!isAdult(values.birthDate)) {
    errors.birthDate = 'É preciso ter 18 anos ou mais para adotar.';
  }
  if (!isValidCpf(values.cpf)) {
    errors.cpf = 'Informe um CPF válido.';
  }
  if (onlyDigits(values.cep).length !== 8) {
    errors.cep = 'Informe um CEP com 8 dígitos.';
  }
  if (values.street.trim() === '') {
    errors.street = 'Informe a rua.';
  }
  if (values.number.trim() === '') {
    errors.number = 'Informe o número.';
  }
  if (values.neighborhood.trim() === '') {
    errors.neighborhood = 'Informe o bairro.';
  }
  if (values.motivation.trim().length < MIN_MOTIVATION_LENGTH) {
    errors.motivation = `Conte um pouco mais (mínimo de ${MIN_MOTIVATION_LENGTH} caracteres).`;
  }

  return errors;
}

export function AdoptionIntentPage() {
  const { id } = useParams();
  const animalId = Number(id);
  const { animal, loading, failed } = useAnimal(animalId);

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!animal) return;

    const found = validate(values);
    setErrors(found);

    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      await adoptionService.submitIntent({
        animalId: animal.id,
        visitor: {
          name: values.name.trim(),
          email: values.email.trim(),
          birthDate: values.birthDate,
          cpf: onlyDigits(values.cpf),
          isUfopaMember: values.isUfopaMember,
          hasPet: values.hasPet,
        },
        address: {
          cep: onlyDigits(values.cep),
          street: values.street.trim(),
          number: values.number.trim(),
          neighborhood: values.neighborhood.trim(),
          referencePoint: values.referencePoint.trim(),
        },
        motivation: values.motivation.trim(),
      });
      setSent(true);
      window.scrollTo(0, 0);
    } catch {
      setSubmitError('Não foi possível enviar agora. Tente de novo em instantes.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="pub-container pub-page">
        <p className="pub-state">Carregando...</p>
      </div>
    );
  }

  if (failed || animal === null || animal.status !== 'disponivel') {
    return (
      <div className="pub-container pub-page">
        <p className="pub-state" role="alert">
          {failed
            ? 'Não foi possível carregar este animal agora.'
            : 'Este animal não está disponível para adoção.'}
        </p>
        <p className="pub-state">
          <Link to="/adocao" className="pub-btn pub-btn--secondary">
            Ver animais disponíveis
          </Link>
        </p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="pub-container pub-page">
        <section className="intent-success" aria-live="polite">
          <h1 className="pub-page__title">Interesse enviado!</h1>
          <p className="pub-page__lead">
            Recebemos o seu interesse em adotar <strong>{animal.name}</strong>. A
            equipe do Peludinhos vai analisar o pedido e entrar em contato pelo
            e-mail informado.
          </p>
          <div className="intent-success__actions">
            <Link to="/adocao" className="pub-btn pub-btn--primary">
              Ver outros peludinhos
            </Link>
            <Link to="/" className="pub-btn pub-btn--secondary">
              Voltar ao início
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pub-container pub-page">
      <Link to={`/adocao/${animal.id}`} className="pub-back">
        ← Voltar para {animal.name}
      </Link>

      <h1 className="pub-page__title">Intenção de adoção</h1>
      <p className="pub-page__lead">
        Preencha os dados abaixo. Este formulário é uma manifestação de
        interesse: a equipe avalia cada pedido antes de qualquer adoção.
      </p>

      <div className="intent-animal">
        <div className="intent-animal__photo">
          <AnimalPhoto animal={animal} />
        </div>
        <div>
          <p className="intent-animal__label">Você quer adotar</p>
          <p className="intent-animal__name">{animal.name}</p>
        </div>
      </div>

      <form className="intent-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="intent-section">
          <legend>Seus dados</legend>

          <TextField
            id="name"
            label="Nome completo"
            autoComplete="name"
            required
            value={values.name}
            error={errors.name}
            onChange={(value) => setField('name', value)}
          />
          <TextField
            id="email"
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={values.email}
            error={errors.email}
            onChange={(value) => setField('email', value)}
          />
          <div className="intent-row">
            <TextField
              id="birthDate"
              label="Data de nascimento"
              type="date"
              autoComplete="bday"
              required
              value={values.birthDate}
              error={errors.birthDate}
              onChange={(value) => setField('birthDate', value)}
            />
            <TextField
              id="cpf"
              label="CPF"
              inputMode="numeric"
              placeholder="000.000.000-00"
              required
              value={values.cpf}
              error={errors.cpf}
              onChange={(value) => setField('cpf', formatCpf(value))}
            />
          </div>
          <CheckboxField
            id="isUfopaMember"
            label="Faço parte da comunidade da Ufopa"
            checked={values.isUfopaMember}
            onChange={(checked) => setField('isUfopaMember', checked)}
          />
          <CheckboxField
            id="hasPet"
            label="Já tenho outro animal em casa"
            checked={values.hasPet}
            onChange={(checked) => setField('hasPet', checked)}
          />
        </fieldset>

        <fieldset className="intent-section">
          <legend>Onde o animal vai morar</legend>

          <div className="intent-row">
            <TextField
              id="cep"
              label="CEP"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              required
              value={values.cep}
              error={errors.cep}
              onChange={(value) => setField('cep', formatCep(value))}
            />
            <TextField
              id="neighborhood"
              label="Bairro"
              required
              value={values.neighborhood}
              error={errors.neighborhood}
              onChange={(value) => setField('neighborhood', value)}
            />
          </div>
          <div className="intent-row intent-row--street">
            <TextField
              id="street"
              label="Rua"
              autoComplete="address-line1"
              required
              value={values.street}
              error={errors.street}
              onChange={(value) => setField('street', value)}
            />
            <TextField
              id="number"
              label="Número"
              required
              value={values.number}
              error={errors.number}
              onChange={(value) => setField('number', value)}
            />
          </div>
          <TextField
            id="referencePoint"
            label="Ponto de referência"
            optional
            value={values.referencePoint}
            onChange={(value) => setField('referencePoint', value)}
          />
        </fieldset>

        <fieldset className="intent-section">
          <legend>Sobre a adoção</legend>

          <TextField
            id="motivation"
            label={`Por que você quer adotar ${animal.name}?`}
            multiline
            required
            hint="Conte sobre a sua rotina, sua casa e o que você espera dessa adoção."
            value={values.motivation}
            error={errors.motivation}
            onChange={(value) => setField('motivation', value)}
          />
        </fieldset>

        {submitError && (
          <p className="intent-form__error" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          className="pub-btn pub-btn--primary pub-btn--lg"
          disabled={submitting}
        >
          {submitting ? 'Enviando...' : 'Enviar interesse'}
        </button>
      </form>
    </div>
  );
}
