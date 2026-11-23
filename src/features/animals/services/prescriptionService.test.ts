import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api/httpsClient';
import {
  mapPrescription,
  prescriptionService,
  type ApiPrescription,
} from './prescriptionService';

vi.mock('../../../shared/api/httpsClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const row: ApiPrescription = {
  prescription_id: 12,
  animal_id: 5,
  medication: 'Amoxicilina 500 mg',
  dosage: '1 comprimido a cada 12h por 7 dias',
  prescription_date: '2026-10-05',
  notes: null,
  created_by_member_id: 7,
  created_at: null,
  updated_at: null,
};

describe('prescriptionService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapeia prescription_id e normaliza campos opcionais ausentes', () => {
    const mapped = {
      id: 12,
      animalId: 5,
      medication: 'Amoxicilina 500 mg',
      dosage: '1 comprimido a cada 12h por 7 dias',
      prescriptionDate: '2026-10-05',
      notes: null,
      createdByMemberId: 7,
      createdAt: null,
      updatedAt: null,
    };
    expect(mapPrescription(row)).toEqual(mapped);
    const semOpcionais: Omit<ApiPrescription, 'notes' | 'created_at' | 'updated_at'> = {
      prescription_id: 12,
      animal_id: 5,
      medication: 'Amoxicilina 500 mg',
      dosage: '1 comprimido a cada 12h por 7 dias',
      prescription_date: '2026-10-05',
      created_by_member_id: 7,
    };
    expect(mapPrescription(semOpcionais)).toEqual({
      ...mapped,
      notes: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('list usa a rota aninhada e envia filtros em snake_case', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ items: [row], total: 1, limit: 200, offset: 0 });
    const page = await prescriptionService.list(5, { limit: 200 });
    expect(httpClient.get).toHaveBeenCalledWith('/animals/5/prescriptions?limit=200');
    expect(page.items[0].id).toBe(12);
  });

  it('create envia o autor da sessão em created_by_member_id', async () => {
    vi.mocked(httpClient.post).mockResolvedValue(row);
    await prescriptionService.create(5, {
      medication: 'Amoxicilina 500 mg',
      dosage: '1 comprimido a cada 12h por 7 dias',
      prescriptionDate: '2026-10-05',
      notes: null,
      createdByMemberId: 7,
    });
    expect(httpClient.post).toHaveBeenCalledWith('/animals/5/prescriptions', {
      medication: 'Amoxicilina 500 mg',
      dosage: '1 comprimido a cada 12h por 7 dias',
      prescription_date: '2026-10-05',
      notes: null,
      created_by_member_id: 7,
    });
  });

  it('update envia somente os campos informados na rota do recurso', async () => {
    vi.mocked(httpClient.patch).mockResolvedValue(row);
    await prescriptionService.update(12, { dosage: '2 comprimidos ao dia' });
    expect(httpClient.patch).toHaveBeenCalledWith('/prescriptions/12', {
      dosage: '2 comprimidos ao dia',
    });
  });
});
