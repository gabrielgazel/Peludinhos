import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adoptionService } from '../../adoption/services/adoptionService';
import type { IntentStatus } from '../../adoption/types/adoption.types';
import { HttpError } from '../../../shared/api/httpsClient';
import { SelectField } from '../../../shared/components/SelectField';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { formatDateTime } from '../../../shared/utils/format';
import {
  INTENT_STATUS_LABEL,
  INTENT_STATUS_OPTIONS,
  INTENT_STATUS_TONE,
  type BadgeTone,
} from '../utils/badges';
import '../staff.css';

type StatusFilter = 'todas' | IntentStatus;

const FILTER_OPTIONS = [
  { value: 'todas', label: 'Todas as intenções' },
  ...INTENT_STATUS_OPTIONS,
];

function toneClass(tone: BadgeTone) {
  return `badge badge--${tone}`;
}

export function IntentsAdminPage() {
  const [status, setStatus] = useState<StatusFilter>('pendente');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

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

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-head__title">Intenções de adoção</h1>
          <p className="page-head__subtitle">
            Avalie os pedidos manifestados pelos visitantes.
          </p>
        </div>
      </header>

      {(error || actionError) && (
        <p className="alert alert--error" role="alert">
          {actionError ?? error}
        </p>
      )}

      <div className="panel">
        <div className="filter-bar">
          <div className="filter-bar__field">
            <SelectField
              id="intents-status"
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as StatusFilter)}
              options={FILTER_OPTIONS}
            />
          </div>
        </div>

        {loading ? (
          <p className="empty-state">Carregando intenções...</p>
        ) : intents.length === 0 ? (
          <p className="empty-state">Nenhuma intenção encontrada para este filtro.</p>
        ) : (
          <div className="stack">
            {intents.map((intent) => (
              <article key={intent.id} className="intent-card">
                <div className="intent-card__head">
                  <div>
                    <p className="intent-card__who">
                      {intent.visitor?.name ?? `Visitante #${intent.visitorId}`}
                    </p>
                    <p className="intent-card__meta">
                      {intent.visitor?.email ?? '—'}
                      {intent.visitor?.isUfopaMember ? ' · comunidade Ufopa' : ''}
                      {intent.visitor?.hasPet ? ' · já tem animal' : ''}
                    </p>
                  </div>
                  <span className={toneClass(INTENT_STATUS_TONE[intent.status])}>
                    {INTENT_STATUS_LABEL[intent.status]}
                  </span>
                </div>

                <p className="intent-card__meta">
                  Quer adotar{' '}
                  <Link to={`/adocao/${intent.animalId}`}>
                    <strong>{intent.animal?.name ?? `Animal #${intent.animalId}`}</strong>
                  </Link>{' '}
                  · pedido em {formatDateTime(intent.createdAt)}
                </p>

                <p className="intent-card__motivation">{intent.motivation}</p>

                {intent.status === 'pendente' && (
                  <div className="intent-card__actions">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      disabled={busyId === intent.id}
                      onClick={() => void handleReview(intent.id, 'aprovada')}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      disabled={busyId === intent.id}
                      onClick={() => void handleReview(intent.id, 'rejeitada')}
                    >
                      Rejeitar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
