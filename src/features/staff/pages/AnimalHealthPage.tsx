import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAnimal } from '../../animals/hooks/useAnimals';
import { isAdmin } from '../../../shared/types/role.types';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { formatDate } from '../../../shared/utils/format';
import { BEHAVIOR_LABEL, SEX_LABEL } from '../../animals/constants/animal.labels';
import { ANIMAL_STATUS_LABEL } from '../utils/badges';
import {
  veterinaryHistoryService,
  type VeterinaryHistory,
} from '../../animals/services/veterinaryHistoryService';
import {
  vaccinationService,
  type Vaccination,
} from '../../animals/services/vaccinationService';
import {
  prescriptionService,
  type Prescription,
} from '../../animals/services/prescriptionService';
import {
  ClinicalRecordsSection,
  type ClinicalColumn,
  type ClinicalRecord,
} from '../../animals/components/ClinicalRecordsSection';
import {
  ClinicalRecordForm,
  type FormField,
} from '../../animals/components/ClinicalRecordForm';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';

type RecordKind = 'history' | 'vaccination' | 'prescription';

interface FormState {
  kind: RecordKind;
  id?: number;
  values: Record<string, string>;
  original: Record<string, string>;
}

const HISTORY_FIELDS: FormField[] = [
  { name: 'title', label: 'Título', kind: 'text', required: true, maxLength: 120 },
  { name: 'recordDate', label: 'Data do registro', kind: 'date', required: true },
  { name: 'description', label: 'Descrição', kind: 'textarea', required: true },
];

const VACCINATION_FIELDS: FormField[] = [
  { name: 'vaccine', label: 'Vacina', kind: 'text', required: true, maxLength: 120 },
  { name: 'applicationDate', label: 'Data de aplicação', kind: 'date', required: true },
  { name: 'dose', label: 'Dose', kind: 'text', optional: true, maxLength: 40 },
  { name: 'notes', label: 'Observação', kind: 'textarea', optional: true },
];

const PRESCRIPTION_FIELDS: FormField[] = [
  { name: 'medication', label: 'Medicamento', kind: 'text', required: true, maxLength: 120 },
  { name: 'dosage', label: 'Posologia', kind: 'textarea', required: true, maxLength: 240 },
  { name: 'prescriptionDate', label: 'Data da receita', kind: 'date', required: true },
  { name: 'notes', label: 'Observação', kind: 'textarea', optional: true },
];

const FIELDS: Record<RecordKind, FormField[]> = {
  history: HISTORY_FIELDS,
  vaccination: VACCINATION_FIELDS,
  prescription: PRESCRIPTION_FIELDS,
};

const OPTIONAL_KEYS: Record<RecordKind, string[]> = {
  history: [],
  vaccination: ['dose', 'notes'],
  prescription: ['notes'],
};

const HISTORY_COLUMNS: ClinicalColumn<VeterinaryHistory>[] = [
  { header: 'Data', render: (item) => formatDate(item.recordDate) },
  { header: 'Título', render: (item) => item.title },
  { header: 'Descrição', render: (item) => item.description },
];

const VACCINATION_COLUMNS: ClinicalColumn<Vaccination>[] = [
  { header: 'Data', render: (item) => formatDate(item.applicationDate) },
  { header: 'Vacina', render: (item) => item.vaccine },
  { header: 'Dose', render: (item) => item.dose ?? '—' },
];

const PRESCRIPTION_COLUMNS: ClinicalColumn<Prescription>[] = [
  { header: 'Data', render: (item) => formatDate(item.prescriptionDate) },
  { header: 'Medicamento', render: (item) => item.medication },
  { header: 'Posologia', render: (item) => item.dosage },
];

const BACK_LINK_CLASS =
  'inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none';

function tabClass(active: boolean): string {
  return [
    'inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none',
    active
      ? 'border-staff-ink bg-staff-ink text-staff-surface'
      : 'border-staff-line bg-staff-surface text-staff-ink hover:bg-staff-bg',
  ].join(' ');
}

function clean(value: string | undefined): string {
  return (value ?? '').trim();
}

function optionalOrNull(value: string | undefined): string | null {
  const result = clean(value);
  return result === '' ? null : result;
}

function emptyValues(fields: FormField[]): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field.name, '']));
}

function valuesFrom(source: Record<string, string | null>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value ?? '']),
  );
}

