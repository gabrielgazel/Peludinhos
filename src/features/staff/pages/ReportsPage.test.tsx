import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../auth/types/auth.types';
import { useAuth } from '../../auth/hooks/useAuth';
import { animalService } from '../../animals/services/animalService';
import type { Animal, AnimalStatus } from '../../animals/types/animal.types';
import { formatKg } from '../../../shared/utils/format';
import {
  feedingPointService,
  type FeedingPoint,
  type FeedingPointAnimal,
} from '../services/feedingPointService';
import { foodService, type Food, type FoodMovement } from '../services/foodService';
import { downloadCsv } from '../utils/csv';
import { ReportsPage } from './ReportsPage';

vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../animals/services/animalService', () => ({
  animalService: { list: vi.fn() },
}));
vi.mock('../services/feedingPointService', () => ({
  feedingPointService: { list: vi.fn(), listAnimals: vi.fn() },
}));
vi.mock('../services/foodService', () => ({
  foodService: { list: vi.fn(), listAllMovements: vi.fn() },
}));
// Mantém o gerador puro real e substitui só o efeito de download no navegador.
vi.mock('../utils/csv', async (importActual) => {
  const actual = await importActual<typeof import('../utils/csv')>();
  return { ...actual, downloadCsv: vi.fn() };
});

const adminUser: AuthUser = {
  id: 'user-admin-1',
  email: 'admin@peludinhos.example',
  name: 'Maria Silva',
  actorType: 'membro',
  role: 'administrador',
  memberId: 42,
  visitorId: null,
};

/** Data local relativa a hoje, para os testes não dependerem do relógio. */
function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthLabelOf(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}

function makeAnimal(
  id: number,
  name: string,
  status: AnimalStatus,
  createdAt: string | null = null,
): Animal {
  return {
    id,
    name,
    sex: 'F',
    colorDescription: null,
    age: null,
    isNeutered: false,
    status,
    behavior: null,
    notes: null,
    isDeceased: false,
    photoUrl: null,
    createdAt,
    updatedAt: null,
  };
}

function makePoint(id: number, name: string): FeedingPoint {
  return {
    id,
    name,
    building: null,
    description: null,
    latitude: null,
    longitude: null,
    isActive: true,
    createdAt: null,
    updatedAt: null,
  };
}

function makeLinkedAnimal(animalId: number, name: string): FeedingPointAnimal {
  return { animalId, name, status: 'disponivel' };
}

function makeFood(id: number, name: string): Food {
  return {
    id,
    name,
    weightKg: 20,
    entryDate: '2026-10-01',
    balanceKg: 10,
    createdAt: null,
    updatedAt: null,
  };
}

function makeMovement(
  partial: Partial<FoodMovement> & { id: number; foodId: number; kind: FoodMovement['kind'] },
): FoodMovement {
  return {
    quantityKg: 0,
    movementDate: isoDaysAgo(0),
    feedingPointId: null,
    memberId: 42,
    memberName: 'Maria Silva',
    notes: null,
    createdAt: null,
    ...partial,
  };
}

const animals = [
  makeAnimal(1, 'Mel', 'disponivel'),
  makeAnimal(2, 'Thor', 'disponivel'),
  makeAnimal(3, 'Nina', 'disponivel'),
  makeAnimal(4, 'Bidu', 'em_processo'),
  makeAnimal(5, 'Luna', 'adotado'),
  makeAnimal(6, 'Toby', 'indisponivel'),
];

const pontos = [makePoint(1, 'Bloco A'), makePoint(2, 'Biblioteca')];

// Compra e fim não entram no consumo; as três movimentações de consumo somam 11,5 kg.
const movimentacoes = [
  makeMovement({ id: 1, foodId: 1, kind: 'compra', quantityKg: 20, movementDate: isoDaysAgo(17) }),
  makeMovement({ id: 2, foodId: 1, kind: 'consumo', quantityKg: 5, movementDate: isoDaysAgo(13) }),
  makeMovement({ id: 3, foodId: 1, kind: 'consumo', quantityKg: 2.5, movementDate: isoDaysAgo(6) }),
  makeMovement({ id: 4, foodId: 2, kind: 'consumo', quantityKg: 4, movementDate: isoDaysAgo(29) }),
  makeMovement({ id: 5, foodId: 2, kind: 'fim', quantityKg: 3, movementDate: isoDaysAgo(3) }),
];

