import { useState, type FormEvent } from 'react';
import { Clock, History, MapPin } from 'lucide-react';
import { HttpError } from '../../../shared/api/httpsClient';
import { CheckboxField } from '../../../shared/components/CheckboxField';
import { SelectField } from '../../../shared/components/SelectField';
import { TextField } from '../../../shared/components/TextField';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { formatDateTime } from '../../../shared/utils/format';
import { formatDuration } from '../utils/formatShift';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { feedingPointService } from '../services/feedingPointService';
import {
  shiftService,
  type Shift,
  type ShiftFeedingPoint,
} from '../services/shiftService';

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Intervalo do filtro de histórico: últimos N dias, incluindo hoje. */
function rangeForPeriod(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

function pointsLabel(points: ShiftFeedingPoint[]): string {
  if (points.length === 0) return 'Nenhum ponto informado';
  return points.map((point) => point.name).join(', ');
}

export function ShiftPage() {
  const [period, setPeriod] = useState('7');

  const [currentRetry, setCurrentRetry] = useState(0);
  // Resultado local de abrir/encerrar: evita outra ida à API e é descartado
  // assim que uma nova busca começa (currentRetry muda).
  const [localCurrent, setLocalCurrent] = useState<{
    retry: number;
    value: Shift | null;
  } | null>(null);
  const {
    data: fetchedCurrent,
    loading: currentLoading,
    error: currentError,
  } = useAsyncData(() => shiftService.current(), [currentRetry]);
  const current = localCurrent?.retry === currentRetry ? localCurrent.value : fetchedCurrent;

  const [selectedPointIds, setSelectedPointIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const range = rangeForPeriod(Number(period));
  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
    reload: reloadHistory,
  } = useAsyncData(
    () => shiftService.list({ from: range.from, to: range.to, limit: 200 }),
    [period],
  );
  const history = historyData?.items ?? [];

  const {
    data: pointsData,
    loading: pointsLoading,
    error: pointsError,
    reload: reloadPoints,
  } = useAsyncData(() => feedingPointService.list({ limit: 200 }), []);
  const points = pointsData?.items ?? [];

  function togglePoint(pointId: number, checked: boolean) {
    setSelectedPointIds((currentIds) => {
      if (checked) {
        return currentIds.includes(pointId) ? currentIds : [...currentIds, pointId];
      }
      return currentIds.filter((id) => id !== pointId);
    });
  }

  async function handleOpen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (opening || closing) return;

    setActionError(null);
    setOpening(true);
    try {
      const opened = await shiftService.open({
        feedingPointIds: selectedPointIds,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      setLocalCurrent({ retry: currentRetry, value: opened });
      setSelectedPointIds([]);
      setNotes('');
      reloadHistory();
    } catch (err) {
      setActionError(
        err instanceof HttpError ? err.message : 'Não foi possível iniciar o turno.',
      );
      if (err instanceof HttpError && err.status === 409) {
        // A API indica que já existe turno aberto; recarrega para refletir a realidade.
        setCurrentRetry((value) => value + 1);
      }
    } finally {
      setOpening(false);
    }
  }

  function requestClose() {
    if (closing) return;
    setActionError(null);
    setConfirmingClose(true);
  }

  function cancelClose() {
    if (closing) return;
    setConfirmingClose(false);
  }

  async function handleClose() {
    if (!current || closing) return;

    setActionError(null);
    setClosing(true);
    try {
      await shiftService.close(current.id);
      setLocalCurrent({ retry: currentRetry, value: null });
      setConfirmingClose(false);
      reloadHistory();
    } catch (err) {
      setActionError(
        err instanceof HttpError ? err.message : 'Não foi possível encerrar o turno.',
      );
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        title="Turnos"
        subtitle="Abra e encerre seu turno de cuidado e acompanhe o histórico."
      />

      <section aria-labelledby="shift-current-title">
        <Panel>
          <div className="mb-4 flex items-center gap-2 text-staff-ink">
            <Clock size={18} aria-hidden="true" />
            <h2 id="shift-current-title" className="text-lg font-semibold">
              Turno atual
            </h2>
          </div>

          {actionError && <Alert variant="danger">{actionError}</Alert>}

          {currentLoading ? (
            <EmptyState>Carregando turno...</EmptyState>
          ) : currentError ? (
            <div className="mt-4 space-y-3">
              <Alert variant="danger">{currentError}</Alert>
              <button
                type="button"
                onClick={() => setCurrentRetry((value) => value + 1)}
                className="inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
              >
                Tentar novamente
              </button>
            </div>
          ) : current ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone="green">Em andamento</StatusBadge>
                <p className="text-sm text-staff-muted">
                  Iniciado em {formatDateTime(current.startedAt)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-staff-ink">Pontos de alimentação</h3>
                <p className="mt-1 text-staff-ink">{pointsLabel(current.feedingPoints)}</p>
              </div>

              {current.notes && (
                <p className="whitespace-pre-line text-sm text-staff-muted">{current.notes}</p>
              )}

              {confirmingClose ? (
                <div className="space-y-3 rounded-xl border border-staff-line bg-staff-bg p-4">
                  <p className="font-semibold text-staff-ink">Encerrar o turno agora?</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleClose()}
                      disabled={closing}
                      className="inline-flex min-h-11 items-center rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                    >
                      {closing ? 'Encerrando...' : 'Confirmar encerramento'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelClose}
                      disabled={closing}
                      className="inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={requestClose}
                  className="inline-flex min-h-11 items-center rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                >
                  Encerrar turno
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleOpen} className="mt-4 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-staff-ink">Iniciar turno</h3>
                <p className="mt-1 text-sm text-staff-muted">
                  Selecione os pontos que você vai atender neste turno.
                </p>
              </div>

              {pointsError ? (
                <div className="space-y-3">
                  <Alert variant="danger">{pointsError}</Alert>
                  <button
                    type="button"
                    onClick={reloadPoints}
                    className="inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : pointsLoading ? (
                <p role="status" className="text-sm text-staff-muted">
                  Carregando pontos de alimentação...
                </p>
              ) : points.length === 0 ? (
                <EmptyState>Nenhum ponto de alimentação cadastrado.</EmptyState>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {points.map((point) => (
                    <CheckboxField
                      key={point.id}
                      id={`shift-feeding-point-${point.id}`}
                      label={`${point.name}${point.building ? ` — ${point.building}` : ''}${
                        point.isActive ? '' : ' (inativo)'
                      }`}
                      checked={selectedPointIds.includes(point.id)}
                      onChange={(checked) => togglePoint(point.id, checked)}
                    />
                  ))}
                </div>
              )}

              <TextField
                id="shift-notes"
                label="Observação"
                optional
                multiline
                rows={3}
                value={notes}
                onChange={setNotes}
              />

              <div className="border-t border-staff-line pt-4">
                <button
                  type="submit"
                  disabled={opening || closing}
                  className="inline-flex min-h-11 items-center rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                >
                  {opening ? 'Iniciando...' : 'Iniciar turno'}
                </button>
              </div>
            </form>
          )}
        </Panel>
      </section>

      <section aria-labelledby="shift-history-title">
        <Panel>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-2 text-staff-ink">
              <History size={18} aria-hidden="true" />
              <h2 id="shift-history-title" className="text-lg font-semibold">
                Histórico
              </h2>
            </div>
            <div className="w-full sm:max-w-xs">
              <SelectField
                id="shift-period"
                label="Período"
                value={period}
                onChange={setPeriod}
                options={PERIOD_OPTIONS}
              />
            </div>
          </div>

          {historyLoading ? (
            <EmptyState>Carregando histórico...</EmptyState>
          ) : historyError ? (
            <Alert variant="danger">{historyError}</Alert>
          ) : history.length === 0 ? (
            <EmptyState>Nenhum turno no período selecionado.</EmptyState>
          ) : (
            <div className="space-y-3">
              {history.map((shift) => (
                <article
                  key={shift.id}
                  className="space-y-3 rounded-xl border border-staff-line bg-staff-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-staff-ink">
                        {shift.memberName || `Membro #${shift.memberId}`}
                      </p>
                      <p className="text-sm text-staff-muted">
                        {formatDateTime(shift.startedAt)} · {formatDuration(shift.durationMinutes)}
                      </p>
                    </div>
                    <StatusBadge tone={shift.endedAt ? 'gray' : 'green'}>
                      {shift.endedAt ? 'Encerrado' : 'Em aberto'}
                    </StatusBadge>
                  </div>

                  <p className="flex items-start gap-1.5 text-sm text-staff-muted">
                    <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                    <span>{pointsLabel(shift.feedingPoints)}</span>
                  </p>

                  {shift.notes && (
                    <p className="whitespace-pre-line text-sm text-staff-muted">{shift.notes}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}
