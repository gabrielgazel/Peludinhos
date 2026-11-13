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

  it('mostra lista vazia com CTA de cadastro quando não há membros', async () => {
    vi.mocked(memberService.list).mockResolvedValue(page([]));
    renderPage();

    expect(await screen.findByText('Nenhum membro cadastrado ainda.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastrar membro' })).toHaveAttribute(
      'href',
      '/painel/membros/novo',
    );
    expect(screen.getByText('0 membros')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('exibe role="alert" com a mensagem quando a listagem falha', async () => {
    vi.mocked(memberService.list).mockRejectedValueOnce(new Error('rede indisponível'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('rede indisponível');
    expect(screen.queryByRole('link', { name: 'Cadastrar membro' })).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhum membro cadastrado ainda.')).not.toBeInTheDocument();
    expect(screen.queryByText('0 membros')).not.toBeInTheDocument();
  });

  it('mostra estado vazio específico quando o papel filtrado não tem membros', async () => {
    renderPage();
    await screen.findByText('Ana Souza');

    vi.mocked(memberService.list).mockResolvedValue(page([]));
    fireEvent.change(screen.getByLabelText(/Papel/i), { target: { value: 'bolsista' } });

    expect(
      await screen.findByText('Nenhum membro encontrado com este papel.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
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

  it('busca por nome e e-mail sem diferenciar caixa, ignorando espaços em branco', async () => {
    renderPage();
    await screen.findByText('Ana Souza');

    const search = screen.getByLabelText(/Buscar/i);
    fireEvent.change(search, { target: { value: 'ANA@PELUDINHOS' } });

    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.queryByText('Bruno Lima')).not.toBeInTheDocument();
    expect(screen.queryByText('Carla Mendes')).not.toBeInTheDocument();
    expect(screen.getByText('1 de 3 membros')).toBeInTheDocument();
    expect(vi.mocked(memberService.list)).toHaveBeenCalledTimes(1);

    fireEvent.change(search, { target: { value: '   ' } });
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
    expect(screen.getByText('Carla Mendes')).toBeInTheDocument();
    expect(screen.getByText('3 membros')).toBeInTheDocument();
  });

  it('busca por nome ignorando acentos', async () => {
    setupList([
      makeMember({ id: 9, name: 'José Ávila', email: 'jose@peludinhos.example' }),
      makeMember({ id: 10, name: 'Ana Souza' }),
    ]);
    renderPage();
    await screen.findByText('Ana Souza');

    fireEvent.change(screen.getByLabelText(/Buscar/i), { target: { value: 'JOSE avila' } });

    expect(screen.getByText('José Ávila')).toBeInTheDocument();
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument();
    expect(screen.getByText('1 de 2 membros')).toBeInTheDocument();
  });

  it('sem resultados mostra o estado de busca e Limpar filtros restaura a lista', async () => {
    renderPage();
    await screen.findByText('Ana Souza');

    fireEvent.change(screen.getByLabelText(/Papel/i), { target: { value: 'bolsista' } });
    await waitFor(() => {
      expect(vi.mocked(memberService.list)).toHaveBeenCalledWith({
        role: 'bolsista',
        limit: 100,
      });
    });

    fireEvent.change(screen.getByLabelText(/Buscar/i), { target: { value: 'zzz' } });
    expect(screen.getByText('Nenhum membro encontrado para esta busca.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(screen.getByLabelText(/Buscar/i)).toHaveValue('');
    expect(screen.getByLabelText(/Papel/i)).toHaveValue('todos');
    await waitFor(() => {
      expect(vi.mocked(memberService.list)).toHaveBeenCalledWith({
        role: undefined,
        limit: 100,
      });
    });
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
  });

  it('mostra a contagem no singular', async () => {
    renderPage();
    await screen.findByText('Ana Souza');
    expect(screen.getByText('3 membros')).toBeInTheDocument();

    setupList([makeMember({ id: 1, name: 'Ana Souza' })]);
    fireEvent.change(screen.getByLabelText(/Papel/i), { target: { value: 'voluntario' } });

    expect(await screen.findByText('1 membro')).toBeInTheDocument();
  });

  it('liga nome e ação Ver à ficha apenas quando há id', async () => {
    renderPage();
    await screen.findByText('Ana Souza');

    expect(screen.getByRole('link', { name: 'Ana Souza' })).toHaveAttribute(
      'href',
      '/painel/membros/1',
    );
    expect(screen.getByRole('link', { name: 'Ana Souza' })).toHaveClass('min-h-11');

    const anaRow = (await screen.findByText('Ana Souza')).closest('tr') as HTMLElement;
    expect(within(anaRow).getByRole('link', { name: 'Ver' })).toHaveAttribute(
      'href',
      '/painel/membros/1',
    );
    expect(within(anaRow).getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/painel/membros/1/editar',
    );

    const carlaRow = (await screen.findByText('Carla Mendes')).closest('tr') as HTMLElement;
    expect(within(carlaRow).queryByRole('link', { name: 'Ver' })).not.toBeInTheDocument();
    expect(within(carlaRow).queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument();
    expect(within(carlaRow).queryByRole('link', { name: 'Carla Mendes' })).not.toBeInTheDocument();
  });
});
