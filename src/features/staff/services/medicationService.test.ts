import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import { mapMedication, medicationService, type ApiMedication } from './medicationService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const row: ApiMedication = {
  medication_id: 3,
  name: 'Amoxicilina 500 mg',
  type: 'Antibiótico',
  quantity: 24,
  unit: 'cápsulas',
  validity: '2027-03-15',
  point: 'Farmácia — caixa A',
  notes: null,
  created_at: null,
  updated_at: null,
};

const semOpcionais: Omit<ApiMedication, 'notes' | 'created_at' | 'updated_at'> = {
  medication_id: 3,
  name: 'Amoxicilina 500 mg',
  type: 'Antibiótico',
  quantity: 24,
  unit: 'cápsulas',
  validity: '2027-03-15',
  point: 'Farmácia — caixa A',
};

describe('medicationService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapeia medication_id para id e normaliza campos opcionais', () => {
    const mapped = {
      id: 3,
      name: 'Amoxicilina 500 mg',
      type: 'Antibiótico',
      quantity: 24,
      unit: 'cápsulas',
      validity: '2027-03-15',
      point: 'Farmácia — caixa A',
      notes: null,
      createdAt: null,
      updatedAt: null,
    };
    expect(mapMedication(row)).toEqual(mapped);
    expect(mapMedication(semOpcionais)).toEqual(mapped);
  });

  it('list envia filtros em snake_case e mapeia a página', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ items: [row], total: 1, limit: 200, offset: 0 });
    const page = await medicationService.list({ q: 'amox', limit: 200 });
    expect(httpClient.get).toHaveBeenCalledWith('/medications?q=amox&limit=200');
    expect(page.items[0].id).toBe(3);
  });

  it('create envia o payload em snake_case', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(row);
    await medicationService.create({
      name: 'Amoxicilina 500 mg', type: 'Antibiótico', quantity: 24,
      unit: 'cápsulas', validity: '2027-03-15', point: 'Farmácia — caixa A',
      notes: 'Uso controlado',
    });
    expect(httpClient.post).toHaveBeenCalledWith('/medications', {
      name: 'Amoxicilina 500 mg', type: 'Antibiótico', quantity: 24,
      unit: 'cápsulas', validity: '2027-03-15', point: 'Farmácia — caixa A',
      notes: 'Uso controlado',
    });
  });

  it('update envia somente os campos informados', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(row);
    await medicationService.update(3, { quantity: 30 });
    expect(httpClient.patch).toHaveBeenCalledWith('/medications/3', { quantity: 30 });
  });
});
