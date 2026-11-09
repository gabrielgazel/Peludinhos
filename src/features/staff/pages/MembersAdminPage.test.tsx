import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Member } from '../services/memberService';
import { memberService } from '../services/memberService';
import { MembersAdminPage } from './MembersAdminPage';

vi.mock('../services/memberService', () => ({
  memberService: { list: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

function makeMember(partial: Partial<Member> & { name: string }): Member {
  return {
    id: 1,
    role: 'voluntario',
    email: 'ana@peludinhos.example',
    birthDate: null,
    cpf: null,
    ufopaRegistration: '2021001234',
    projectEntryDate: '2024-03-15',
    feedingDays: ['segunda', 'quarta'],
    ...partial,
  };
}

const ana = makeMember({ id: 1, name: 'Ana Souza', role: 'voluntario' });
const bruno = makeMember({
  id: 2,
  name: 'Bruno Lima',
  role: 'bolsista',
  email: null,
  ufopaRegistration: null,
  projectEntryDate: null,
  feedingDays: [],
});
const carla = makeMember({
  id: null,
  name: 'Carla Mendes',
  role: 'coordenador',
  email: 'carla@peludinhos.example',
  ufopaRegistration: '2022005678',
  feedingDays: ['terca'],
});

const fixtures = [ana, bruno, carla];

function page(items: Member[]) {
  return { items, total: items.length, limit: 100, offset: 0 };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MembersAdminPage />
    </MemoryRouter>,
  );
}

function setupList(items: Member[] = fixtures) {
  vi.mocked(memberService.list).mockResolvedValue(page(items));
}

describe('MembersAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupList();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('busca membros com limit 100 sem papel no início e expõe colunas e linhas', async () => {
    renderPage();

    expect(await screen.findByRole('table')).toBeInTheDocument();
    await waitFor(() => {
      expect(vi.mocked(memberService.list)).toHaveBeenCalledWith({
        role: undefined,
        limit: 100,
      });
    });

    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'E-mail' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Papel' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Matrícula' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Entrada no projeto' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Dias de alimentação' })).toBeInTheDocument();

    const anaRow = screen.getByText('Ana Souza').closest('tr');
    expect(anaRow).not.toBeNull();
    expect(within(anaRow as HTMLElement).getByText('ana@peludinhos.example')).toBeInTheDocument();
    expect(within(anaRow as HTMLElement).getByText('Voluntário')).toBeInTheDocument();
    expect(within(anaRow as HTMLElement).getByText('2021001234')).toBeInTheDocument();
    expect(within(anaRow as HTMLElement).getByText('15/03/2024')).toBeInTheDocument();
    expect(within(anaRow as HTMLElement).getByText('segunda, quarta')).toBeInTheDocument();

    expect(within(screen.getByRole('table')).getAllByRole('row').length).toBe(4); // cabeçalho + 3 linhas
  });

  it('troca do filtro Papel chama list com o papel correspondente e limit 100', async () => {
    renderPage();

    await screen.findByText('Ana Souza');
    expect(vi.mocked(memberService.list)).toHaveBeenCalledWith({ role: undefined, limit: 100 });

    fireEvent.change(screen.getByLabelText(/Papel/i), {
      target: { value: 'bolsista' },
    });

    await waitFor(() => {
      expect(vi.mocked(memberService.list)).toHaveBeenCalledWith({
        role: 'bolsista',
        limit: 100,
      });
    });

    fireEvent.change(screen.getByLabelText(/Papel/i), {
      target: { value: 'todos' },
    });

    await waitFor(() => {
      expect(vi.mocked(memberService.list)).toHaveBeenCalledWith({
        role: undefined,
        limit: 100,
      });
    });
  });

  it('mostra Carregando membros... enquanto carrega', () => {
    vi.mocked(memberService.list).mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText('Carregando membros...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando membros...');
  });

  it('mostra o estado vazio com o texto exato quando não há membros', async () => {
    vi.mocked(memberService.list).mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText('Nenhum membro encontrado.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Nenhum membro encontrado.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('exibe role="alert" com a mensagem quando a listagem falha', async () => {
    vi.mocked(memberService.list).mockRejectedValueOnce(new Error('rede indisponível'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('rede indisponível');
  });

  it('Editar aparece só para member.id !== null, com os destinos corretos', async () => {
    renderPage();

    await screen.findByText('Ana Souza');

    const brunoRow = screen.getByText('Bruno Lima').closest('tr');
    expect(within(brunoRow as HTMLElement).getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/painel/membros/2/editar',
    );

    const carlaRow = screen.getByText('Carla Mendes').closest('tr');
    expect(within(carlaRow as HTMLElement).queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('usa — em campos nulos e arrays vazios', async () => {
    renderPage();

    const brunoRow = (await screen.findByText('Bruno Lima')).closest('tr');
    expect(brunoRow).not.toBeNull();
    // e-mail, matrícula, entrada, dias
    expect(within(brunoRow as HTMLElement).getAllByText('—').length).toBe(4);
  });

  it('novo membro com classes primárias do painel', async () => {
    renderPage();

    const novo = await screen.findByRole('link', { name: 'Novo membro' });
    expect(novo).toHaveAttribute('href', '/painel/membros/novo');
    expect(novo).toHaveClass('bg-staff-ink');
    expect(novo).toHaveClass('text-staff-surface');
    expect(screen.getByText('Membros da equipe')).toBeInTheDocument();
    expect(screen.getByText('Voluntários, bolsistas e administração do projeto.')).toBeInTheDocument();
  });

  it('usa a moldura nova sem classes legadas e com scroll acessível', async () => {
    const { container } = renderPage();

    await screen.findByText('Ana Souza');

    expect(container.querySelector('.page-head')).toBeNull();
    expect(container.querySelector('.btn')).toBeNull();
    expect(container.querySelector('.panel')).toBeNull();
    expect(container.querySelector('.alert')).toBeNull();
    expect(container.querySelector('.empty-state')).toBeNull();
    expect(container.querySelector('.filter-bar')).toBeNull();
    expect(container.querySelector('.table-scroll')).toBeNull();
    expect(container.querySelector('.data-table')).toBeNull();
    expect(container.querySelector('.badge')).toBeNull();

    // Grid de filtros novo
    expect(container.querySelector('.grid')).not.toBeNull();

    // Região focável para rolagem horizontal
    const region = screen.getByRole('region', {
      name: 'Tabela de membros — role horizontalmente para ver todas as colunas',
    });
    expect(region).toHaveAttribute('tabindex', '0');

    // Selo neutro de papel novo usa os tons staff
    const papel = within(screen.getByRole('table')).getByText('Voluntário');
    expect(papel).toHaveClass('rounded-full');
    expect(papel).toHaveClass('text-staff-muted');

    // Nome em destaque, demais células muted
    expect(screen.getByText('Ana Souza')).toHaveClass('font-semibold');
    expect(screen.getByText('Ana Souza')).toHaveClass('text-staff-ink');
    expect(screen.getByText('ana@peludinhos.example')).toHaveClass('text-staff-muted');
  });
});
