import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../auth/types/auth.types';
import { useAuth } from '../../auth/hooks/useAuth';
import { HttpError } from '../../../shared/api/httpsClient';
import { foodService, type Food } from '../services/foodService';
import { FoodAdminPage } from './FoodAdminPage';

vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/foodService', () => ({
  foodService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listMovements: vi.fn(),
    createMovement: vi.fn(),
    listAllMovements: vi.fn(),
  },
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

function makeFood(partial: Partial<Food> & { id: number; name: string }): Food {
  return {
    weightKg: 20,
    entryDate: '2026-11-18',
    balanceKg: 0,
    createdAt: null,
    updatedAt: null,
    ...partial,
  };
}

const racaoCheia = makeFood({ id: 1, name: 'Ração premium', balanceKg: 18 });
const racaoBaixa = makeFood({
  id: 2,
  name: 'Ração de gato',
  balanceKg: 3.5,
  entryDate: '2026-11-10',
});
// 4 kg = exatamente 20% de 20 kg: ainda não alerta.
const racaoLimite = makeFood({
  id: 3,
  name: 'Ração de filhote',
  balanceKg: 4,
  entryDate: '2026-11-05',
});
const racaoSemEstoque = makeFood({
  id: 4,
  name: 'Ração antiga',
  weightKg: 10,
  balanceKg: 0,
  entryDate: '2026-10-01',
});

const fixtures = [racaoCheia, racaoBaixa, racaoLimite, racaoSemEstoque];

function foodsPage(items: Food[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function renderPage(user: AuthUser) {
  vi.mocked(useAuth).mockReturnValue({ user } as ReturnType<typeof useAuth>);
  return render(
    <MemoryRouter>
      <FoodAdminPage />
    </MemoryRouter>,
  );
}

function setup(items: Food[] = fixtures) {
  vi.mocked(foodService.list).mockResolvedValue(foodsPage(items));
  vi.mocked(foodService.create).mockResolvedValue(racaoCheia);
}

function rowFor(name: string): HTMLElement {
  const row = screen.getByText(name).closest('tr');
  expect(row).not.toBeNull();
  return row as HTMLElement;
}

describe('FoodAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lista rações com peso, saldo, entrada e situação textual no limite do alerta', async () => {
    renderPage(adminUser);

    expect(await screen.findByText('Ração premium')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ração' })).toBeInTheDocument();

    const premium = rowFor('Ração premium');
    expect(within(premium).getByText('20 kg')).toBeInTheDocument();
    expect(within(premium).getByText('18 kg')).toBeInTheDocument();
    expect(within(premium).getByText('18/11/2026')).toBeInTheDocument();
    expect(within(premium).getByText('Suficiente')).toBeInTheDocument();

    const gato = rowFor('Ração de gato');
    expect(within(gato).getByText('3,5 kg')).toBeInTheDocument();
    expect(within(gato).getByText('Reposição')).toBeInTheDocument();

    const filhote = rowFor('Ração de filhote');
    expect(within(filhote).getByText('4 kg')).toBeInTheDocument();
    expect(within(filhote).getByText('Suficiente')).toBeInTheDocument();

    const antiga = rowFor('Ração antiga');
    expect(within(antiga).getByText('0 kg')).toBeInTheDocument();
    expect(within(antiga).getByText('Sem estoque')).toBeInTheDocument();
  });

  it('esconde "Registrar compra" para bolsista e mantém a lista', async () => {
    renderPage(bolsistaUser);

    await screen.findByText('Ração premium');
    expect(screen.queryByRole('button', { name: 'Registrar compra' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Registrar primeira compra' }),
    ).not.toBeInTheDocument();
  });

  it('mostra o estado vazio com CTA de compra para administração', async () => {
    vi.mocked(foodService.list).mockResolvedValue(foodsPage([]));
    renderPage(adminUser);

    expect(await screen.findByText('Nenhuma ração cadastrada ainda.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar primeira compra' }));

    expect(screen.getByRole('heading', { name: 'Registrar compra' })).toBeInTheDocument();
  });

  it('valida nome e peso antes de salvar', async () => {
    renderPage(adminUser);
    await screen.findByText('Ração premium');

    fireEvent.click(screen.getByRole('button', { name: 'Registrar compra' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar compra' }));

    expect(screen.getByText('Informe o nome da ração.')).toBeInTheDocument();
    expect(screen.getByText('Informe um peso maior que zero.')).toBeInTheDocument();
    expect(foodService.create).not.toHaveBeenCalled();
  });

  it('registra a compra, aceita vírgula no peso e recarrega a lista', async () => {
    renderPage(adminUser);
    await screen.findByText('Ração premium');
    expect(vi.mocked(foodService.list)).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Registrar compra' }));
    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: 'Ração de cães idosos' },
    });
    fireEvent.change(screen.getByLabelText(/Peso/i), { target: { value: '20,5' } });
    fireEvent.change(screen.getByLabelText(/Data/i), { target: { value: '2026-11-17' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar compra' }));

    await waitFor(() => {
      expect(foodService.create).toHaveBeenCalledWith({
        name: 'Ração de cães idosos',
        weightKg: 20.5,
        entryDate: '2026-11-17',
      });
    });
    await waitFor(() => {
      expect(vi.mocked(foodService.list)).toHaveBeenCalledTimes(2);
    });
    expect(
      screen.queryByRole('heading', { name: 'Registrar compra' }),
    ).not.toBeInTheDocument();
  });

  it('mostra erro de API ao falhar a compra', async () => {
    vi.mocked(foodService.create).mockRejectedValueOnce(
      new HttpError(422, 'Não foi possível registrar a compra', null),
    );
    renderPage(adminUser);
    await screen.findByText('Ração premium');

    fireEvent.click(screen.getByRole('button', { name: 'Registrar compra' }));
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Ração nova' } });
    fireEvent.change(screen.getByLabelText(/Peso/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar compra' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível registrar a compra',
    );
    expect(vi.mocked(foodService.list)).toHaveBeenCalledTimes(1);
  });
});
