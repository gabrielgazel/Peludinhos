import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import { mapShift, shiftService } from './shiftService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const apiShift = {
  shift_id: 12,
  member_id: 3,
  member_name: 'Maria Silva',
  started_at: '2026-11-17T10:00:00+00:00',
  ended_at: '2026-11-17T10:45:00+00:00',
  duration_minutes: 45,
  feeding_points: [
    {
      feeding_point_id: 1,
      name: 'Bloco A',
      building: 'ICED',
      description: 'Próximo ao portão',
      latitude: '-2.417000',
      longitude: '-54.721000',
      is_active: true,
    },
  ],
  notes: 'Turno da manhã',
};

const mappedShift = {
  id: 12,
  memberId: 3,
  memberName: 'Maria Silva',
  startedAt: '2026-11-17T10:00:00+00:00',
  endedAt: '2026-11-17T10:45:00+00:00',
  durationMinutes: 45,
  feedingPoints: [
    {
      id: 1,
      name: 'Bloco A',
      building: 'ICED',
      isActive: true,
    },
  ],
  notes: 'Turno da manhã',
};

describe('shiftService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mapeia shift snake_case para camelCase, duração e pontos resumidos', () => {
    expect(mapShift(apiShift)).toEqual(mappedShift);
  });

  it('current devolve null quando a API responde 204', async () => {
    vi.mocked(httpClient.get).mockResolvedValue(undefined);

    const result = await shiftService.current();

    expect(httpClient.get).toHaveBeenCalledWith('/shifts/current');
    expect(result).toBeNull();
  });

  it('current devolve o turno aberto mapeado', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ ...apiShift, ended_at: null });

    const result = await shiftService.current();

    expect(result?.id).toBe(12);
    expect(result?.endedAt).toBeNull();
    expect(result?.feedingPoints[0].name).toBe('Bloco A');
  });

  it('open envia pontos e observações em snake_case', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(apiShift);

    const result = await shiftService.open({
      feedingPointIds: [1, 2],
      notes: 'Turno da manhã',
    });

    expect(httpClient.post).toHaveBeenCalledWith('/shifts', {
      feeding_point_ids: [1, 2],
      notes: 'Turno da manhã',
    });
    expect(result.id).toBe(12);
  });

  it('open omite notes quando não informado', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(apiShift);

    await shiftService.open({ feedingPointIds: [1] });

    expect(httpClient.post).toHaveBeenCalledWith('/shifts', {
      feeding_point_ids: [1],
    });
  });

  it('close encerra o turno pelo id', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(apiShift);

    const result = await shiftService.close(12);

    expect(httpClient.post).toHaveBeenCalledWith('/shifts/12/end');
    expect(result.id).toBe(12);
  });

  it('list monta filtros, paginação e mapeia o histórico', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      items: [apiShift],
      total: 1,
      limit: 20,
      offset: 40,
    });

    const result = await shiftService.list({
      from: '2026-11-01',
      to: '2026-11-17',
      memberId: 3,
      limit: 20,
      offset: 40,
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      '/shifts?from=2026-11-01&to=2026-11-17&member_id=3&limit=20&offset=40',
    );
    expect(result.items).toEqual([mappedShift]);
    expect(result.total).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(40);
  });
});
