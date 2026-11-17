import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../../auth/types/auth.types';
import { useAuth } from '../../auth/hooks/useAuth';
import { HttpError } from '../../../shared/api/httpsClient';
import {
  feedingPointService,
  type FeedingPoint,
  type FeedingPointAnimal,
} from '../services/feedingPointService';
import { FeedingPointsAdminPage } from './FeedingPointsAdminPage';

vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/feedingPointService', () => ({
  feedingPointService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listAnimals: vi.fn(),
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

function makePoint(partial: Partial<FeedingPoint> & { id: number; name: string }): FeedingPoint {
  return {
    building: null,
    description: null,
    latitude: null,
    longitude: null,
    isActive: true,
    createdAt: null,
    updatedAt: null,
    ...partial,
  };
}

const pontoA = makePoint({ id: 1, name: 'Bloco A', building: 'Prédio Central', isActive: true });
const pontoB = makePoint({ id: 2, name: 'Biblioteca', building: 'Anexo', isActive: false });
const fixtures = [pontoA, pontoB];

function page(items: FeedingPoint[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function renderPage(user: AuthUser) {
  vi.mocked(useAuth).mockReturnValue({ user } as ReturnType<typeof useAuth>);
  return render(
    <MemoryRouter>
      <FeedingPointsAdminPage />
    </MemoryRouter>,
  );
}

function setupList(items: FeedingPoint[] = fixtures) {
  vi.mocked(feedingPointService.list).mockResolvedValue(page(items));
  vi.mocked(feedingPointService.listAnimals).mockImplementation(async (id: number) => {
    const byId: Record<number, FeedingPointAnimal[]> = {
      1: [
        { animalId: 10, name: 'Mel', status: 'disponivel' },
        { animalId: 11, name: 'Thor', status: 'adotado' },
      ],
      2: [],
    };
    return byId[id] ?? [];
  });
  vi.mocked(feedingPointService.create).mockResolvedValue(
    makePoint({ id: 3, name: 'Novo ponto', building: 'ICED', isActive: true }),
  );
}

describe('FeedingPointsAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupList();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza a lista de pontos com prédio, status e animais vinculados', async () => {
    renderPage(adminUser);

    expect(await screen.findByText('Bloco A')).toBeInTheDocument();
    expect(screen.getByText('Biblioteca')).toBeInTheDocument();
    expect(screen.getByText('Prédio Central')).toBeInTheDocument();
    expect(screen.getByText('Anexo')).toBeInTheDocument();

    expect(await screen.findByText('2 animais')).toBeInTheDocument();
    expect(screen.getByText('0 animais')).toBeInTheDocument();

    expect(within(screen.getByRole('table')).getByText('Ativo')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Inativo')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Pontos de alimentação' })).toBeInTheDocument();
  });

  it('cria um ponto e recarrega a lista', async () => {
    renderPage(adminUser);

    await screen.findByText('Bloco A');
    expect(vi.mocked(feedingPointService.list)).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Novo ponto/ }));

    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Novo ponto' } });
    fireEvent.change(screen.getByLabelText(/Prédio/i), { target: { value: 'ICED' } });
    fireEvent.change(screen.getByLabelText(/Descrição/i), { target: { value: 'Perto da entrada' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(feedingPointService.create).toHaveBeenCalledWith({
        name: 'Novo ponto',
        building: 'ICED',
        description: 'Perto da entrada',
        latitude: null,
        longitude: null,
        isActive: true,
      });
    });

    await waitFor(() => {
      expect(vi.mocked(feedingPointService.list)).toHaveBeenCalledTimes(2);
    });
  });

  it('mostra erro de API ao falhar ao criar ponto', async () => {
    vi.mocked(feedingPointService.create).mockRejectedValueOnce(
      new HttpError(409, 'Já existe um ponto de alimentação com esse nome', null),
    );
    renderPage(adminUser);

    await screen.findByText('Bloco A');
    fireEvent.click(screen.getByRole('button', { name: /Novo ponto/ }));
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Duplicado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Já existe um ponto de alimentação com esse nome',
    );
  });

  it('esconde "Novo ponto" e ações de edição para bolsista', async () => {
    renderPage(bolsistaUser);

    await screen.findByText('Bloco A');
    expect(screen.queryByRole('button', { name: /Novo ponto/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pontos de alimentação' })).toBeInTheDocument();
  });
});