const racoes = [makeFood(1, 'Ração premium'), makeFood(2, 'Ração de gato')];

function pageOf<T>(items: T[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function renderPage() {
  vi.mocked(useAuth).mockReturnValue({ user: adminUser } as ReturnType<typeof useAuth>);
  return render(
    <MemoryRouter>
      <ReportsPage />
    </MemoryRouter>,
  );
}

function setup() {
  vi.mocked(animalService.list).mockResolvedValue(pageOf(animals));
  vi.mocked(feedingPointService.list).mockResolvedValue(pageOf(pontos));
  vi.mocked(feedingPointService.listAnimals).mockImplementation(async (id: number) =>
    id === 1
      ? [
          makeLinkedAnimal(1, 'Mel'),
          makeLinkedAnimal(2, 'Thor'),
          makeLinkedAnimal(3, 'Nina'),
        ]
      : [makeLinkedAnimal(1, 'Mel')],
  );
  vi.mocked(foodService.list).mockResolvedValue(pageOf(racoes));
  // A API filtra por data; o mock reproduz isso para o teste provar que trocar
  // o período muda os números, e não apenas os parâmetros da chamada.
  vi.mocked(foodService.listAllMovements).mockImplementation(async (params) => ({
    items: movimentacoes.filter((movement) => {
      if (params?.from && movement.movementDate < params.from) return false;
      if (params?.to && movement.movementDate > params.to) return false;
      return true;
    }),
    total: movimentacoes.length,
    limit: 200,
    offset: 0,
  }));
}

function rowText(region: HTMLElement, label: string): string {
  const row = within(region)
    .getAllByRole('listitem')
    .find((item) => item.textContent?.includes(label));
  if (!row) throw new Error(`linha "${label}" não encontrada`);
  return (row.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function lastMovementParams() {
  const params = vi.mocked(foodService.listAllMovements).mock.calls.at(-1)?.[0];
  if (!params) throw new Error('listAllMovements não foi chamado');
  return params;
}

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('conta animais por status com total em destaque', async () => {
    renderPage();
    const region = await screen.findByRole('region', { name: /Animais por status/i });

    expect(await within(region).findByText('6 animais')).toBeInTheDocument();
    expect(rowText(region, 'Disponível')).toContain('3');
    expect(rowText(region, 'Em processo')).toContain('1');
    expect(rowText(region, 'Adotado')).toContain('1');
    expect(rowText(region, 'Indisponível')).toContain('1');
  });

  it('conta animais vinculados por ponto com lista nominal curta', async () => {
    renderPage();
    const region = await screen.findByRole('region', { name: /Animais por ponto/i });

    expect(await within(region).findByText('4 vínculos')).toBeInTheDocument();
    expect(rowText(region, 'Bloco A')).toContain('Mel, Thor, Nina');
    expect(rowText(region, 'Biblioteca')).toContain('Mel');
    expect(vi.mocked(feedingPointService.listAnimals)).toHaveBeenCalledWith(1);
    expect(vi.mocked(feedingPointService.listAnimals)).toHaveBeenCalledWith(2);
  });

  it('soma o consumo por ração e por mês, ignorando compra e fim', async () => {
    renderPage();
    const region = await screen.findByRole('region', { name: /Consumo de ração/i });

    expect(await within(region).findByText('11,5 kg')).toBeInTheDocument();
    expect(rowText(region, 'Ração premium')).toContain('7,5 kg');
    expect(rowText(region, 'Ração de gato')).toContain('4 kg');

    const expectedByMonth = new Map<string, number>();
    for (const movement of movimentacoes.filter((item) => item.kind === 'consumo')) {
      const month = movement.movementDate.slice(0, 7);
      expectedByMonth.set(month, (expectedByMonth.get(month) ?? 0) + movement.quantityKg);
    }
    for (const [month, kg] of expectedByMonth) {
      expect(rowText(region, monthLabelOf(`${month}-01`))).toContain(formatKg(kg));
    }

    const [options] = vi.mocked(foodService.listAllMovements).mock.calls[0];
    expect(options?.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(options?.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(options?.limit).toBe(200);
  });

  it('mantém os outros relatórios quando um deles falha', async () => {
    vi.mocked(animalService.list).mockRejectedValue(new Error('Falha ao carregar animais.'));

    renderPage();

    const statusRegion = await screen.findByRole('region', { name: /Animais por status/i });
    expect(await within(statusRegion).findByRole('alert')).toHaveTextContent(
      'Falha ao carregar animais.',
    );

    const pointsRegion = await screen.findByRole('region', { name: /Animais por ponto/i });
    expect(await within(pointsRegion).findByText('4 vínculos')).toBeInTheDocument();

    const foodRegion = await screen.findByRole('region', { name: /Consumo de ração/i });
    expect(await within(foodRegion).findByText('11,5 kg')).toBeInTheDocument();
  });

  it('mostra estados vazios específicos por relatório', async () => {
    vi.mocked(animalService.list).mockResolvedValue(pageOf([]));
    vi.mocked(feedingPointService.list).mockResolvedValue(pageOf(pontos));
    vi.mocked(feedingPointService.listAnimals).mockResolvedValue([]);
    vi.mocked(foodService.listAllMovements).mockResolvedValue(pageOf([]));

    renderPage();

    const statusRegion = await screen.findByRole('region', { name: /Animais por status/i });
    expect(await within(statusRegion).findByText('Nenhum animal cadastrado.')).toBeInTheDocument();

    const pointsRegion = await screen.findByRole('region', { name: /Animais por ponto/i });
    expect(
      await within(pointsRegion).findByText('Nenhum animal vinculado no período.'),
    ).toBeInTheDocument();

    const foodRegion = await screen.findByRole('region', { name: /Consumo de ração/i });
    expect(await within(foodRegion).findByText('Nenhum consumo no período.')).toBeInTheDocument();
  });

  it('usa 30 dias por padrão no filtro de período', async () => {
    renderPage();

    expect(await screen.findByRole('combobox', { name: 'Período' })).toHaveValue('30');
    const foodRegion = await screen.findByRole('region', { name: /Consumo de ração/i });
    await within(foodRegion).findByText('11,5 kg');

    const [options] = vi.mocked(foodService.listAllMovements).mock.calls[0];
    expect(options?.from).toBe(isoDaysAgo(29));
    expect(options?.to).toBe(isoDaysAgo(0));
  });

  it('trocar o período recalcula os números do consumo', async () => {
    renderPage();
    const foodRegion = await screen.findByRole('region', { name: /Consumo de ração/i });
    await within(foodRegion).findByText('11,5 kg');

    fireEvent.change(screen.getByRole('combobox', { name: 'Período' }), {
      target: { value: '7' },
    });

    await waitFor(() => {
      expect(rowText(foodRegion, 'Ração premium')).toContain('2,5 kg');
    });
    expect(lastMovementParams().from).toBe(isoDaysAgo(6));
    expect(lastMovementParams().to).toBe(isoDaysAgo(0));
  });

  it('aplica intervalo personalizado nos relatórios 2 e 3', async () => {
    renderPage();
    await screen.findByText('11,5 kg');

    fireEvent.change(screen.getByRole('combobox', { name: 'Período' }), {
      target: { value: 'custom' },
    });
    fireEvent.change(await screen.findByLabelText('Data inicial'), {
      target: { value: isoDaysAgo(6) },
    });
    fireEvent.change(await screen.findByLabelText('Data final'), {
      target: { value: isoDaysAgo(0) },
    });

    await waitFor(() => {
      expect(lastMovementParams().from).toBe(isoDaysAgo(6));
      expect(lastMovementParams().to).toBe(isoDaysAgo(0));
    });
    const foodRegion = screen.getByRole('region', { name: /Consumo de ração/i });
    expect(rowText(foodRegion, 'Ração premium')).toContain('2,5 kg');
  });

  it('rejeita intervalo invertido sem recarregar os relatórios', async () => {
    renderPage();
    await screen.findByText('11,5 kg');
    const callsBefore = vi.mocked(foodService.listAllMovements).mock.calls.length;

    fireEvent.change(screen.getByRole('combobox', { name: 'Período' }), {
      target: { value: 'custom' },
    });
    fireEvent.change(await screen.findByLabelText('Data inicial'), {
      target: { value: isoDaysAgo(1) },
    });
    fireEvent.change(await screen.findByLabelText('Data final'), {
      target: { value: isoDaysAgo(5) },
    });

    expect(
      await screen.findByText('A data inicial não pode ser posterior à data final.'),
    ).toBeInTheDocument();
    expect(vi.mocked(foodService.listAllMovements).mock.calls).toHaveLength(callsBefore);
  });

  it('filtra os vínculos do relatório 2 por data de criação do animal', async () => {
    vi.mocked(animalService.list).mockResolvedValue(
      pageOf([
        makeAnimal(1, 'Mel', 'disponivel', isoDaysAgo(5)),
        makeAnimal(2, 'Thor', 'disponivel', isoDaysAgo(40)),
        makeAnimal(3, 'Nina', 'disponivel', isoDaysAgo(2)),
      ]),
    );

    renderPage();
    const region = await screen.findByRole('region', { name: /Animais por ponto/i });

    expect(await within(region).findByText('3 vínculos')).toBeInTheDocument();
    expect(rowText(region, 'Bloco A')).toContain('Mel, Nina');
    expect(rowText(region, 'Bloco A')).not.toContain('Thor');
    expect(within(region).getByText(/criados entre/)).toBeInTheDocument();
  });

  it('mostra vazio específico quando o período exclui todos os vínculos', async () => {
    vi.mocked(animalService.list).mockResolvedValue(
      pageOf([
        makeAnimal(1, 'Mel', 'disponivel', isoDaysAgo(40)),
        makeAnimal(2, 'Thor', 'disponivel', isoDaysAgo(40)),
        makeAnimal(3, 'Nina', 'disponivel', isoDaysAgo(40)),
      ]),
    );

    renderPage();
    const region = await screen.findByRole('region', { name: /Animais por ponto/i });

    expect(
      await within(region).findByText('Nenhum animal vinculado no período.'),
    ).toBeInTheDocument();
  });

  it('exporta CSV do painel de status com BOM, cabeçalho e nome com data', async () => {
    renderPage();
    const region = await screen.findByRole('region', { name: /Animais por status/i });
    await within(region).findByText('6 animais');

    fireEvent.click(within(region).getByRole('button', { name: /Exportar CSV/i }));

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [filename, content] = vi.mocked(downloadCsv).mock.calls[0];
    expect(filename).toMatch(/^relatorio-animais-por-status-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(content.startsWith('\uFEFF')).toBe(true);
    expect(content).toContain('Status;Quantidade');
    expect(content).toContain('Disponível;3');
    expect(content).toContain('\r\n');
  });

  it('exporta CSV do consumo com seções de ração, mês e total', async () => {
    renderPage();
    const region = await screen.findByRole('region', { name: /Consumo de ração/i });
    await within(region).findByText('11,5 kg');

    fireEvent.click(within(region).getByRole('button', { name: /Exportar CSV/i }));

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [filename, content] = vi.mocked(downloadCsv).mock.calls[0];
    expect(filename).toContain('consumo-racao');
    expect(content).toContain('Tipo;Item;Consumo (kg)');
    expect(content).toContain('Ração;Ração premium;7,5');
    expect(content).toContain('Total;;11,5');
  });
});
