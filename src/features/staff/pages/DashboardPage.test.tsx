import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../auth/types/auth.types';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { DashboardPage } from './DashboardPage';

vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../../shared/hooks/useAsyncData', () => ({ useAsyncData: vi.fn() }));

const adminUser: AuthUser = {
  id: 'user-admin-1',
  email: 'admin@peludinhos.example',
  name: 'Maria Silva',
  actorType: 'membro',
  role: 'administrador',
  memberId: 42,
  visitorId: null,
};

const bolsistaUser: AuthUser = {
  ...adminUser,
  id: 'user-bolsista-1',
  email: 'bolsista@peludinhos.example',
  name: 'João Pedro',
  role: 'bolsista',
};

type Summary = {
  animals: number;
  pendingIntents: number;
  members: number | null;
};

function renderDashboard(options: {
  user: AuthUser | null;
  data: Summary | null;
  loading?: boolean;
  error?: string | null;
}) {
  const { user, data, loading = false, error = null } = options;

  vi.mocked(useAuth).mockReturnValue({ user } as ReturnType<typeof useAuth>);
  vi.mocked(useAsyncData).mockReturnValue({
    data,
    loading,
    error,
    reload: vi.fn(),
  } as ReturnType<typeof useAsyncData>);

  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe a saudação com o primeiro nome e o subtítulo com o papel (admin)', () => {
    renderDashboard({ user: adminUser, data: { animals: 12, pendingIntents: 3, members: 7 } });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Olá, Maria!' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Você está conectado como Administrador.'),
    ).toBeInTheDocument();
  });

  it('exibe a saudação com o primeiro nome e o subtítulo com o papel (bolsista)', () => {
    renderDashboard({ user: bolsistaUser, data: { animals: 12, pendingIntents: 3, members: null } });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Olá, João!' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Você está conectado como Bolsista.'),
    ).toBeInTheDocument();
  });

  it('para admin, exibe os três cards com valores, rótulos e destinos', () => {
    renderDashboard({ user: adminUser, data: { animals: 12, pendingIntents: 3, members: 7 } });

    const animals = screen.getByText('Animais cadastrados').closest('a');
    expect(animals).toHaveAttribute('href', '/painel/animais');
    expect(screen.getByText('12')).toBeInTheDocument();

    const intents = screen.getByText('Intenções pendentes').closest('a');
    expect(intents).toHaveAttribute('href', '/painel/intencoes');
    expect(screen.getByText('3')).toBeInTheDocument();

    const members = screen.getByText('Membros da equipe').closest('a');
    expect(members).toHaveAttribute('href', '/painel/membros');
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('para admin, exibe Novo animal, Ver animais, Avaliar intenções e Gerenciar membros', () => {
    renderDashboard({ user: adminUser, data: { animals: 12, pendingIntents: 3, members: 7 } });

    const novo = screen.getByRole('link', { name: /Novo animal/ });
    expect(novo).toHaveAttribute('href', '/painel/animais/novo');

    expect(screen.getByRole('link', { name: /Ver animais/ })).toHaveAttribute(
      'href',
      '/painel/animais',
    );
    expect(screen.getByRole('link', { name: /Avaliar intenções/ })).toHaveAttribute(
      'href',
      '/painel/intencoes',
    );
    expect(screen.getByRole('link', { name: /Gerenciar membros/ })).toHaveAttribute(
      'href',
      '/painel/membros',
    );
  });

  it('para bolsista, exibe só dois cards e oculta Membros, Novo animal e Gerenciar membros', () => {
    renderDashboard({ user: bolsistaUser, data: { animals: 12, pendingIntents: 3, members: null } });

    expect(screen.getByText('Animais cadastrados')).toBeInTheDocument();
    expect(screen.getByText('Intenções pendentes')).toBeInTheDocument();
    expect(screen.queryByText('Membros da equipe')).not.toBeInTheDocument();

    expect(screen.queryByRole('link', { name: /Novo animal/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Gerenciar membros/ })).not.toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Ver animais/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Avaliar intenções/ })).toBeInTheDocument();
  });

  it('exibe … nos valores enquanto carrega', () => {
    renderDashboard({ user: adminUser, data: null, loading: true });

    expect(screen.getAllByText('…')).toHaveLength(3);
  });

  it('exibe o alerta de erro com o texto exato do resumo', () => {
    renderDashboard({
      user: adminUser,
      data: null,
      error: 'rede indisponível',
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o resumo: rede indisponível',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o resumo: rede indisponível',
    );
  });

  it('usa a moldura nova (PageHead, StatCard, Panel e Alert) sem classes legadas', () => {
    const { container } = renderDashboard({
      user: adminUser,
      data: { animals: 12, pendingIntents: 3, members: 7 },
    });

    // Estrutura nova
    expect(container.querySelector('.space-y-6')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Ações rápidas' })).toBeInTheDocument();

    // CTA primário neutro (tinta sobre superfície) para contraste AA, sem o Button legado
    const novo = screen.getByRole('link', { name: /Novo animal/ });
    expect(novo).toHaveClass('bg-staff-ink');
    expect(novo).not.toHaveClass('btn');

    // Cards novos
    const animalsLink = screen.getByText('Animais cadastrados').closest('a');
    expect(animalsLink).toHaveClass('bg-staff-surface');
    expect(animalsLink).not.toHaveClass('stat-card');

    // Ações secundárias novas
    const ver = screen.getByRole('link', { name: /Ver animais/ });
    expect(ver).toHaveClass('border-staff-line');
    expect(ver).not.toHaveClass('btn');

    // Nenhuma classe legada do Dashboard permanece
    expect(container.querySelector('.stat-grid')).toBeNull();
    expect(container.querySelector('.stat-card')).toBeNull();
    expect(container.querySelector('.stat-card__value')).toBeNull();
    expect(container.querySelector('.stat-card__label')).toBeNull();
    expect(container.querySelector('.page-head')).toBeNull();
    expect(container.querySelector('.btn')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.alert')).toBeNull();
  });

  it('aplica o Alert novo na variante danger em caso de erro', () => {
    renderDashboard({ user: adminUser, data: null, error: 'rede indisponível' });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-l-staff-danger');
    expect(alert).not.toHaveClass('alert--error');
  });
});
