import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('junta classes simples', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('a última classe do mesmo utilitário vence', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignora valores falsos', () => {
    // eslint-disable-next-line no-constant-binary-expression
    expect(cn('a', false && 'b', undefined, null)).toBe('a');
  });
});
