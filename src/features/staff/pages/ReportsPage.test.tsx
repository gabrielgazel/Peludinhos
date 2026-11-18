import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../auth/types/auth.types';
import { useAuth } from '../../auth/hooks/useAuth';
import { animalService } from '../../animals/services/animalService';
import type { Animal, AnimalStatus } from '../../animals/types/animal.types';
import {
  feedingPointService,
  type FeedingPoint,
  type FeedingPointAnimal,
} from '../services/feedingPointService';
import { foodService, type Food, type FoodMovement } from '../services/foodService';
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

const adminUser: AuthUser = {
  id: 'user-admin-1',
  email: 'admin@peludinhos.example',
  name: 'Maria Silva',
  actorType: 'membro',
  role: 'administrador',
  memberId: 42,
  visitorId: null,
};

function makeAnimal(id: number, name: string, status: AnimalStatus): Animal {
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
    createdAt: null,
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
    movementDate: '2026-11-01',
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

// Compra e fim não entram no consumo; só as três movimentações de consumo somam 11,5 kg.
const movimentacoes = [
  makeMovement({ id: 1, foodId: 1, kind: 'compra', quantityKg: 20, movementDate: '2026-11-01' }),
  makeMovement({ id: 2, foodId: 1, kind: 'consumo', quantityKg: 5, movementDate: '2026-11-05' }),
  makeMovement({ id: 3, foodId: 1, kind: 'consumo', quantityKg: 2.5, movementDate: '2026-11-12' }),
  makeMovement({ id: 4, foodId: 2, kind: 'consumo', quantityKg: 4, movementDate: '2026-10-20' }),
  makeMovement({ id: 5, foodId: 2, kind: 'fim', quantityKg: 3, movementDate: '2026-11-15' }),
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
  vi.mocked(foodService.listAllMovements).mockResolvedValue(pageOf(movimentacoes));
}

function rowText(region: HTMLElement, label: string): string {
  const row = within(region)
    .getAllByRole('listitem')
    .find((item) => item.textContent?.includes(label));
  if (!row) throw new Error(`linha "${label}" não encontrada`);
  return (row.textContent ?? '').replace(/\s+/g, ' ').trim();
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
    expect(rowText(region, 'novembro de 2026')).toContain('7,5 kg');
    expect(rowText(region, 'outubro de 2026')).toContain('4 kg');

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
      await within(pointsRegion).findAllByText('Nenhum animal vinculado.'),
    ).toHaveLength(2);
    expect(rowText(pointsRegion, 'Bloco A')).toContain('0 animais');

    const foodRegion = await screen.findByRole('region', { name: /Consumo de ração/i });
    expect(await within(foodRegion).findByText('Nenhum consumo no período.')).toBeInTheDocument();
  });
});
