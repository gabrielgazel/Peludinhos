import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../../shared/api/httpsClient';
import {
  feedingPointService,
  type FeedingPoint,
} from '../services/feedingPointService';
import { shiftService, type Shift } from '../services/shiftService';
import { ShiftPage } from './ShiftPage';

vi.mock('../services/shiftService', () => ({
  shiftService: {
    current: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    list: vi.fn(),
  },
}));

vi.mock('../services/feedingPointService', () => ({
  feedingPointService: {
    list: vi.fn(),
  },
}));

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

function makeShift(partial: Partial<Shift> & { id: number }): Shift {
  return {
    memberId: 3,
    memberName: 'Maria Silva',
    startedAt: '2026-11-17T10:00:00',
    endedAt: null,
    durationMinutes: 45,
    feedingPoints: [],
    notes: null,
    ...partial,
  };
}

const blocoA = makePoint({ id: 1, name: 'Bloco A', building: 'ICED' });
const biblioteca = makePoint({ id: 2, name: 'Biblioteca' });

const shiftAberto = makeShift({
  id: 12,
  startedAt: '2026-11-17T08:15:00',
  durationMinutes: 45,
  feedingPoints: [{ id: 1, name: 'Bloco A', building: 'ICED', isActive: true }],
  notes: 'Turno da manhã',
});

const shiftEncerrado = makeShift({
  id: 11,
  memberId: 4,
  memberName: 'João Pedro',
  startedAt: '2026-11-17T07:00:00',
  endedAt: '2026-11-17T09:15:00',
  durationMinutes: 135,
  feedingPoints: [{ id: 1, name: 'Bloco A', building: 'ICED', isActive: true }],
});

function pointsPage(items: FeedingPoint[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function historyPage(items: Shift[]) {
  return { items, total: items.length, limit: 200, offset: 0 };
}

function renderPage() {
  return render(<ShiftPage />);
}

describe('ShiftPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(shiftService.current).mockResolvedValue(null);
    vi.mocked(shiftService.list).mockResolvedValue(historyPage([]));
    vi.mocked(shiftService.open).mockResolvedValue(shiftAberto);
    vi.mocked(shiftService.close).mockResolvedValue(shiftEncerrado);
    vi.mocked(feedingPointService.list).mockResolvedValue(pointsPage([blocoA, biblioteca]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sem turno aberto mostra o formulário de início com os pontos', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Iniciar turno' }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText(/Bloco A/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Biblioteca/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Encerrar turno' })).not.toBeInTheDocument();
  });

  it('com turno aberto mostra início, pontos e o botão de encerrar', async () => {
    vi.mocked(shiftService.current).mockResolvedValue(shiftAberto);
    renderPage();

    expect(await screen.findByRole('button', { name: 'Encerrar turno' })).toBeInTheDocument();
    expect(screen.getByText(/Iniciado em/)).toBeInTheDocument();
    expect(screen.getByText('Turno da manhã')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Iniciar turno' })).not.toBeInTheDocument();
  });

  it('inicia o turno com os pontos e a observação informados', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Iniciar turno' });
    fireEvent.click(await screen.findByLabelText(/Bloco A/));
    fireEvent.change(screen.getByLabelText(/Observação/), {
      target: { value: 'Turno da manhã' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar turno' }));

    await waitFor(() => {
      expect(shiftService.open).toHaveBeenCalledWith({
        feedingPointIds: [1],
        notes: 'Turno da manhã',
      });
    });
    expect(await screen.findByRole('button', { name: 'Encerrar turno' })).toBeInTheDocument();
  });

  it('mostra a mensagem 409 ao tentar iniciar outro turno com um aberto', async () => {
    vi.mocked(shiftService.open).mockRejectedValueOnce(
      new HttpError(409, 'Encerre o turno atual antes de abrir outro', null),
    );
    renderPage();

    await screen.findByRole('heading', { name: 'Iniciar turno' });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar turno' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Encerre o turno atual antes de abrir outro',
    );
  });

  it('encerra o turno após confirmação e atualiza a tela', async () => {
    vi.mocked(shiftService.current).mockResolvedValue(shiftAberto);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Encerrar turno' }));
    expect(screen.getByText('Encerrar o turno agora?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar encerramento' }));

    await waitFor(() => {
      expect(shiftService.close).toHaveBeenCalledWith(12);
    });
    expect(
      await screen.findByRole('heading', { name: 'Iniciar turno' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Encerrar turno' })).not.toBeInTheDocument();
  });

  it('mostra o histórico com voluntário, data, pontos e duração legível', async () => {
    vi.mocked(shiftService.list).mockResolvedValue(historyPage([shiftEncerrado]));
    renderPage();

    const history = await screen.findByRole('region', { name: 'Histórico' });
    expect(within(history).getByText('João Pedro')).toBeInTheDocument();
    expect(within(history).getByText(/17\/11\/2026/)).toBeInTheDocument();
    expect(within(history).getByText(/2 h 15 min/)).toBeInTheDocument();
    expect(within(history).getByText('Bloco A')).toBeInTheDocument();
  });

  it('recarrega o histórico ao trocar o período para 30 dias', async () => {
    renderPage();

    await waitFor(() => {
      expect(shiftService.list).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Período'), { target: { value: '30' } });

    await waitFor(() => {
      expect(shiftService.list).toHaveBeenCalledTimes(2);
    });
    const lastParams = vi.mocked(shiftService.list).mock.calls[1][0];
    expect(lastParams?.limit).toBe(200);
    expect(lastParams?.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(lastParams?.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
