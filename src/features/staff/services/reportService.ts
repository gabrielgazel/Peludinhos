import { httpClient } from '../../../shared/api/httpsClient';
import { withQuery } from '../../../shared/api/query';

/** Intervalo de datas (ISO) usado nos filtros dos relatórios. */
export interface ReportPeriod {
  from: string;
  to: string;
}

/** Tipo de insumo considerado no relatório de consumo. */
export type SupplyKind = 'medication' | 'product';

/** Ocorrência exibida no relatório mensal. */
export interface OccurrenceItem {
  id: number;
  animalId: number | null;
  animalName: string | null;
  description: string;
  eventDate: string;
  memberName: string | null;
}

/** Ocorrências agrupadas por mês, na ordem devolvida pela API. */
export interface OccurrencesByMonth {
  total: number;
  months: Array<{ month: string; total: number; items: OccurrenceItem[] }>;
}

/** Insumo consumido no período. */
export interface SupplyItem {
  supplyId: number;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  point: string;
  stockQuantity: number;
}

/** Consumo de insumos de um tipo no período. */
export interface SupplyConsumption {
  kind: SupplyKind;
  from: string;
  to: string;
  totalQuantity: number;
  items: SupplyItem[];
}

/** Linha devolvida pela API de ocorrências. */
export interface ApiOccurrenceItem {
  event_id: number;
  animal_id?: number | null;
  animal_name?: string | null;
  description: string;
  event_date: string;
  member_name?: string | null;
}

export interface ApiOccurrencesResponse {
  total: number;
  months: Array<{ month: string; total: number; items: ApiOccurrenceItem[] }>;
}

/** Linha devolvida pela API de consumo de insumos. */
export interface ApiSupplyItem {
  supply_id: number;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  point: string;
  stock_quantity: number;
}

export interface ApiSupplyConsumptionResponse {
  kind: SupplyKind;
  from: string;
  to: string;
  total_quantity: number;
  items: ApiSupplyItem[];
}

export function mapOccurrences(row: ApiOccurrencesResponse): OccurrencesByMonth {
  return {
    total: row.total,
    months: row.months.map((month) => ({
      month: month.month,
      total: month.total,
      items: month.items.map((item) => ({
        id: item.event_id,
        animalId: item.animal_id ?? null,
        animalName: item.animal_name ?? null,
        description: item.description,
        eventDate: item.event_date,
        memberName: item.member_name ?? null,
      })),
    })),
  };
}

export function mapSupplyConsumption(row: ApiSupplyConsumptionResponse): SupplyConsumption {
  return {
    kind: row.kind,
    from: row.from,
    to: row.to,
    totalQuantity: row.total_quantity,
    items: row.items.map((item) => ({
      supplyId: item.supply_id,
      name: item.name,
      type: item.type,
      quantity: item.quantity,
      unit: item.unit,
      point: item.point,
      stockQuantity: item.stock_quantity,
    })),
  };
}

export const reportService = {
  getOccurrencesByMonth: (period: ReportPeriod) => {
    const query = new URLSearchParams();
    query.set('from', period.from);
    query.set('to', period.to);
    return httpClient
      .get<ApiOccurrencesResponse>(withQuery('/reports/occurrences-by-month', query))
      .then(mapOccurrences);
  },

  getSupplyConsumption: (period: ReportPeriod & { kind: SupplyKind }) => {
    const query = new URLSearchParams();
    query.set('kind', period.kind);
    query.set('from', period.from);
    query.set('to', period.to);
    return httpClient
      .get<ApiSupplyConsumptionResponse>(withQuery('/reports/supply-consumption', query))
      .then(mapSupplyConsumption);
  },
};
