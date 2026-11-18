import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../auth/types/auth.types';
import { useAuth } from '../../auth/hooks/useAuth';
import { HttpError } from '../../../shared/api/httpsClient';
import { foodService, type Food, type FoodMovement } from '../services/foodService';
import { feedingPointService, type FeedingPoint } from '../services/feedingPointService';
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
vi.mock('../services/feedingPointService', () => ({
  feedingPointService: {
    list: vi.fn(),
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

const blocoA: FeedingPoint = {
  id: 3,
  name: 'Bloco A',
  building: 'Bloco A',
  description: null,
  latitude: null,
  longitude: null,
  isActive: true,
  createdAt: null,
  updatedAt: null,
};

function makeMovement(
  partial: Partial<FoodMovement> & { id: number; kind: FoodMovement['kind'] },
): FoodMovement {
  return {
    foodId: 1,
    quantityKg: 5,
    movementDate: '2026-11-18',
    feedingPointId: null,
    memberId: 42,
    memberName: 'Maria Silva',
    notes: null,
    createdAt: '2026-11-18T12:00:00Z',
    ...partial,
  };
}

// Histórico completo do fluxo de aceite: compra → consumo → fim.
const historico = [
  makeMovement({ id: 1, kind: 'compra', quantityKg: 20, notes: 'Compra inicial' }),
  makeMovement({
    id: 2,
    kind: 'consumo',
    quantityKg: 5,
    feedingPointId: blocoA.id,
    notes: 'Turno da tarde',
  }),
  makeMovement({ id: 3, kind: 'fim', quantityKg: 15, notes: 'Ração encerrada' }),
];

function movementsPage(items: FoodMovement[]) {
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
  vi.mocked(foodService.listMovements).mockResolvedValue(movementsPage(historico));
  vi.mocked(foodService.createMovement).mockResolvedValue(historico[1]);
  vi.mocked(feedingPointService.list).mockResolvedValue({
    items: [blocoA],
    total: 1,
    limit: 200,
    offset: 0,
  });
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

  it('registra consumo com ponto opcional, reduz o saldo na lista e recarrega o histórico', async () => {
    renderPage(adminUser);
    await screen.findByText('Ração premium');
    expect(vi.mocked(foodService.list)).toHaveBeenCalledTimes(1);

    fireEvent.click(
      within(rowFor('Ração premium')).getByRole('button', { name: 'Registrar consumo' }),
    );
    expect(screen.getByRole('heading', { name: 'Registrar consumo' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Data/i), { target: { value: '2026-11-18' } });
    const ponto = screen.getByLabelText(/Ponto/i);
    await waitFor(() => {
      expect(within(ponto).getByRole('option', { name: 'Bloco A' })).toBeInTheDocument();
    });
    fireEvent.change(ponto, { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Observação/i), {
      target: { value: 'Turno da tarde' },
    });

    vi.mocked(foodService.list).mockResolvedValue(
      foodsPage(
        fixtures.map((food) => (food.id === 1 ? { ...food, balanceKg: 15 } : food)),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salvar consumo' }));

    await waitFor(() => {
      expect(foodService.createMovement).toHaveBeenCalledWith(1, {
        kind: 'consumo',
        quantityKg: 5,
        movementDate: '2026-11-18',
        feedingPointId: 3,
        notes: 'Turno da tarde',
      });
    });
    await waitFor(() => {
      expect(vi.mocked(foodService.list)).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(within(rowFor('Ração premium')).getByText('15 kg')).toBeInTheDocument();
    });
    expect(vi.mocked(foodService.listMovements)).toHaveBeenCalled();
  });

  it('mostra a mensagem da API sem reformatar quando o estoque é insuficiente', async () => {
    vi.mocked(foodService.createMovement).mockRejectedValueOnce(
      new HttpError(422, 'Estoque insuficiente: saldo atual de 15.00 kg', null),
    );
    renderPage(adminUser);
    await screen.findByText('Ração premium');

    fireEvent.click(
      within(rowFor('Ração premium')).getByRole('button', { name: 'Registrar consumo' }),
    );
    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar consumo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Estoque insuficiente: saldo atual de 15.00 kg',
    );
    expect(vi.mocked(foodService.list)).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Registrar consumo' })).toBeInTheDocument();
  });

  it('encerra a ração após confirmação e zera o saldo', async () => {
    renderPage(adminUser);
    await screen.findByText('Ração premium');

    // Sem estoque, não há o que encerrar.
    expect(
      within(rowFor('Ração antiga')).queryByRole('button', { name: 'Encerrar ração' }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(rowFor('Ração premium')).getByRole('button', { name: 'Encerrar ração' }),
    );
    expect(
      screen.getByText('Encerrar a ração Ração premium? Esta ação não pode ser desfeita.'),
    ).toBeInTheDocument();
    expect(foodService.createMovement).not.toHaveBeenCalled();

    vi.mocked(foodService.list).mockResolvedValue(
      foodsPage(
        fixtures.map((food) => (food.id === 1 ? { ...food, balanceKg: 0 } : food)),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar encerramento' }));

    await waitFor(() => {
      expect(foodService.createMovement).toHaveBeenCalledWith(1, {
        kind: 'fim',
        quantityKg: 18,
        movementDate: expect.any(String),
      });
    });
    await waitFor(() => {
      expect(vi.mocked(foodService.list)).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(within(rowFor('Ração premium')).getByText('0 kg')).toBeInTheDocument();
    });
    expect(within(rowFor('Ração premium')).getByText('Sem estoque')).toBeInTheDocument();
  });

  it('mostra histórico com tipo, kg, data, ponto, autor e observação', async () => {
    renderPage(adminUser);
    await screen.findByText('Ração premium');

    fireEvent.click(within(rowFor('Ração premium')).getByRole('button', { name: 'Histórico' }));

    expect(
      await screen.findByRole('heading', { name: 'Histórico de movimentações' }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(foodService.listMovements).toHaveBeenCalledWith(1, { limit: 200 });
    });

    const history = screen.getByRole('region', { name: /Histórico de movimentações/i });
    expect(within(history).getAllByRole('row')).toHaveLength(4); // cabeçalho + 3 linhas
    expect(within(history).getByText('Compra')).toBeInTheDocument();
    expect(within(history).getByText('Consumo')).toBeInTheDocument();
    expect(within(history).getByText('Fim')).toBeInTheDocument();
    expect(within(history).getByText('20 kg')).toBeInTheDocument();
    expect(within(history).getByText('5 kg')).toBeInTheDocument();
    expect(within(history).getByText('15 kg')).toBeInTheDocument();
    expect(within(history).getAllByText('18/11/2026')).toHaveLength(3);
    expect(within(history).getByText('Bloco A')).toBeInTheDocument();
    expect(within(history).getAllByText('Maria Silva')).toHaveLength(3);
    expect(within(history).getByText('Turno da tarde')).toBeInTheDocument();
  });
});
