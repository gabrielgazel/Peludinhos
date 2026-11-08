/// <reference types="node" />
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

// Tokens do painel da equipe ("cinza quente da casa").
// Verificação dupla: o fonte de `src/index.css` declara os tokens com os
// valores exatos do design e um elemento com os utilitários `staff-*`
// monta sem erro. O CSS compilado em si é verificado no build/QA.
const TOKENS = [
  '--color-staff-bg: #FAF7F4;',
  '--color-staff-surface: #FFFFFF;',
  '--color-staff-line: #E4D8D0;',
  '--color-staff-ink: #2B2927;',
  '--color-staff-muted: #6B5B52;',
  '--color-staff-faint: #A8978B;',
  '--color-staff-accent: #C97638;',
  '--color-staff-accent-soft: #F6DCC8;',
  '--color-staff-success: #7BAE7F;',
  '--color-staff-danger: #B3261E;',
] as const;

describe('tokens do painel (staff)', () => {
  it('declara os tokens staff em src/index.css com os valores exatos', () => {
    const css = readFileSync('src/index.css', 'utf-8');
    for (const token of TOKENS) {
      expect(css).toContain(token);
    }
  });

  it('renderiza um elemento com os utilitários staff sem erro', () => {
    const { getByTestId } = render(
      createElement('div', {
        'data-testid': 'staff-smoke',
        className: 'bg-staff-bg text-staff-ink border-staff-line',
      }),
    );
    expect(getByTestId('staff-smoke')).toHaveClass(
      'bg-staff-bg',
      'text-staff-ink',
      'border-staff-line',
    );
  });
});
