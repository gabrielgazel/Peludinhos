import { describe, expect, it } from 'vitest';
import { extractRecoveryToken } from './recoveryToken';

describe('extractRecoveryToken', () => {
  it('extrai o access_token do fragmento devolvido pelo Supabase', () => {
    const hash = '#access_token=token-do-email-123&expires_in=3600&type=recovery';

    expect(extractRecoveryToken('', hash)).toBe('token-do-email-123');
  });

  it('extrai o access_token da query quando o link usa query string', () => {
    expect(extractRecoveryToken('?access_token=token-da-query-123&type=recovery', '')).toBe(
      'token-da-query-123',
    );
  });

  it('aceita o parâmetro legado token', () => {
    expect(extractRecoveryToken('?token=token-legado-123', '')).toBe('token-legado-123');
  });

  it('prefere o fragmento quando a URL traz as duas formas', () => {
    expect(
      extractRecoveryToken('?access_token=token-da-query', '#access_token=token-do-hash&type=recovery'),
    ).toBe('token-do-hash');
  });

  it('decodifica caracteres escapados', () => {
    expect(extractRecoveryToken('', '#access_token=abc%2Edef%2D123&type=recovery')).toBe(
      'abc.def-123',
    );
  });

  it('não confunde o code do PKCE com o access_token exigido pela API', () => {
    expect(extractRecoveryToken('?code=pkce-code&type=recovery', '')).toBeNull();
  });

  it('retorna null sem token ou com token vazio', () => {
    expect(extractRecoveryToken('', '')).toBeNull();
    expect(extractRecoveryToken('?type=recovery', '#expires_in=3600')).toBeNull();
    expect(extractRecoveryToken('?access_token=', '')).toBeNull();
    expect(extractRecoveryToken('', '#access_token=%20%20')).toBeNull();
  });
});
