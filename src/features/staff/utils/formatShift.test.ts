import { describe, expect, it } from 'vitest';
import { formatDuration } from './formatShift';

describe('formatDuration', () => {
  it('formata horas e minutos a partir da duração devolvida pela API', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(135)).toBe('2 h 15 min');
    expect(formatDuration(120)).toBe('2 h');
  });

  it('trata duração menor que um minuto e valores inválidos', () => {
    expect(formatDuration(0.5)).toBe('menos de 1 min');
    expect(formatDuration(-1)).toBe('—');
    expect(formatDuration(Number.NaN)).toBe('—');
  });
});
