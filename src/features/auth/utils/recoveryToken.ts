/**
 * Extrai o token de recuperação da URL aberta pelo link do e-mail.
 *
 * O Supabase devolve a credencial no fragmento no fluxo implícito padrão:
 *   /redefinir-senha#access_token=...&expires_in=3600&type=recovery
 * Alguns links (configuração ou e-mails legados) usam a query string:
 *   /redefinir-senha?access_token=...&type=recovery
 *   /redefinir-senha?token=...
 * O backend `/auth/reset-password` exige `access_token` (mínimo 10 chars).
 * `?code=` é o fluxo PKCE e NÃO serve: não há troca de code neste projeto.
 *
 * O retorno é uma credencial de uso único: nunca registre em log.
 */
export function extractRecoveryToken(search: string, hash: string): string | null {
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  const query = new URLSearchParams(search.replace(/^\?/, ''));

  const candidates = [
    fragment.get('access_token'),
    query.get('access_token'),
    query.get('token'),
  ];

  for (const candidate of candidates) {
    const token = candidate?.trim();
    if (token) return token;
  }
  return null;
}
