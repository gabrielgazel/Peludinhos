/** Acrescenta a query string ao caminho da requisição, quando não vazia. */
export function withQuery(path: string, query: URLSearchParams): string {
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}
