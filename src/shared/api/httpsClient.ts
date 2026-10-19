/**
 * Cliente HTTP centralizado para comunicação com a peludinhos-api.
 * Envolve o fetch nativo para padronizar base URL, headers, injeção do
 * token de autenticação, renovação automática de sessão e tratamento de
 * erros no formato da API (FastAPI: `{"detail": ...}`).
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api').replace(
  /\/+$/,
  '',
);

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

type UnauthorizedHandler = () => void;
type TokenRefresher = () => Promise<string | null>;

let accessToken: string | null = null;
let onUnauthorized: UnauthorizedHandler = () => {};
let refreshAccessToken: TokenRefresher = async () => null;

/** Rotas de autenticação que não devem disparar tentativa de refresh. */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/register'];

/** Atualiza o token usado nas requisições (chamado pelo AuthContext). */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * O AuthContext registra aqui como renovar a sessão (via refresh token)
 * e o que fazer quando ela é realmente inválida (limpar sessão e mandar
 * o usuário para o login). Evita import circular httpClient <-> AuthContext.
 */
export function configureHttpClient(options: {
  refresh: TokenRefresher;
  onUnauthorized: UnauthorizedHandler;
}) {
  refreshAccessToken = options.refresh;
  onUnauthorized = options.onUnauthorized;
}

/** Extrai a mensagem de erro do formato da API. */
function extractErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          item && typeof item === 'object' && 'msg' in item
            ? String((item as { msg: unknown }).msg)
            : null,
        )
        .filter((message): message is string => !!message);
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
  }
  return `Erro ${status}`;
}

// Renovação "single-flight": requisições concorrentes compartilham a
// mesma promessa de refresh em vez de dispararem vários POSTs.
let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}, allowRetry = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  // FormData (upload de arquivo) não pode ter Content-Type manual: o
  // navegador precisa gerar o boundary do multipart.
  const isFormData = options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    signal: options.signal,
    body: isFormData
      ? (options.body as FormData)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });

  // Access token expirado: tenta renovar uma vez e repetir a requisição.
  if (
    response.status === 401 &&
    allowRetry &&
    !NO_REFRESH_PATHS.some((noRefresh) => path.startsWith(noRefresh))
  ) {
    const renewed = await tryRefresh();
    if (renewed) {
      return request<T>(path, options, false);
    }
    onUnauthorized();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new HttpError(response.status, extractErrorMessage(response.status, body), body);
  }

  return body as T;
}

export const httpClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
