import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../auth/types/auth.types';
import { useAuth } from '../../auth/hooks/useAuth';
import type { Animal } from '../../animals/types/animal.types';
import { animalService } from '../../animals/services/animalService';
import { AnimalsAdminPage } from './AnimalsAdminPage';

vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../animals/services/animalService', () => ({
  animalService: { list: vi.fn(), markDeceased: vi.fn() },
}));

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

function makeAnimal(partial: Partial<Animal> & { id: number; name: string }): Animal {
  return {
    sex: 'F',
    colorDescription: null,
    age: null,
    isNeutered: false,
    status: 'disponivel',
    behavior: 'docil',
    notes: null,
    isDeceased: false,
    photoUrl: null,
    createdAt: null,
    updatedAt: null,
    ...partial,
  };
}

const mel = makeAnimal({ id: 1, name: 'Mel', sex: 'F', status: 'disponivel', isNeutered: true });
const thor = makeAnimal({
  id: 2,
  name: 'Thor',
  sex: 'M',
  status: 'adotado',
  behavior: 'sociavel',
  isNeutered: false,
});
const luna = makeAnimal({
  id: 3,
  name: 'Luna',
  sex: 'F',
  status: 'indisponivel',
  behavior: null,
  isDeceased: true,
});

const fixtures = [mel, thor, luna];

