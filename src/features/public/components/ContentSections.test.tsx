import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CareTicker } from './CareTicker';
import { ProjectBento } from './ProjectBento';

describe('CareTicker', () => {
  it('expõe a lista acessível uma vez e duplica o visual escondido', () => {
    render(<CareTicker />);
    expect(screen.getByRole('region', { name: 'Cuidados do projeto' })).toBeInTheDocument();
    expect(screen.getAllByText('alimentação')).toHaveLength(2);
    expect(screen.getAllByText('alimentação')[1].closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('inclui os cinco cuidados', () => {
    render(<CareTicker />);
    ['saúde', 'castração', 'adoção responsável', 'vida livre no campus'].forEach((item) =>
      expect(screen.getAllByText(item).length).toBeGreaterThan(0),
    );
  });
});

describe('ProjectBento', () => {
  it('lista os quatro pilares com títulos h3', () => {
    render(<ProjectBento />);
    ['Cuidados diários', 'Ações coletivas', 'Controle populacional', 'Conscientização'].forEach(
      (title) => expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument(),
    );
  });

  it('preserva a referência à lei 9.605/98', () => {
    render(<ProjectBento />);
    expect(screen.getByText(/9\.605\/98/)).toBeInTheDocument();
  });

  it('estende somente no desktop: Conscientização só tem col-span-2 a partir de 900px', () => {
    render(<ProjectBento />);
    const tile = screen
      .getByRole('heading', { level: 3, name: 'Conscientização' })
      .closest('article');
    expect(tile).toHaveClass('min-[900px]:col-span-2');
    expect(tile).not.toHaveClass('min-[600px]:col-span-2');
  });
});
