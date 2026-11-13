import { useState } from 'react';
import { Link } from 'react-router-dom';
import { memberService } from '../services/memberService';
import type { StaffRole } from '../../../shared/types/role.types';
import { ROLE_LABEL } from '../../../shared/types/role.types';
import { SelectField } from '../../../shared/components/SelectField';
import { TextField } from '../../../shared/components/TextField';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { formatDate } from '../../../shared/utils/format';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/ui/table';

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
  const [search, setSearch] = useState('');

  const { data, loading, error } = useAsyncData(
    () =>
      memberService.list({
        role: role === 'todos' ? undefined : role,
        limit: 100,
      }),
    [role],
  );
  const members = data?.items ?? [];

  const term = normalizeText(search);
  const visibleMembers = term
    ? members.filter((member) =>
        [member.name, member.email ?? ''].some((value) =>
          normalizeText(value).includes(term),
        ),
      )
    : members;
  const hasFilters = role !== 'todos' || term !== '';
  const countLabel = term
    ? `${visibleMembers.length} de ${members.length} ${members.length === 1 ? 'membro' : 'membros'}`
    : `${members.length} ${members.length === 1 ? 'membro' : 'membros'}`;
  const clearFilters = () => {
    setSearch('');
    setRole('todos');
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Membros da equipe"
        subtitle="Voluntários, bolsistas e administração do projeto."
        actions={
          <Link
            to="/painel/membros/novo"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-staff-ink px-4 text-sm font-bold text-staff-surface transition-colors hover:bg-staff-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
          >
            Novo membro
          </Link>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Panel>
        <div className="mb-4 grid gap-4 sm:max-w-2xl sm:grid-cols-2">
          <TextField
            id="members-search"
            label="Buscar"
            type="search"
            placeholder="Nome ou e-mail"
            value={search}
            onChange={setSearch}
          />
          <SelectField
            id="members-role"
            label="Papel"
            value={role}
            onChange={(value) => setRole(value as RoleFilter)}
            options={FILTER_OPTIONS}
          />
        </div>
        <p aria-live="polite" className="mb-4 text-sm text-staff-muted">
          {countLabel}
        </p>

        {loading ? (
          <EmptyState>Carregando membros...</EmptyState>
        ) : members.length === 0 && !hasFilters ? (
          <EmptyState>
            <p>Nenhum membro cadastrado ainda.</p>
            <Link
              to="/painel/membros/novo"
              className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
            >
              Cadastrar membro
            </Link>
          </EmptyState>
        ) : visibleMembers.length === 0 ? (
          <EmptyState>
            <p>
              {term !== ''
                ? 'Nenhum membro encontrado para esta busca.'
                : 'Nenhum membro encontrado com este papel.'}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
            >
              Limpar filtros
            </button>
          </EmptyState>
        ) : (
          <Table
            containerProps={{
              role: 'region',
              tabIndex: 0,
              'aria-label': 'Tabela de membros — role horizontalmente para ver todas as colunas',
            }}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Entrada no projeto</TableHead>
                <TableHead>Dias de alimentação</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleMembers.map((member) => (
                <TableRow key={member.id ?? `${member.name}-${member.role}`}>
                  <TableCell>
                    {member.id !== null ? (
                      <Link
                        to={`/painel/membros/${member.id}`}
                        className="font-semibold text-staff-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent"
                      >
                        {member.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-staff-ink">{member.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-staff-muted">{member.email ?? '—'}</TableCell>
                  <TableCell className="text-staff-muted">
                    <span className="inline-flex w-fit items-center rounded-full border border-staff-line bg-staff-bg px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-staff-muted">
                      {ROLE_LABEL[member.role]}
                    </span>
                  </TableCell>
                  <TableCell className="text-staff-muted">
                    {member.ufopaRegistration ?? '—'}
                  </TableCell>
                  <TableCell className="text-staff-muted">
                    {formatDate(member.projectEntryDate)}
                  </TableCell>
                  <TableCell className="text-staff-muted">
                    {member.feedingDays && member.feedingDays.length > 0
                      ? member.feedingDays.join(', ')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {member.id !== null && (
                        <Link
                          to={`/painel/membros/${member.id}`}
                          className="inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                        >
                          Ver
                        </Link>
                      )}
                      {member.id !== null && (
                        <Link
                          to={`/painel/membros/${member.id}/editar`}
                          className="inline-flex min-h-11 items-center rounded-xl border border-staff-line bg-staff-surface px-3 text-sm font-bold text-staff-ink transition-colors hover:bg-staff-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-staff-accent motion-reduce:transition-none"
                        >
                          Editar
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