function page(items: Animal[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function renderPage(user: AuthUser) {
  vi.mocked(useAuth).mockReturnValue({ user } as ReturnType<typeof useAuth>);
  return render(
    <MemoryRouter>
      <AnimalsAdminPage />
    </MemoryRouter>,
  );
}

function setupList(items: Animal[] = fixtures) {
  vi.mocked(animalService.list).mockResolvedValue(page(items));
  vi.mocked(animalService.markDeceased).mockImplementation(async (id: number) => {
    const found = fixtures.find((a) => a.id === id) ?? mel;
    return { ...found, isDeceased: true };
  });
}

function rowCount() {
  return within(screen.getByRole('table')).getAllByRole('row').length;
}

describe('AnimalsAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupList();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filtra por nome e atualiza a contagem de linhas visíveis', async () => {
    renderPage(adminUser);

    expect(await screen.findByText('Mel')).toBeInTheDocument();
    expect(rowCount()).toBe(4); // cabeçalho + 3 linhas

    fireEvent.change(screen.getByLabelText(/Buscar por nome/i), {
      target: { value: 'Thor' },
    });

    expect(screen.getByText('Thor')).toBeInTheDocument();
    expect(screen.queryByText('Mel')).not.toBeInTheDocument();
    expect(screen.queryByText('Luna')).not.toBeInTheDocument();
    expect(rowCount()).toBe(2); // cabeçalho + 1 linha
  });

  it('filtra por status', async () => {
    renderPage(adminUser);

    expect(await screen.findByText('Mel')).toBeInTheDocument();
    expect(rowCount()).toBe(4);

    fireEvent.change(screen.getByLabelText(/Status/i), {
      target: { value: 'adotado' },
    });

    expect(screen.getByText('Thor')).toBeInTheDocument();
    expect(
      within(screen.getByRole('table')).getByText('Adotado'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Mel')).not.toBeInTheDocument();
    expect(rowCount()).toBe(2);
  });

  it('mostra o estado vazio com o texto exato quando nada corresponde', async () => {
    renderPage(adminUser);

    await screen.findByText('Mel');
    fireEvent.change(screen.getByLabelText(/Buscar por nome/i), {
      target: { value: 'nome-que-nao-existe' },
    });

    expect(
      screen.getByText('Nenhum animal encontrado com esses filtros.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Nenhum animal encontrado com esses filtros.',
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('mostra Carregando animais... enquanto carrega', () => {
    vi.mocked(animalService.list).mockReturnValue(new Promise(() => {}));
    renderPage(adminUser);

    expect(screen.getByText('Carregando animais...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando animais...');
  });

  it('expõe role="table" e os nomes das colunas visíveis', async () => {
    renderPage(adminUser);

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Foto' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Sexo' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Comportamento' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Castrado' })).toBeInTheDocument();
  });

  it('exibe o selo Falecido apenas para o animal falecido', async () => {
    renderPage(adminUser);

    const lunaRow = (await screen.findByText('Luna')).closest('tr');
    expect(lunaRow).not.toBeNull();
    expect(within(lunaRow as HTMLElement).getByText('Falecido')).toBeInTheDocument();

    const melRow = screen.getByText('Mel').closest('tr');
    expect(within(melRow as HTMLElement).queryByText('Falecido')).not.toBeInTheDocument();
  });

  it('não chama markDeceased quando a confirmação é cancelada', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage(adminUser);

    await screen.findByText('Mel');
    const button = screen.getAllByRole('button', { name: /Registrar morte/ })[0];
    fireEvent.click(button);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Registrar o falecimento de Mel? Esta ação não pode ser desfeita.',
    );
    await waitFor(() => {
      expect(animalService.markDeceased).not.toHaveBeenCalled();
    });
  });

  it('registra a morte quando confirmado e refaz a busca via reload', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(adminUser);

    await screen.findByText('Mel');
    expect(vi.mocked(animalService.list)).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole('button', { name: /Registrar morte/ })[0]);

    await waitFor(() => {
      expect(animalService.markDeceased).toHaveBeenCalledWith(1);
    });
    expect(confirmSpy).toHaveBeenCalledWith(
      'Registrar o falecimento de Mel? Esta ação não pode ser desfeita.',
    );
    await waitFor(() => {
      expect(vi.mocked(animalService.list)).toHaveBeenCalledTimes(2);
    });
  });

  it('exibe role="alert" com a mensagem quando a listagem falha', async () => {
    vi.mocked(animalService.list).mockRejectedValueOnce(new Error('rede indisponível'));
    renderPage(adminUser);

    expect(await screen.findByRole('alert')).toHaveTextContent('rede indisponível');
  });

  it('para admin, exibe Novo animal e Editar com os destinos corretos', async () => {
    renderPage(adminUser);

    const novo = await screen.findByRole('link', { name: /Novo animal/ });
    expect(novo).toHaveAttribute('href', '/painel/animais/novo');
    expect(novo).toHaveClass('bg-staff-ink');
    expect(novo).toHaveClass('text-staff-surface');

    const editar = screen.getAllByRole('link', { name: 'Editar' })[0];
    expect(editar).toHaveAttribute('href', '/painel/animais/1/editar');
    expect(editar).toHaveClass('border-staff-line');
    expect(editar).toHaveClass('text-staff-ink');
  });

  it('para bolsista, oculta Novo animal e Editar mas mantém Registrar morte', async () => {
    renderPage(bolsistaUser);

    await screen.findByText('Mel');
    expect(screen.queryByRole('link', { name: /Novo animal/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Registrar morte/ }).length).toBeGreaterThan(0);
  });

  it('usa a moldura nova sem classes legadas e com scroll acessível', async () => {
    const { container } = renderPage(adminUser);

    await screen.findByText('Mel');

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
      name: 'Tabela de animais — role horizontalmente para ver todas as colunas',
    });
    expect(region).toHaveAttribute('tabindex', '0');

    // Botão de perigo novo
    const danger = screen.getAllByRole('button', { name: /Registrar morte/ })[0];
    expect(danger).toHaveClass('text-staff-danger');
    expect(danger).toHaveClass('hover:bg-staff-danger/10');
    expect(danger).not.toHaveClass('btn--danger');

    // Selo de status novo usa os tons staff
    expect(
      within(screen.getByRole('table')).getByText('Disponível'),
    ).toHaveClass('rounded-full');
    expect(
      within(screen.getByRole('table')).getByText('Falecido'),
    ).toHaveClass('text-staff-muted');
  });
});
