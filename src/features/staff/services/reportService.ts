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

/** Mensagens genéricas que não devem aparecer nos Alerts em português. */
const GENERIC_ERROR_MESSAGES = new Set([
  'bad request',
  'error',
  'failed to fetch',
  'fetch failed',
  'forbidden',
  'internal server error',
  'load failed',
  'network error',
  'networkerror',
  'network request failed',
  'not found',
  'request failed',
  'service unavailable',
  'timeout',
  'unauthorized',
]);

function isGenericMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return GENERIC_ERROR_MESSAGES.has(normalized) || /^erro \d{3}$/.test(normalized);
}

/** Lê `detail` de forma defensiva, sem depender da classe HttpError. */
function extractDetail(error: Error): string | null {
  if (!('body' in error)) return null;
  const body = (error as { body?: unknown }).body;
  if (!body || typeof body !== 'object') return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail.trim() || null;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        item && typeof item === 'object' && 'msg' in item
          ? String((item as { msg?: unknown }).msg ?? '')
          : '',
      )
      .filter(Boolean);
    return messages.join(' ') || null;
  }
  return null;
}

/** Converte falhas de rede/HTTP em mensagem pt-BR, preservando `detail` da API. */
export function reportErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.trim();
  if (message && !isGenericMessage(message)) return message;
  const detail = extractDetail(error);
  if (detail && !isGenericMessage(detail)) return detail;
  return fallback;
}

function withPortugueseError<T>(request: Promise<T>, fallback: string): Promise<T> {
  return request.catch((error: unknown) => {
    throw new Error(reportErrorMessage(error, fallback));
  });
}

export const reportService = {
  getOccurrencesByMonth: (period: ReportPeriod) => {
    const query = new URLSearchParams();
    query.set('from', period.from);
    query.set('to', period.to);
    return withPortugueseError(
      httpClient
        .get<ApiOccurrencesResponse>(withQuery('/reports/occurrences-by-month', query))
        .then(mapOccurrences),
      'Não foi possível carregar as ocorrências.',
    );
  },

  getSupplyConsumption: (period: ReportPeriod & { kind: SupplyKind }) => {
    const query = new URLSearchParams();
    query.set('kind', period.kind);
    query.set('from', period.from);
    query.set('to', period.to);
    return withPortugueseError(
      httpClient
        .get<ApiSupplyConsumptionResponse>(withQuery('/reports/supply-consumption', query))
        .then(mapSupplyConsumption),
      period.kind === 'medication'
        ? 'Não foi possível carregar os medicamentos.'
        : 'Não foi possível carregar os produtos.',
    );
  },
};
