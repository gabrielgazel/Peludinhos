import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DemoBanner } from './DemoBanner';

describe('DemoBanner', () => {
  it('avisa que os dados são de demonstração, com ícone e texto explícitos', () => {
    render(<DemoBanner />);

    const banner = screen.getByRole('note');
    expect(
      within(banner).getByText('Dados de demonstração - esta área ainda não persiste no banco'),
    ).toBeInTheDocument();
    expect(banner.querySelector('svg')).toBeInTheDocument();
  });
});
