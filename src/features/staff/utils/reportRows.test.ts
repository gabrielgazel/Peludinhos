import { describe, expect, it } from 'vitest';
import type { OccurrencesByMonth, SupplyConsumption } from '../services/reportService';
import type { ReportRow } from '../types/report.types';
import {
  buildOccurrenceCsv,
  buildOccurrenceRows,
  buildSupplyCsv,
  buildSupplyRows,
  decimal,
  monthLabel,
} from './reportRows';

function occurrenceReport(): OccurrencesByMonth {
  return {
    total: 4,
    months: [
      {
        month: '2026-11',
        total: 4,
        items: [
          {
            id: 1,
            animalId: 7,
            animalName: 'Mel',
            description: 'A',
            eventDate: '2026-11-05',
            memberName: null,
          },
          {
            id: 2,
            animalId: null,
            animalName: null,
            description: 'B',
            eventDate: '2026-11-05',
            memberName: null,
          },
          {
            id: 3,
            animalId: null,
            animalName: null,
            description: 'C',
            eventDate: '2026-11-05',
            memberName: null,
          },
          {
            id: 4,
            animalId: null,
            animalName: null,
            description: 'D',
            eventDate: '2026-11-05',
            memberName: null,
          },
        ],
      },
    ],
  };
}

/** `totalQuantity` é inválido de propósito: unidades diferentes não se somam. */
function medicationReport(): SupplyConsumption {
  return {
    kind: 'medication',
    from: '2026-11-01',
    to: '2026-11-30',
    totalQuantity: 999,
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
      {
        supplyId: 2,
        name: 'Soro',
        type: 'hidratação',
        quantity: 4,
        unit: 'ml',
        point: 'Canil',
        stockQuantity: 0,
      },
    ],
  };
}

describe('reportRows', () => {
  it('formata mês e decimal em pt-BR', () => {
    expect(monthLabel('2026-11')).toBe('novembro de 2026');
    expect(monthLabel('')).toBe('Sem data');
    expect(decimal(7.5)).toBe('7,5');
    expect(decimal(1234.567)).toBe('1.234,57');
  });

  it('monta linhas de ocorrências com detalhe curto', () => {
    const rows: ReportRow[] = buildOccurrenceRows(occurrenceReport());

    expect(rows).toEqual([
      {
        key: '2026-11',
        label: 'novembro de 2026',
        value: '4 ocorrências',
        detail: '05/11 — A (Mel) · 05/11 — B · 05/11 — C · +1',
        ratio: 1,
        tone: 'green',
      },
    ]);
  });

  it('monta CSV de ocorrências com total', () => {
    expect(buildOccurrenceCsv(occurrenceReport())).toEqual([
      ['Mês', 'Data', 'Animal', 'Descrição', 'Autor'],
      ['novembro de 2026', '05/11/2026', 'Mel', 'A', ''],
      ['novembro de 2026', '05/11/2026', '', 'B', ''],
      ['novembro de 2026', '05/11/2026', '', 'C', ''],
      ['novembro de 2026', '05/11/2026', '', 'D', ''],
      ['Total', '', '', 4, ''],
    ]);
  });

  it('monta linhas de medicamentos sem somar unidades', () => {
    expect(buildSupplyRows(medicationReport())).toEqual([
      {
        key: '1',
        label: 'Dipirona',
        value: '8 comprimidos',
        detail: 'Tipo: analgésico · Ponto: Canil · Estoque atual: 24 comprimidos',
        ratio: 1,
        tone: 'amber',
      },
      {
        key: '2',
        label: 'Soro',
        value: '4 ml',
        detail: 'Tipo: hidratação · Ponto: Canil · Estoque atual: 0 ml',
        ratio: 0.5,
        tone: 'amber',
      },
    ]);
  });

  it('monta CSV de insumos sem linha de total', () => {
    const csv = buildSupplyCsv(medicationReport());

    expect(csv).toEqual([
      ['Item', 'Tipo', 'Consumo', 'Unidade', 'Ponto', 'Estoque atual'],
      ['Dipirona', 'analgésico', '8', 'comprimidos', 'Canil', '24'],
      ['Soro', 'hidratação', '4', 'ml', 'Canil', '0'],
    ]);
    expect(csv.some((row) => row[0] === 'Total')).toBe(false);
  });
});
