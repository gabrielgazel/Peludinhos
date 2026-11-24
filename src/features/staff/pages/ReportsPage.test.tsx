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
import {
  reportService,
  type OccurrencesByMonth,
  type SupplyConsumption,
  type SupplyKind,
} from '../services/reportService';
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
vi.mock('../services/reportService', () => ({
  reportService: { getOccurrencesByMonth: vi.fn(), getSupplyConsumption: vi.fn() },
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

// Mês atual com duas ocorrências recentes e mês de 35 dias atrás com uma;
// o item antigo fica na fronteira do período padrão de 30 dias.
const ocorrencias: OccurrencesByMonth = {
  total: 3,
  months: [
    {
      month: isoDaysAgo(0).slice(0, 7),
      total: 2,
      items: [
        {
          id: 1,
          animalId: 1,
          animalName: 'Mel',
          description: 'Vacina aplicada',
          eventDate: isoDaysAgo(0),
          memberName: 'Maria Silva',
        },
        {
          id: 2,
          animalId: 2,
          animalName: 'Thor',
          description: 'Visita de rotina',
          eventDate: isoDaysAgo(1),
          memberName: 'Maria Silva',
        },
      ],
    },
    {
      month: isoDaysAgo(35).slice(0, 7),
      total: 1,
      items: [
        {
          id: 3,
          animalId: 3,
          animalName: 'Nina',
          description: 'Exame clínico',
          eventDate: isoDaysAgo(29),
          memberName: 'Maria Silva',
        },
      ],
    },
  ],
};

const medicamentos: SupplyConsumption = {
  kind: 'medication',
  from: isoDaysAgo(29),
  to: isoDaysAgo(0),
  totalQuantity: 8,
  items: [
    {
      supplyId: 1,
      name: 'Dipirona',
      type: 'medicamento',
      quantity: 8,
      unit: 'comprimidos',
      point: 'Bloco A',
      stockQuantity: 24,
    },
  ],
};

const produtos: SupplyConsumption = {
  kind: 'product',
  from: isoDaysAgo(29),
  to: isoDaysAgo(0),
  totalQuantity: 5,
  items: [
    {
      supplyId: 2,
      name: 'Papel higiênico',
      type: 'produto',
      quantity: 5,
      unit: 'unidades',
      point: 'Biblioteca',
      stockQuantity: 20,
    },
  ],
};

/** Data do movimento de cada insumo, para o mock recortar como a API faz. */
const supplyDate: Record<SupplyKind, string> = {
  medication: isoDaysAgo(20),
  product: isoDaysAgo(10),
};

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
  vi.mocked(reportService.getOccurrencesByMonth).mockImplementation(async ({ from, to }) => {
    const months = ocorrencias.months
      .map((month) => ({
        ...month,
        items: month.items.filter(
          (item) => (!from || item.eventDate >= from) && (!to || item.eventDate <= to),
        ),
      }))
      .filter((month) => month.items.length > 0)
      .map((month) => ({ ...month, total: month.items.length }));
    return { total: months.reduce((sum, month) => sum + month.total, 0), months };
  });
  vi.mocked(reportService.getSupplyConsumption).mockImplementation(async ({ kind, from, to }) => {
    const report = kind === 'medication' ? medicamentos : produtos;
    const outside = (from && supplyDate[kind] < from) || (to && supplyDate[kind] > to);
    if (outside) return { ...report, from, to, totalQuantity: 0, items: [] };
    return { ...report, from, to };
  });
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

function lastOccurrenceParams() {
  const params = vi.mocked(reportService.getOccurrencesByMonth).mock.calls.at(-1)?.[0];
  if (!params) throw new Error('getOccurrencesByMonth não foi chamado');
  return params;
}

function lastSupplyParams(kind: SupplyKind) {
  const params = vi
    .mocked(reportService.getSupplyConsumption)
    .mock.calls.filter(([call]) => call.kind === kind)
    .at(-1)?.[0];
  if (!params) throw new Error(`getSupplyConsumption(${kind}) não foi chamado`);
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

  it('mostra os três relatórios novos com totais da API', async () => {
    renderPage();

    const occurrences = await screen.findByRole('region', { name: /Ocorrências mensais/i });
    expect(await within(occurrences).findByText('3 ocorrências')).toBeInTheDocument();
    expect(rowText(occurrences, monthLabelOf(isoDaysAgo(0)))).toContain('2 ocorrências');

    const medications = await screen.findByRole('region', { name: /Medicamentos/i });
    expect(await within(medications).findByText('1 item')).toBeInTheDocument();
    expect(rowText(medications, 'Dipirona')).toContain('8 comprimidos');

    const products = await screen.findByRole('region', { name: /Produtos/i });
    expect(await within(products).findByText('1 item')).toBeInTheDocument();
    expect(rowText(products, 'Papel higiênico')).toContain('5 unidades');

    expect(screen.queryByRole('region', { name: /Próximos relatórios/i })).not.toBeInTheDocument();
  });

  it('aplica o período padrão e recarrega os três ao trocar', async () => {
    renderPage();
    const occurrences = await screen.findByRole('region', { name: /Ocorrências mensais/i });
    await within(occurrences).findByText('3 ocorrências');

    expect(lastOccurrenceParams()).toEqual({ from: isoDaysAgo(29), to: isoDaysAgo(0) });
    expect(lastSupplyParams('medication')).toEqual({
      kind: 'medication',
      from: isoDaysAgo(29),
      to: isoDaysAgo(0),
    });
    expect(lastSupplyParams('product')).toEqual({
      kind: 'product',
      from: isoDaysAgo(29),
      to: isoDaysAgo(0),
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Período' }), {
      target: { value: '7' },
    });

    await waitFor(() => {
      expect(within(occurrences).queryByText(monthLabelOf(isoDaysAgo(35)))).not.toBeInTheDocument();
    });
    expect(lastOccurrenceParams()).toEqual({ from: isoDaysAgo(6), to: isoDaysAgo(0) });
    expect(lastSupplyParams('medication')).toEqual({
      kind: 'medication',
      from: isoDaysAgo(6),
      to: isoDaysAgo(0),
    });
    expect(lastSupplyParams('product')).toEqual({
      kind: 'product',
      from: isoDaysAgo(6),
      to: isoDaysAgo(0),
    });
  });

  it('propaga intervalo personalizado aos três', async () => {
    renderPage();
    const occurrences = await screen.findByRole('region', { name: /Ocorrências mensais/i });
    await within(occurrences).findByText('3 ocorrências');

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
      expect(lastOccurrenceParams()).toEqual({ from: isoDaysAgo(6), to: isoDaysAgo(0) });
      expect(lastSupplyParams('medication')).toMatchObject({
        from: isoDaysAgo(6),
        to: isoDaysAgo(0),
      });
      expect(lastSupplyParams('product')).toMatchObject({
        from: isoDaysAgo(6),
        to: isoDaysAgo(0),
      });
    });
    await waitFor(() => {
      expect(within(occurrences).queryByText(monthLabelOf(isoDaysAgo(35)))).not.toBeInTheDocument();
    });
  });

  it('não recarrega os novos painéis com intervalo invertido', async () => {
    renderPage();
    await screen.findByText('11,5 kg');
    await screen.findByText('3 ocorrências');
    const callsBefore = {
      occurrences: vi.mocked(reportService.getOccurrencesByMonth).mock.calls.length,
      medication: vi
        .mocked(reportService.getSupplyConsumption)
        .mock.calls.filter(([params]) => params.kind === 'medication').length,
      product: vi
        .mocked(reportService.getSupplyConsumption)
        .mock.calls.filter(([params]) => params.kind === 'product').length,
    };

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
    expect(vi.mocked(reportService.getOccurrencesByMonth).mock.calls).toHaveLength(
      callsBefore.occurrences,
    );
    expect(
      vi
        .mocked(reportService.getSupplyConsumption)
        .mock.calls.filter(([params]) => params.kind === 'medication'),
    ).toHaveLength(callsBefore.medication);
    expect(
      vi
        .mocked(reportService.getSupplyConsumption)
        .mock.calls.filter(([params]) => params.kind === 'product'),
    ).toHaveLength(callsBefore.product);
  });

  it('isolamento de erro por painel', async () => {
    vi.mocked(reportService.getOccurrencesByMonth).mockRejectedValue(
      new Error('Falha ao carregar ocorrências.'),
    );

    renderPage();

    const occurrences = await screen.findByRole('region', { name: /Ocorrências mensais/i });
    expect(await within(occurrences).findByRole('alert')).toHaveTextContent(
      'Falha ao carregar ocorrências.',
    );
    expect(within(occurrences).queryByText('3 ocorrências')).not.toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);

    const medications = await screen.findByRole('region', { name: /Medicamentos/i });
    expect(await within(medications).findByText('1 item')).toBeInTheDocument();
    const products = await screen.findByRole('region', { name: /Produtos/i });
    expect(await within(products).findByText('1 item')).toBeInTheDocument();
    expect(await screen.findByText('6 animais')).toBeInTheDocument();
    expect(await screen.findByText('4 vínculos')).toBeInTheDocument();
    expect(await screen.findByText('11,5 kg')).toBeInTheDocument();
  });

  it('estados vazios específicos dos novos painéis', async () => {
    vi.mocked(reportService.getOccurrencesByMonth).mockResolvedValue({ total: 0, months: [] });
    vi.mocked(reportService.getSupplyConsumption).mockImplementation(
      async ({ kind, from, to }) => ({ kind, from, to, totalQuantity: 0, items: [] }),
    );

    renderPage();

    const occurrences = await screen.findByRole('region', { name: /Ocorrências mensais/i });
    expect(
      await within(occurrences).findByText('Nenhuma ocorrência no período.'),
    ).toBeInTheDocument();
    const medications = await screen.findByRole('region', { name: /Medicamentos/i });
    expect(
      await within(medications).findByText('Nenhum medicamento consumido no período.'),
    ).toBeInTheDocument();
    const products = await screen.findByRole('region', { name: /Produtos/i });
    expect(
      await within(products).findByText('Nenhum produto consumido no período.'),
    ).toBeInTheDocument();
  });

  it('exporta CSV dos três painéis novos', async () => {
    renderPage();
    const occurrences = await screen.findByRole('region', { name: /Ocorrências mensais/i });
    await within(occurrences).findByText('3 ocorrências');

    fireEvent.click(within(occurrences).getByRole('button', { name: /Exportar CSV/i }));
    const medications = screen.getByRole('region', { name: /Medicamentos/i });
    fireEvent.click(within(medications).getByRole('button', { name: /Exportar CSV/i }));
    const products = screen.getByRole('region', { name: /Produtos/i });
    fireEvent.click(within(products).getByRole('button', { name: /Exportar CSV/i }));

    expect(downloadCsv).toHaveBeenCalledTimes(3);
    const [occurrencesFile, occurrencesCsv] = vi.mocked(downloadCsv).mock.calls[0];
    expect(occurrencesFile).toMatch(/^relatorio-ocorrencias-mensais-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(occurrencesCsv.startsWith('\uFEFF')).toBe(true);
    expect(occurrencesCsv).toContain('Mês;Data;Animal;Descrição;Autor');
    expect(occurrencesCsv).toContain('Vacina aplicada');
    expect(occurrencesCsv).toContain('\r\n');

    const [medicationsFile, medicationsCsv] = vi.mocked(downloadCsv).mock.calls[1];
    expect(medicationsFile).toMatch(/^relatorio-medicamentos-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(medicationsCsv).toContain('Item;Tipo;Consumo;Unidade;Ponto;Estoque atual');
    expect(medicationsCsv).toContain('Dipirona;medicamento;8;comprimidos;Bloco A;24');

    const [productsFile, productsCsv] = vi.mocked(downloadCsv).mock.calls[2];
    expect(productsFile).toMatch(/^relatorio-produtos-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(productsCsv).toContain('Papel higiênico;produto;5;unidades;Biblioteca;20');
  });

  it('não oferece exclusão nos novos painéis', async () => {
    renderPage();
    const regions = await Promise.all([
      screen.findByRole('region', { name: /Ocorrências mensais/i }),
      screen.findByRole('region', { name: /Medicamentos/i }),
      screen.findByRole('region', { name: /Produtos/i }),
    ]);

    for (const region of regions) {
      expect(within(region).queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument();
      expect(within(region).queryByRole('link', { name: /excluir/i })).not.toBeInTheDocument();
    }
  });
});
