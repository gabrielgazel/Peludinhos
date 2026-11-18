import { Link } from 'react-router-dom';
import { ClipboardList, Clock, PawPrint, Plus, Users } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin, roleLabel } from '../../../shared/types/role.types';
import { animalService } from '../../animals/services/animalService';
import { adoptionService } from '../../adoption/services/adoptionService';
import { memberService } from '../services/memberService';
import { shiftService, type Shift } from '../services/shiftService';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { PageHead } from '../components/PageHead';
import { StatCard } from '../components/StatCard';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';

/** Hora local no formato HH:MM, usada no card de turno. */
function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function DashboardPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);

  const { data, loading, error } = useAsyncData(async () => {
    const [animals, pendingIntents, members] = await Promise.all([
      animalService.list({ limit: 1 }),
      adoptionService.list({ status: 'pendente', limit: 1 }),
      admin ? memberService.list({ limit: 100 }) : Promise.resolve(null),
    ]);

    // O turno é carregado junto, mas uma falha aqui não derruba o resumo.
    let shift: Shift | null = null;
    let shiftError: string | null = null;
    try {
      shift = await shiftService.current();
    } catch (err) {
      shiftError = err instanceof Error ? err.message : 'Não foi possível carregar seu turno.';
    }

    return {
      animals: animals.total,
      pendingIntents: pendingIntents.total,
      members: members ? members.total : null,
      shift,
      shiftError,
      // Membros com poucos cadastros: o painel mostra só o total.
    };
  }, [admin]);

  const shift = data?.shift ?? null;
  const shiftError = data?.shiftError ?? null;

  return (
    <div className="space-y-6">
      <PageHead
        title={`Olá, ${user?.name?.split(' ')[0] ?? 'equipe'}!`}
        subtitle={`Você está conectado como ${roleLabel(user?.role)}.`}
        actions={
          admin ? (
            <Link
              to="/painel/animais/novo"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
            >
              <Plus size={16} aria-hidden="true" />
              Novo animal
            </Link>
          ) : undefined
        }
      />

      {error && <Alert variant="danger">Não foi possível carregar o resumo: {error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          to="/painel/animais"
          label="Animais cadastrados"
          value={loading ? '…' : (data?.animals ?? 0)}
          icon={<PawPrint size={22} aria-hidden="true" />}
        />
        <StatCard
          to="/painel/intencoes"
          label="Intenções pendentes"
          value={loading ? '…' : (data?.pendingIntents ?? 0)}
          icon={<ClipboardList size={22} aria-hidden="true" />}
        />
        {admin && (
          <StatCard
            to="/painel/membros"
            label="Membros da equipe"
            value={loading ? '…' : (data?.members ?? 0)}
            icon={<Users size={22} aria-hidden="true" />}
          />
        )}
      </div>

      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-staff-ink">
              <Clock size={18} aria-hidden="true" />
              <h2 className="font-body text-lg font-bold">Meu turno</h2>
            </div>

            {loading ? (
              <p className="text-sm text-staff-muted">Carregando turno...</p>
            ) : shiftError ? (
              <p className="text-sm text-staff-danger">
                Não foi possível carregar seu turno: {shiftError}
              </p>
            ) : shift ? (
              <p className="text-sm text-staff-muted">
                Turno aberto desde{' '}
                <strong className="font-semibold text-staff-ink">
                  {formatTime(shift.startedAt)}
                </strong>
                .
              </p>
            ) : (
              <p className="text-sm text-staff-muted">Nenhum turno aberto.</p>
            )}
          </div>

          {!loading && (
            <Link
              to="/painel/operacao/turnos"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
            >
              {shiftError ? 'Ver turnos' : shift ? 'Encerrar' : 'Iniciar turno'}
            </Link>
          )}
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 font-body text-lg font-bold text-staff-ink">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/painel/animais"
            className="inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
          >
            Ver animais
          </Link>
          <Link
            to="/painel/intencoes"
            className="inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
          >
            Avaliar intenções
          </Link>
          {admin && (
            <Link
              to="/painel/membros"
              className="inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-4 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
            >
              Gerenciar membros
            </Link>
          )}
        </div>
      </Panel>
    </div>
  );
}
