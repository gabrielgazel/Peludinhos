import { formatDate } from '../../../shared/utils/format';
import type {
  OccurrenceItem,
  OccurrencesByMonth,
  SupplyConsumption,
} from '../services/reportService';
import type { ReportRow } from '../types/report.types';
import type { CsvField } from './csv';

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

/** Rótulo do mês (`AAAA-MM`) por extenso, ex.: "novembro de 2026". */
export function monthLabel(month: string): string {
  const match = MONTH_PATTERN.exec(month);
  if (!match) return 'Sem data';
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthNumber - 1, 1),
  );
}

/** Número em pt-BR com até duas casas, para leitura e para o Excel. */
export function decimal(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function occurrenceDetail(items: OccurrenceItem[]): string {
  const parts = items.slice(0, 3).map((item) => {
    const date = formatDate(item.eventDate).slice(0, 5);
    const animal = item.animalName ? ` (${item.animalName})` : '';
    return `${date} — ${item.description}${animal}`;
  });
  const hidden = items.length - parts.length;
  if (hidden > 0) parts.push(`+${hidden}`);
  return parts.join(' · ');
}

/** Uma linha por mês, na ordem devolvida pela API. */
export function buildOccurrenceRows(report: OccurrencesByMonth): ReportRow[] {
  const max = Math.max(0, ...report.months.map((month) => month.total));
  return report.months.map((month) => ({
    key: month.month,
    label: monthLabel(month.month),
    value: plural(month.total, 'ocorrência', 'ocorrências'),
    detail: occurrenceDetail(month.items),
    ratio: max > 0 ? month.total / max : 0,
    tone: 'green',
  }));
}

/** CSV com uma linha por ocorrência e o total do período no fim. */
export function buildOccurrenceCsv(report: OccurrencesByMonth): CsvField[][] {
  const rows: CsvField[][] = [['Mês', 'Data', 'Animal', 'Descrição', 'Autor']];
  for (const month of report.months) {
    const label = monthLabel(month.month);
    for (const item of month.items) {
      rows.push([
        label,
        formatDate(item.eventDate),
        item.animalName ?? '',
        item.description,
        item.memberName ?? '',
      ]);
    }
  }
  rows.push(['Total', '', '', report.total, '']);
  return rows;
}

/** Uma linha por insumo, sem somar quantidades de unidades diferentes. */
export function buildSupplyRows(report: SupplyConsumption): ReportRow[] {
  const max = Math.max(0, ...report.items.map((item) => item.quantity));
  return report.items.map((item) => ({
    key: String(item.supplyId),
    label: item.name,
    value: `${decimal(item.quantity)} ${item.unit}`,
    detail: `Tipo: ${item.type} · Ponto: ${item.point} · Estoque atual: ${decimal(item.stockQuantity)} ${item.unit}`,
    ratio: max > 0 ? item.quantity / max : 0,
    tone: 'amber',
  }));
}

/** CSV de insumos: sem total porque as unidades não são comparáveis. */
export function buildSupplyCsv(report: SupplyConsumption): CsvField[][] {
  const rows: CsvField[][] = [['Item', 'Tipo', 'Consumo', 'Unidade', 'Ponto', 'Estoque atual']];
  for (const item of report.items) {
    rows.push([
      item.name,
      item.type,
      decimal(item.quantity),
      item.unit,
      item.point,
      decimal(item.stockQuantity),
    ]);
  }
  return rows;
}
