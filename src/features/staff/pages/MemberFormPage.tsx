import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { memberService } from '../services/memberService';
import {
  MEMBER_ROLES,
  ROLE_LABEL,
  type StaffRole,
} from '../../../shared/types/role.types';
import { SelectField } from '../../../shared/components/SelectField';
import { TextField } from '../../../shared/components/TextField';
import { HttpError } from '../../../shared/api/httpsClient';
import {
  formatCpf,
  isValidCpf,
  isValidEmail,
  onlyDigits,
} from '../../../shared/utils/validators';
import '../staff.css';

interface FormValues {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  cpf: string;
  birthDate: string;
  ufopaRegistration: string;
  projectEntryDate: string;
  feedingDays: string;
}

const INITIAL_VALUES: FormValues = {
  name: '',
  email: '',
  password: '',
  role: 'voluntario',
  cpf: '',
  birthDate: '',
  ufopaRegistration: '',
  projectEntryDate: '',
  feedingDays: '',
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const MIN_PASSWORD_LENGTH = 8;

const ROLE_OPTIONS = MEMBER_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABEL[role],
}));

function parseFeedingDays(value: string): string[] {
  return value
    .split(',')
    .map((day) => day.trim())
    .filter((day) => day.length > 0);
}

export function MemberFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const memberId = Number(id);
  const navigate = useNavigate();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loading = isEdit && loadedId !== memberId;

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    memberService
      .getById(memberId)
      .then((member) => {
        if (cancelled) return;
        setValues({
          name: member.name,
          email: member.email ?? '',
          password: '',
          role: member.role,
          cpf: member.cpf ? formatCpf(member.cpf) : '',
          birthDate: member.birthDate?.slice(0, 10) ?? '',
          ufopaRegistration: member.ufopaRegistration ?? '',
          projectEntryDate: member.projectEntryDate?.slice(0, 10) ?? '',
          feedingDays: (member.feedingDays ?? []).join(', '),
        });
        setLoadedId(memberId);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar o membro.');
          setLoadedId(memberId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, memberId]);

  function validate(): FormErrors {
    const found: FormErrors = {};

    if (values.name.trim().length < 3) {
      found.name = 'Informe o nome completo.';
    }
    if (!isEdit && !isValidEmail(values.email)) {
      found.email = 'Informe um e-mail válido.';
    }
    if (!isEdit && values.password.length < MIN_PASSWORD_LENGTH) {
      found.password = `Use ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (isEdit && values.password.length > 0 && values.password.length < MIN_PASSWORD_LENGTH) {
      found.password = `Use ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (values.cpf.trim() !== '' && !isValidCpf(values.cpf)) {
      found.cpf = 'Informe um CPF válido.';
    }
    return found;
  }

  function setFieldWrapper<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstInvalid = Object.keys(found)[0];
      document.getElementById(`member-${firstInvalid}`)?.focus();
      return;
    }

    const feedingDays = parseFeedingDays(values.feedingDays);
    setSaving(true);
    try {
      if (isEdit) {
        await memberService.update(memberId, {
          name: values.name.trim(),
          role: values.role,
          cpf: values.cpf.trim() ? onlyDigits(values.cpf) : null,
          birthDate: values.birthDate || null,
          ufopaRegistration: values.ufopaRegistration.trim() || null,
          projectEntryDate: values.projectEntryDate || null,
          feedingDays,
          ...(values.password ? { password: values.password } : {}),
        });
      } else {
        await memberService.create({
          email: values.email.trim(),
          password: values.password,
          name: values.name.trim(),
          role: values.role,
          cpf: values.cpf.trim() ? onlyDigits(values.cpf) : null,
          birthDate: values.birthDate || null,
          ufopaRegistration: values.ufopaRegistration.trim() || null,
          projectEntryDate: values.projectEntryDate || null,
          feedingDays: parseFeedingDays(values.feedingDays),
        });
      }
      navigate('/painel/membros');
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
      <Link to="/painel/membros" className="btn btn--sm" style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </Link>

      <header className="page-head">
        <div>
          <h1 className="page-head__title">
            {isEdit ? 'Editar membro' : 'Novo membro'}
          </h1>
          <p className="page-head__subtitle">
            {isEdit
              ? 'Atualize os dados ou o papel do membro.'
              : 'Cadastre um novo voluntário, bolsista ou coordenador.'}
          </p>
        </div>
      </header>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="empty-state">Carregando membro...</p>
      ) : (
        <form className="panel" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-grid--full">
              <TextField
                id="member-name"
                label="Nome completo"
                required
                value={values.name}
                error={errors.name}
                onChange={(value) => setFieldWrapper('name', value)}
              />
            </div>

            {!isEdit && (
              <TextField
                id="member-email"
                label="E-mail"
                type="email"
                autoComplete="email"
                required
                value={values.email}
                error={errors.email}
                onChange={(value) => setFieldWrapper('email', value)}
              />
            )}
            <SelectField
              id="member-role"
              label="Papel"
              value={values.role}
              onChange={(value) => setFieldWrapper('role', value as StaffRole)}
              options={ROLE_OPTIONS}
            />

            <TextField
              id="member-password"
              label={isEdit ? 'Nova senha' : 'Senha de acesso'}
              type="password"
              autoComplete="new-password"
              optional={isEdit}
              required={!isEdit}
              hint={
                isEdit
                  ? 'Deixe em branco para manter a senha atual.'
                  : `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres.`
              }
              value={values.password}
              error={errors.password}
              onChange={(value) => setFieldWrapper('password', value)}
            />
            <TextField
              id="member-cpf"
              label="CPF"
              optional
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={values.cpf}
              error={errors.cpf}
              onChange={(value) => setFieldWrapper('cpf', formatCpf(value))}
            />

            <TextField
              id="member-birthDate"
              label="Data de nascimento"
              optional
              type="date"
              value={values.birthDate}
              onChange={(value) => setFieldWrapper('birthDate', value)}
            />
            <TextField
              id="member-ufopaRegistration"
              label="Matrícula Ufopa"
              optional
              value={values.ufopaRegistration}
              onChange={(value) => setFieldWrapper('ufopaRegistration', value)}
            />

            <TextField
              id="member-projectEntryDate"
              label="Entrada no projeto"
              optional
              type="date"
              value={values.projectEntryDate}
              onChange={(value) => setFieldWrapper('projectEntryDate', value)}
            />
            <TextField
              id="member-feedingDays"
              label="Dias de alimentação"
              optional
              hint="Separe por vírgula. Ex.: segunda, quarta, sexta"
              value={values.feedingDays}
              onChange={(value) => setFieldWrapper('feedingDays', value)}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <Link to="/painel/membros" className="btn">
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
