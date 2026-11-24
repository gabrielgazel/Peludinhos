import type { ReactNode } from 'react';
import type { BadgeTone } from '../utils/badges';

/** Linha exibida nos painéis de relatório. */
export interface ReportRow {
  key: string;
  label: string;
  /** Valor já formatado para leitura (ex.: "4 ocorrências", "8 comprimidos"). */
  value: string;
  detail?: string;
  badge?: ReactNode;
  ratio: number;
  tone: BadgeTone;
}
