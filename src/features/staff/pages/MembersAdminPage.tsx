import { useState } from 'react';
import { Link } from 'react-router-dom';
import { memberService } from '../services/memberService';
import type { StaffRole } from '../../../shared/types/role.types';
import { ROLE_LABEL } from '../../../shared/types/role.types';
import { SelectField } from '../../../shared/components/SelectField';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { formatDate } from '../../../shared/utils/format';
import '../staff.css';

type RoleFilter = 'todos' | StaffRole;

const FILTER_OPTIONS = [
  { value: 'todos', label: 'Todos os papéis' },
  { value: 'administrador', label: ROLE_LABEL.administrador },
  { value: 'coordenador', label: ROLE_LABEL.coordenador },
  { value: 'bolsista', label: ROLE_LABEL.bolsista },
  { value: 'voluntario', label: ROLE_LABEL.voluntario },
];

export function MembersAdminPage() {
  const [role, setRole] = useState<RoleFilter>('todos');

  const { data, loading, error } = useAsyncData(
    () =>
      memberService.list({
        role: role === 'todos' ? undefined : role,
        limit: 100,
      }),
    [role],
  );
  const members = data?.items ?? [];

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-head__title">Membros da equipe</h1>
          <p className="page-head__subtitle">
            Voluntários, bolsistas e administração do projeto.
          </p>
        </div>
        <div className="page-head__actions">
          <Link to="/painel/membros/novo" className="btn btn--primary">
            Novo membro
          </Link>
        </div>
      </header>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      <div className="panel">
        <div className="filter-bar">
          <div className="filter-bar__field">
            <SelectField
              id="members-role"
              label="Papel"
              value={role}
              onChange={(value) => setRole(value as RoleFilter)}
              options={FILTER_OPTIONS}
            />
          </div>
        </div>

        {loading ? (
          <p className="empty-state">Carregando membros...</p>
        ) : members.length === 0 ? (
          <p className="empty-state">Nenhum membro encontrado.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th>Matrícula</th>
                  <th>Entrada no projeto</th>
                  <th>Dias de alimentação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id ?? `${member.name}-${member.role}`}>
                    <td>
                      <strong>{member.name}</strong>
                    </td>
                    <td className="data-table__muted">{member.email ?? '—'}</td>
                    <td>{ROLE_LABEL[member.role]}</td>
                    <td className="data-table__muted">
                      {member.ufopaRegistration ?? '—'}
                    </td>
                    <td className="data-table__muted">
                      {formatDate(member.projectEntryDate)}
                    </td>
                    <td className="data-table__muted">
                      {member.feedingDays && member.feedingDays.length > 0
                        ? member.feedingDays.join(', ')
                        : '—'}
                    </td>
                    <td>
                      <div className="data-table__actions">
                        {member.id !== null && (
                          <Link
                            to={`/painel/membros/${member.id}/editar`}
                            className="btn btn--sm"
                          >
                            Editar
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
