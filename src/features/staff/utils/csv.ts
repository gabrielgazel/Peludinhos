/** Valor aceito em uma célula de CSV. */
export type CsvField = string | number | null | undefined;

/**
 * Escapa uma célula conforme o padrão pt-BR do Excel: separador `;`.
 *
 * Aspas são duplicadas e o campo é envolvido por aspas quando contém
 * separador, aspas ou quebra de linha. Vírgula não precisa de aspas porque
 * o separador é `;` (justamente para não conflitar com decimais como `7,5`).
 */
export function escapeCsvField(value: CsvField): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Junta linhas com `;` e CRLF, sem quebra final. */
export function toCsv(rows: CsvField[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(';')).join('\r\n');
}

/**
 * Conteúdo pronto para download: BOM UTF-8 para o Excel reconhecer acentos
 * e CRLF final para fechar a última linha.
 */
export function toCsvFile(rows: CsvField[][]): string {
  return `\uFEFF${toCsv(rows)}\r\n`;
}

/** Nome de arquivo com data local, ex.: `relatorio-status-2026-11-18.csv`. */
export function csvFilename(slug: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `relatorio-${slug}-${year}-${month}-${day}.csv`;
}

/** Gera o arquivo no navegador via Blob + link temporário. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
