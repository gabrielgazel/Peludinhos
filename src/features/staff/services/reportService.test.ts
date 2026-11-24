import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import {
  mapOccurrences,
  mapSupplyConsumption,
  reportService,
  type ApiOccurrencesResponse,
  type ApiSupplyConsumptionResponse,
} from './reportService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: { get: vi.fn() },
}));

const occurrencesRow: ApiOccurrencesResponse = {
  total: 2,
  months: [
    {
      month: '2026-11',
      total: 2,
      items: [
        {
          event_id: 11,
          animal_id: 1,
          animal_name: 'Mel',
          description: 'Vacina aplicada',
          event_date: '2026-11-05',
          member_name: 'Maria Silva',
        },
        {
          event_id: 12,
          animal_id: null,
          animal_name: null,
          description: 'Visita',
          event_date: '2026-11-06',
        },
      ],
    },
  ],
};

const supplyRow: ApiSupplyConsumptionResponse = {
  kind: 'medication',
  from: '2026-11-01',
  to: '2026-11-30',
  total_quantity: 8,
  items: [
    {
      supply_id: 1,
      name: 'Dipirona',
      type: 'analgésico',
      quantity: 8,
      unit: 'comprimidos',
      point: 'Canil',
      stock_quantity: 24,
    },
  ],
};

describe('reportService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapeia ocorrências para camelCase', () => {
    expect(mapOccurrences(occurrencesRow)).toEqual({
      total: 2,
      months: [
        {
          month: '2026-11',
          total: 2,
          items: [
            {
              id: 11,
              animalId: 1,
              animalName: 'Mel',
              description: 'Vacina aplicada',
              eventDate: '2026-11-05',
              memberName: 'Maria Silva',
            },
            {
              id: 12,
              animalId: null,
              animalName: null,
              description: 'Visita',
              eventDate: '2026-11-06',
              memberName: null,
            },
          ],
        },
      ],
    });
  });

  it('busca ocorrências com from e to', async () => {
    vi.mocked(httpClient.get).mockResolvedValue(occurrencesRow);

    const result = await reportService.getOccurrencesByMonth({
      from: '2026-11-01',
      to: '2026-11-30',
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      '/reports/occurrences-by-month?from=2026-11-01&to=2026-11-30',
    );
    expect(result).toEqual(mapOccurrences(occurrencesRow));
  });

  it('mapeia consumo de insumos', () => {
    expect(mapSupplyConsumption(supplyRow)).toEqual({
      kind: 'medication',
      from: '2026-11-01',
      to: '2026-11-30',
      totalQuantity: 8,
      items: [
        {
          supplyId: 1,
          name: 'Dipirona',
          type: 'analgésico',
          quantity: 8,
          unit: 'comprimidos',
          point: 'Canil',
          stockQuantity: 24,
        },
      ],
    });
  });

  it('busca consumo por tipo com query ordenada', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ ...supplyRow, kind: 'product' });

    const result = await reportService.getSupplyConsumption({
      kind: 'product',
      from: '2026-11-01',
      to: '2026-11-30',
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      '/reports/supply-consumption?kind=product&from=2026-11-01&to=2026-11-30',
    );
    expect(result).toEqual({
      kind: 'product',
      from: '2026-11-01',
      to: '2026-11-30',
      totalQuantity: 8,
      items: [
        {
          supplyId: 1,
          name: 'Dipirona',
          type: 'analgésico',
          quantity: 8,
          unit: 'comprimidos',
          point: 'Canil',
          stockQuantity: 24,
        },
      ],
    });
  });

  it('traduz erro 404 da API para o fallback das ocorrências', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(
      Object.assign(new Error('Not Found'), {
        status: 404,
        body: { detail: 'Not Found' },
      }),
    );

    await expect(
      reportService.getOccurrencesByMonth({ from: '2026-11-01', to: '2026-11-30' }),
    ).rejects.toThrow('Não foi possível carregar as ocorrências.');
  });

  it('traduz falha de rede para o fallback dos medicamentos', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error('Failed to fetch'));

    await expect(
      reportService.getSupplyConsumption({
        kind: 'medication',
        from: '2026-11-01',
        to: '2026-11-30',
      }),
    ).rejects.toThrow('Não foi possível carregar os medicamentos.');
  });

  it('traduz erro 404 da API para o fallback dos produtos', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(
      Object.assign(new Error('Not Found'), {
        status: 404,
        body: { detail: 'Not Found' },
      }),
    );

    await expect(
      reportService.getSupplyConsumption({
        kind: 'product',
        from: '2026-11-01',
        to: '2026-11-30',
      }),
    ).rejects.toThrow('Não foi possível carregar os produtos.');
  });

  it('preserva detail em português devolvido pela API', async () => {
    const detail = 'Intervalo inválido: data inicial não pode ser posterior à data final.';
    vi.mocked(httpClient.get).mockRejectedValue(
      Object.assign(new Error(detail), { status: 422, body: { detail } }),
    );

    await expect(
      reportService.getOccurrencesByMonth({ from: '2026-11-30', to: '2026-11-01' }),
    ).rejects.toThrow(detail);
  });
});
