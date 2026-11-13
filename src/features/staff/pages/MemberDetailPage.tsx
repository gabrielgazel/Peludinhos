import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { memberService, type Member } from '../services/memberService';
import { ROLE_LABEL } from '../../../shared/types/role.types';
import { HttpError } from '../../../shared/api/httpsClient';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { formatDate } from '../../../shared/utils/format';
import { formatCpf } from '../../../shared/utils/validators';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <dt className="text-sm text-staff-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-staff-ink">{value}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <div className="mb-4">
      <Link
        to="/painel/membros"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </Link>
    </div>
  );
}

export function MemberDetailPage() {
  const { id } = useParams();
  const memberId = Number(id);

  const { data: member, loading, error } = useAsyncData<Member | null>(
    () => {
      if (!Number.isInteger(memberId) || memberId <= 0) return Promise.resolve(null);
      return memberService.getById(memberId).catch((err: unknown) => {
        if (err instanceof HttpError && err.status === 404) return null;
        throw err;
      });
    },
    [memberId],
  );

  return (
    <div className="space-y-6">
      <BackLink />

      {loading ? (
        <EmptyState>Carregando membro...</EmptyState>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : member === null ? (
        <Panel>
          <EmptyState>Não encontramos este membro.</EmptyState>
        </Panel>
      ) : (
        <>
          <PageHead
            title={member.name}
            actions={
              <>
                <span className="inline-flex w-fit items-center rounded-full border border-staff-line bg-staff-bg px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-staff-muted">
                  {ROLE_LABEL[member.role]}
                </span>
                <Link
                  to={`/painel/membros/${member.id}/editar`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                >
                  Editar
                </Link>
              </>
            }
          />

          <Panel>
            <div className="grid gap-6 md:grid-cols-2">
              <section aria-labelledby="member-personal-data">
                <h2
                  id="member-personal-data"
                  className="font-body text-lg font-semibold text-staff-ink"
                >
                  Dados pessoais
                </h2>
                <dl className="mt-3 grid gap-3 text-sm">
                  <DetailItem label="E-mail" value={member.email ?? '—'} />
                  <DetailItem
                    label="CPF"
                    value={member.cpf ? formatCpf(member.cpf) : '—'}
                  />
                  <DetailItem
                    label="Data de nascimento"
                    value={formatDate(member.birthDate)}
                  />
                </dl>
              </section>

              <section aria-labelledby="member-affiliation">
                <h2
                  id="member-affiliation"
                  className="font-body text-lg font-semibold text-staff-ink"
                >
                  Vínculo
                </h2>
                <dl className="mt-3 grid gap-3 text-sm">
                  <DetailItem label="Papel" value={ROLE_LABEL[member.role]} />
                  <DetailItem
                    label="Matrícula Ufopa"
                    value={member.ufopaRegistration ?? '—'}
                  />
                  <DetailItem
                    label="Entrada no projeto"
                    value={formatDate(member.projectEntryDate)}
                  />
                  <DetailItem
                    label="Dias de alimentação"
                    value={
                      member.feedingDays.length > 0
                        ? member.feedingDays.join(', ')
                        : '—'
                    }
                  />
                </dl>
              </section>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
