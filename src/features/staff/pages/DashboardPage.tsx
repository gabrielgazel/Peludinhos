import { Link } from 'react-router-dom';
import { ClipboardList, PawPrint, Plus, Users } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin, roleLabel } from '../../../shared/types/role.types';
import { animalService } from '../../animals/services/animalService';
import { adoptionService } from '../../adoption/services/adoptionService';
import { memberService } from '../services/memberService';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
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
    <>
      <header className="page-head">
        <div>
          <h1 className="page-head__title">
            Olá, {user?.name?.split(' ')[0] ?? 'equipe'}!
          </h1>
          <p className="page-head__subtitle">
            Você está conectado como {roleLabel(user?.role)}.
          </p>
        </div>
        {admin && (
          <div className="page-head__actions">
            <Link to="/painel/animais/novo" className="btn btn--primary">
              <Plus size={16} aria-hidden="true" />
              Novo animal
            </Link>
          </div>
        )}
      </header>

      {error && (
        <p className="alert alert--error" role="alert">
          Não foi possível carregar o resumo: {error}
        </p>
      )}

      <div className="stat-grid">
        <Link to="/painel/animais" className="stat-card">
          <PawPrint size={22} aria-hidden="true" />
          <span className="stat-card__value">{loading ? '…' : (data?.animals ?? 0)}</span>
          <span className="stat-card__label">Animais cadastrados</span>
        </Link>

        <Link to="/painel/intencoes" className="stat-card">
          <ClipboardList size={22} aria-hidden="true" />
          <span className="stat-card__value">
            {loading ? '…' : (data?.pendingIntents ?? 0)}
          </span>
          <span className="stat-card__label">Intenções pendentes</span>
        </Link>

        {admin && (
          <Link to="/painel/membros" className="stat-card">
            <Users size={22} aria-hidden="true" />
            <span className="stat-card__value">
              {loading ? '…' : (data?.members ?? 0)}
            </span>
            <span className="stat-card__label">Membros da equipe</span>
          </Link>
        )}
      </div>

      <section className="panel" style={{ marginTop: 24 }}>
        <h2 className="panel__title">Ações rápidas</h2>
        <div className="page-head__actions">
          <Link to="/painel/animais" className="btn">
            Ver animais
          </Link>
          <Link to="/painel/intencoes" className="btn">
            Avaliar intenções
          </Link>
          {admin && (
            <Link to="/painel/membros" className="btn">
              Gerenciar membros
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