/** Só envia as chaves alteradas; opcionais vazios viram null (camelCase). */
function changedValues(
  values: Record<string, string>,
  original: Record<string, string>,
  optionalKeys: string[],
): Record<string, string | null> {
  const payload: Record<string, string | null> = {};
  for (const key of Object.keys(values)) {
    const next = clean(values[key]);
    if (next === clean(original[key])) continue;
    payload[key] = optionalKeys.includes(key) && next === '' ? null : next;
  }
  return payload;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-staff-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-staff-ink">{value}</dd>
    </div>
  );
}

export function AnimalHealthPage() {
  const { id } = useParams();
  const animalId = Number(id);
  const { user } = useAuth();
  const { animal, loading, failed } = useAnimal(animalId);

  const [tab, setTab] = useState<'dados' | 'saude'>('dados');
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const history = useAsyncData(
    () => veterinaryHistoryService.list(animalId, { limit: 200 }),
    [animalId],
  );
  const vaccines = useAsyncData(
    () => vaccinationService.list(animalId, { limit: 200 }),
    [animalId],
  );
  const prescriptions = useAsyncData(
    () => prescriptionService.list(animalId, { limit: 200 }),
    [animalId],
  );

  const memberId = user?.memberId ?? null;
  const canCreate = memberId !== null;
  const canEdit = (item: ClinicalRecord): boolean =>
    isAdmin(user?.role) || (memberId !== null && item.createdByMemberId === memberId);

  function openNew(kind: RecordKind) {
    const values = emptyValues(FIELDS[kind]);
    setFormError(null);
    setForm({ kind, values, original: { ...values } });
  }

  function openEdit(kind: RecordKind, itemId: number, source: Record<string, string | null>) {
    const values = valuesFrom(source);
    setFormError(null);
    setForm({ kind, id: itemId, values, original: { ...values } });
  }

  function authorMemberId(): number | null {
    if (memberId === null) {
      setFormError('É necessário vínculo com membro para registrar dados clínicos.');
    }
    return memberId;
  }

  async function handleSubmit(values: Record<string, string>) {
    if (!form) return;

    if (FIELDS[form.kind].some((field) => field.required && clean(values[field.name]) === '')) {
      setFormError('Preencha os campos obrigatórios.');
      return;
    }
    setFormError(null);

    try {
      if (form.kind === 'history') {
        if (form.id !== undefined) {
          await veterinaryHistoryService.update(
            form.id,
            changedValues(values, form.original, OPTIONAL_KEYS.history),
          );
          history.reload();
        } else {
          const author = authorMemberId();
          if (author === null) return;
          await veterinaryHistoryService.create(animalId, {
            title: clean(values.title),
            recordDate: clean(values.recordDate),
            description: clean(values.description),
            createdByMemberId: author,
          });
          history.reload();
        }
      } else if (form.kind === 'vaccination') {
        if (form.id !== undefined) {
          await vaccinationService.update(
            form.id,
            changedValues(values, form.original, OPTIONAL_KEYS.vaccination),
          );
          vaccines.reload();
        } else {
          const author = authorMemberId();
          if (author === null) return;
          await vaccinationService.create(animalId, {
            vaccine: clean(values.vaccine),
            applicationDate: clean(values.applicationDate),
            dose: optionalOrNull(values.dose),
            notes: optionalOrNull(values.notes),
            createdByMemberId: author,
          });
          vaccines.reload();
        }
      } else {
        if (form.id !== undefined) {
          await prescriptionService.update(
            form.id,
            changedValues(values, form.original, OPTIONAL_KEYS.prescription),
          );
          prescriptions.reload();
        } else {
          const author = authorMemberId();
          if (author === null) return;
          await prescriptionService.create(animalId, {
            medication: clean(values.medication),
            dosage: clean(values.dosage),
            prescriptionDate: clean(values.prescriptionDate),
            notes: optionalOrNull(values.notes),
            createdByMemberId: author,
          });
          prescriptions.reload();
        }
      }
      setForm(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title={`Ficha de ${animal?.name ?? 'animal'}`}
        actions={
          <Link to="/painel/animais" className={BACK_LINK_CLASS}>
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para animais
          </Link>
        }
      />

      {failed ? (
        <Alert variant="danger">Não foi possível carregar o animal.</Alert>
      ) : null}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Seções da ficha">
        <button
          type="button"
          aria-pressed={tab === 'dados'}
          onClick={() => setTab('dados')}
          className={tabClass(tab === 'dados')}
        >
          Dados
        </button>
        <button
          type="button"
          aria-pressed={tab === 'saude'}
          onClick={() => setTab('saude')}
          className={tabClass(tab === 'saude')}
        >
          Saúde
        </button>
      </div>

      {tab === 'dados' ? (
        loading ? (
          <EmptyState>Carregando animal...</EmptyState>
        ) : (
          <Panel>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Nome" value={animal?.name ?? '—'} />
              <DetailItem label="Sexo" value={animal ? SEX_LABEL[animal.sex] : '—'} />
              <DetailItem
                label="Status"
                value={animal ? ANIMAL_STATUS_LABEL[animal.status] : '—'}
              />
              <DetailItem label="Idade" value={animal?.age ?? '—'} />
              <DetailItem
                label="Comportamento"
                value={animal?.behavior ? BEHAVIOR_LABEL[animal.behavior] : '—'}
              />
            </dl>
          </Panel>
        )
      ) : (
        <div className="space-y-6">
          {!canCreate ? (
            <Alert>É necessário vínculo com membro para registrar dados clínicos.</Alert>
          ) : null}

          {form?.kind === 'history' ? (
            <ClinicalRecordForm
              title={form.id !== undefined ? 'Editar registro' : 'Novo registro'}
              fields={HISTORY_FIELDS}
              initialValues={form.values}
              submitLabel="Salvar registro"
              error={formError}
              onCancel={() => setForm(null)}
              onSubmit={(values) => void handleSubmit(values)}
            />
          ) : null}
          <ClinicalRecordsSection<VeterinaryHistory>
            id="health-history"
            title="Histórico veterinário"
            columns={HISTORY_COLUMNS}
            items={history.data?.items ?? []}
            loading={history.loading}
            error={history.error}
            canCreate={canCreate}
            createLabel="Novo registro"
            emptyMessage="Nenhum registro clínico ainda."
            onNew={() => openNew('history')}
            canEdit={canEdit}
            onEdit={(item) =>
              openEdit('history', item.id, {
                title: item.title,
                recordDate: item.recordDate,
                description: item.description,
              })
            }
          />

          {form?.kind === 'vaccination' ? (
            <ClinicalRecordForm
              title={form.id !== undefined ? 'Editar vacina' : 'Nova vacina'}
              fields={VACCINATION_FIELDS}
              initialValues={form.values}
              submitLabel="Salvar vacina"
              error={formError}
              onCancel={() => setForm(null)}
              onSubmit={(values) => void handleSubmit(values)}
            />
          ) : null}
          <ClinicalRecordsSection<Vaccination>
            id="health-vaccines"
            title="Vacinação"
            columns={VACCINATION_COLUMNS}
            items={vaccines.data?.items ?? []}
            loading={vaccines.loading}
            error={vaccines.error}
            canCreate={canCreate}
            createLabel="Nova vacina"
            emptyMessage="Nenhuma vacina registrada."
            onNew={() => openNew('vaccination')}
            canEdit={canEdit}
            onEdit={(item) =>
              openEdit('vaccination', item.id, {
                vaccine: item.vaccine,
                applicationDate: item.applicationDate,
                dose: item.dose,
                notes: item.notes,
              })
            }
          />

          {form?.kind === 'prescription' ? (
            <ClinicalRecordForm
              title={form.id !== undefined ? 'Editar receita' : 'Nova receita'}
              fields={PRESCRIPTION_FIELDS}
              initialValues={form.values}
              submitLabel="Salvar receita"
              error={formError}
              onCancel={() => setForm(null)}
              onSubmit={(values) => void handleSubmit(values)}
            />
          ) : null}
          <ClinicalRecordsSection<Prescription>
            id="health-prescriptions"
            title="Receitas"
            columns={PRESCRIPTION_COLUMNS}
            items={prescriptions.data?.items ?? []}
            loading={prescriptions.loading}
            error={prescriptions.error}
            canCreate={canCreate}
            createLabel="Nova receita"
            emptyMessage="Nenhuma receita registrada."
            onNew={() => openNew('prescription')}
            canEdit={canEdit}
            onEdit={(item) =>
              openEdit('prescription', item.id, {
                medication: item.medication,
                dosage: item.dosage,
                prescriptionDate: item.prescriptionDate,
                notes: item.notes,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
