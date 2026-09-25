/**
 * Cliente HTTP centralizado para comunicação com a peludinhos-api.
 * Envolve o fetch nativo pra padronizar base URL, headers,
 * injeção do token de autenticação e tratamento de erros.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

/**
 * O AuthContext registra aqui como obter o token atual e o que fazer
 * quando a API retornar 401 (ex: limpar sessão e redirecionar pro
 * login). Isso evita import circular entre httpClient <-> AuthContext.
 */
export function configureHttpClient(options: {
  getToken: TokenGetter;
  onUnauthorized: UnauthorizedHandler;
}) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    onUnauthorized();
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && String((data as { message: unknown }).message)) ||
      `Erro ${response.status} ao acessar ${path}`;
    throw new HttpError(response.status, message, data);
  }

  return data as T;
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};