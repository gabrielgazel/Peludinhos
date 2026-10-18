import { useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AnimalPhoto } from '../../animals/components/AnimalPhoto';
import { useAnimal } from '../../animals/hooks/useAnimals';
import { CheckboxField } from '../../../shared/components/CheckboxField';
import { TextField } from '../../../shared/components/TextField';
import { HttpError } from '../../../shared/api/httpsClient';
import { useAuth } from '../../auth/hooks/useAuth';
import { adoptionService } from '../services/adoptionService';
import {
  formatCep,
  formatCpf,
  isAdult,
  isValidCpf,
  isValidEmail,
  onlyDigits,
} from '../../../shared/utils/validators';
import './adoption.css';

interface FormValues {
  name: string;
  email: string;
  birthDate: string;
  cpf: string;
  password: string;
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
  password: '',
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
  'password',
  'birthDate',
  'cpf',
  'cep',
  'street',
  'number',
  'neighborhood',
  'motivation',
];

const MIN_MOTIVATION_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 8;

function validate(values: FormValues, needsRegistration: boolean): FormErrors {
  const errors: FormErrors = {};

  if (needsRegistration) {
    if (values.name.trim().length < 3) {
      errors.name = 'Informe seu nome completo.';
    }
    if (!isValidEmail(values.email)) {
      errors.email = 'Informe um e-mail válido.';
    }
    if (values.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Use ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
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
  const { user, isAuthenticated, register } = useAuth();
  const location = useLocation();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Visitante já logado não precisa repassar os dados pessoais/endereço.
  const isVisitor = isAuthenticated && user?.role === 'visitante';
  const needsRegistration = !isVisitor;

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!animal) return;

    const found = validate(values, needsRegistration);
    setErrors(found);

    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    let didRegister = false;
    try {
      if (needsRegistration) {
        await register({
          email: values.email.trim(),
          password: values.password,
          name: values.name.trim(),
          birthDate: values.birthDate,
          cpf: onlyDigits(values.cpf),
          isUfopaMember: values.isUfopaMember,
          hasPet: values.hasPet,
          address: {
            cep: onlyDigits(values.cep),
            street: values.street.trim(),
            number: values.number.trim(),
            neighborhood: values.neighborhood.trim(),
            referencePoint: values.referencePoint.trim(),
          },
        });
        didRegister = true;
      }

      await adoptionService.submitIntent({
        animalId: animal.id,
        motivation: values.motivation.trim(),
      });
      setSent(true);
      window.scrollTo(0, 0);
    } catch (err) {
      if (err instanceof HttpError && err.status === 409 && didRegister) {
        setSubmitError(
          'Sua conta foi criada, mas você já tem um pedido pendente para este animal.',
        );
      } else if (err instanceof HttpError && err.status === 409 && needsRegistration) {
        setSubmitError(
          'Já existe uma conta com este e-mail. Entre para continuar o pedido.',
        );
      } else if (err instanceof HttpError && err.status === 409) {
        setSubmitError(err.message || 'Você já tem um pedido pendente para este animal.');
      } else if (err instanceof HttpError && err.status === 404) {
        setSubmitError('Este animal não está mais disponível para adoção.');
      } else if (err instanceof HttpError && err.status === 422) {
        setSubmitError(err.message || 'Confira os dados informados.');
      } else {
        setSubmitError('Não foi possível enviar agora. Tente de novo em instantes.');
      }
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

  if (failed || animal === null || animal.status !== 'disponivel' || animal.isDeceased) {
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

  // Membros da equipe não manifestam intenção (a API só aceita visitantes).
  if (isAuthenticated && !isVisitor) {
    return (
      <div className="pub-container pub-page">
        <p className="pub-state" role="alert">
          A manifestação de interesse é feita pelo próprio adotante (conta de
          visitante). Como membro da equipe, use o painel para acompanhar os
          pedidos.
        </p>
        <p className="pub-state">
          <Link to="/painel" className="pub-btn pub-btn--primary">
            Ir para o painel
          </Link>
        </p>
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

      {isVisitor && (
        <p className="intent-form__note">
          Você está logado como <strong>{user?.name}</strong>. Vamos usar os
          dados da sua conta para registrar o pedido.
        </p>
      )}

      <form className="intent-form" onSubmit={handleSubmit} noValidate>
        {needsRegistration && (
          <>
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
                autoComplete="email"
                required
                value={values.email}
                error={errors.email}
                onChange={(value) => setField('email', value)}
              />
              <TextField
                id="password"
                label="Crie uma senha de acesso"
                type="password"
                autoComplete="new-password"
                required
                hint={`Você usará esta senha para acompanhar seus pedidos. Mínimo de ${MIN_PASSWORD_LENGTH} caracteres.`}
                value={values.password}
                error={errors.password}
                onChange={(value) => setField('password', value)}
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

              <p className="intent-form__note">
                Já tem uma conta?{' '}
                <Link to="/login" state={{ from: location }}>
                  Entre para enviar seu pedido
                </Link>
                .
              </p>
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
          </>
        )}

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
