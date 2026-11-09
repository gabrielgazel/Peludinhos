import { Link } from 'react-router-dom';
import { ClipboardList, PawPrint, Plus, Users } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin, roleLabel } from '../../../shared/types/role.types';
import { animalService } from '../../animals/services/animalService';
import { adoptionService } from '../../adoption/services/adoptionService';
import { memberService } from '../services/memberService';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { PageHead } from '../components/PageHead';
import { StatCard } from '../components/StatCard';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import '../staff.css';

export function DashboardPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);

  const { data, loading, error } = useAsyncData(async () => {
    const [animals, pendingIntents, members] = await Promise.all([
      animalService.list({ limit: 1 }),
      adoptionService.list({ status: 'pendente', limit: 1 }),
      admin ? memberService.list({ limit: 100 }) : Promise.resolve(null),
    ]);
    return {
      animals: animals.total,
      pendingIntents: pendingIntents.total,
      members: members ? members.total : null,
      // Membros com poucos cadastros: o painel mostra só o total.
    };
  }, [admin]);

  return (
    <div className="space-y-6">
      <PageHead
        title={`Olá, ${user?.name?.split(' ')[0] ?? 'equipe'}!`}
        subtitle={`Você está conectado como ${roleLabel(user?.role)}.`}
        actions={
          admin ? (
            <Link
              to="/painel/animais/novo"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-accent px-4 text-sm font-bold text-white transition-colors hover:bg-staff-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
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
        <h2 className="mb-3 text-lg font-bold text-staff-ink">Ações rápidas</h2>
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
