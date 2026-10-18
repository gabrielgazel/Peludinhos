/**
 * Formatos genéricos devolvidos pela peludinhos-api.
 */

/** Resposta paginada usada nas listagens da API. */
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Mensagem simples (ex.: POST /api/auth/logout). */
export interface MessageOut {
  message: string;
}
