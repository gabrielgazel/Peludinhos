import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adoptionService } from '../../adoption/services/adoptionService';
import { adoptionRecordService } from '../../adoption/services/adoptionRecordService';
import type { AdoptionIntent, IntentStatus } from '../../adoption/types/adoption.types';
import { HttpError } from '../../../shared/api/httpsClient';
import { useAuth } from '../../auth/hooks/useAuth';
import { SelectField } from '../../../shared/components/SelectField';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { formatDateTime } from '../../../shared/utils/format';
import { buildAdoptionTerm } from '../utils/adoptionTerm';
import { AdoptionTermPanel } from '../components/AdoptionTermPanel';
import {
  INTENT_STATUS_LABEL,
  INTENT_STATUS_OPTIONS,
  INTENT_STATUS_TONE,
} from '../utils/badges';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';

type StatusFilter = 'todas' | IntentStatus;

const FILTER_OPTIONS = [
  { value: 'todas', label: 'Todas as intenções' },
  ...INTENT_STATUS_OPTIONS,
];

export function IntentsAdminPage() {
  const { user } = useAuth();
  const responsibleMemberId = user?.memberId ?? null;
  const [status, setStatus] = useState<StatusFilter>('pendente');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  /** ID da intenção com o termo aberto (somente leitura). */
  const [openTermId, setOpenTermId] = useState<number | null>(null);
  /** ID da intenção em confirmação de adoção. */
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const { data, loading, error, reload } = useAsyncData(
    () =>
      adoptionService.list({
        status: status === 'todas' ? undefined : status,
        limit: 200,
      }),
    [status],
  );
  const intents = data?.items ?? [];

  async function handleReview(id: number, decision: 'aprovada' | 'rejeitada') {
    setActionError(null);
    setBusyId(id);
    try {
      await adoptionService.review(id, decision);
      reload();
    } catch (err) {
      const message =
        err instanceof HttpError
          ? err.message
          : 'Não foi possível avaliar a intenção.';
      setActionError(message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRegister(intent: AdoptionIntent) {
    if (responsibleMemberId === null) return;
    setActionError(null);
    setBusyId(intent.id);
    const adoptionDate = new Date().toISOString().slice(0, 10);
    try {
      await adoptionRecordService.create({
        adoptionIntentId: intent.id,
        responsibleMemberId,
        adoptionDate,
        termText: buildAdoptionTerm(intent, responsibleMemberId, adoptionDate),
      });
      setConfirmingId(null);
      setOpenTermId(null);
      reload();
    } catch (err) {
      setActionError(
        err instanceof HttpError
          ? err.message
          : 'Não foi possível registrar a adoção.',
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Intenções de adoção"
        subtitle="Avalie os pedidos manifestados pelos visitantes."
      />

      {(error || actionError) && (
        <Alert variant="danger">{actionError ?? error}</Alert>
      )}

      <Panel>
        <div className="grid gap-4 sm:max-w-xs mb-4">
          <SelectField
            id="intents-status"
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as StatusFilter)}
            options={FILTER_OPTIONS}
          />
        </div>

        {loading ? (
          <EmptyState>Carregando intenções...</EmptyState>
        ) : intents.length === 0 ? (
          <EmptyState>Nenhuma intenção encontrada para este filtro.</EmptyState>
        ) : (
          <div className="space-y-3">
            {intents.map((intent) => (
              <article
                key={intent.id}
                className="space-y-3 rounded-xl border border-staff-line bg-staff-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-staff-ink">
                      {intent.visitor?.name ?? `Visitante #${intent.visitorId}`}
                    </p>
                    <p className="text-sm text-staff-muted">
                      {intent.visitor?.email ?? '—'}
                      {intent.visitor?.isUfopaMember ? ' · comunidade Ufopa' : ''}
                      {intent.visitor?.hasPet ? ' · já tem animal' : ''}
                    </p>
                  </div>
                  <StatusBadge tone={INTENT_STATUS_TONE[intent.status]}>
                    {INTENT_STATUS_LABEL[intent.status]}
                  </StatusBadge>
                </div>

                <p className="text-sm text-staff-muted">
                  Quer adotar{' '}
                  <Link
                    to={`/adocao/${intent.animalId}`}
                    className="text-staff-ink underline decoration-staff-line underline-offset-2 hover:decoration-staff-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent"
                  >
                    <strong>{intent.animal?.name ?? `Animal #${intent.animalId}`}</strong>
                  </Link>{' '}
                  · pedido em {formatDateTime(intent.createdAt)}
                </p>

                <p className="whitespace-pre-line text-staff-ink">{intent.motivation}</p>

                {intent.status === 'pendente' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                      disabled={busyId === intent.id}
                      onClick={() => void handleReview(intent.id, 'aprovada')}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center rounded-xl border border-staff-danger/40 px-4 text-sm font-bold text-staff-danger transition-colors hover:bg-staff-danger/10 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                      disabled={busyId === intent.id}
                      onClick={() => void handleReview(intent.id, 'rejeitada')}
                    >
                      Rejeitar
                    </button>
                  </div>
                )}

                {intent.status === 'aprovada' &&
                  (intent.adoption ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                        aria-expanded={openTermId === intent.id}
                        aria-controls={`termo-${intent.id}`}
                        onClick={() =>
                          setOpenTermId((current) => (current === intent.id ? null : intent.id))
                        }
                      >
                        Ver termo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {responsibleMemberId === null && (
                        <Alert variant="info">
                          É necessário vínculo com membro para registrar a adoção.
                        </Alert>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                          disabled={responsibleMemberId === null}
                          onClick={() => setConfirmingId(intent.id)}
                        >
                          Registrar adoção
                        </button>
                      </div>
                      {confirmingId === intent.id && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="inline-flex min-h-11 items-center rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                            disabled={busyId === intent.id}
                            onClick={() => void handleRegister(intent)}
                          >
                            Confirmar adoção
                          </button>
                          <button
                            type="button"
                            className="inline-flex min-h-11 items-center rounded-xl border border-staff-line px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                {intent.adoption && openTermId === intent.id && (
                  <AdoptionTermPanel
                    intent={intent}
                    adoptionDate={intent.adoption.adoptionDate}
                    responsibleMemberId={intent.adoption.responsibleMemberId}
                    termText={intent.adoption.termText}
                    onPrint={() => window.print()}
                  />
                )}
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
