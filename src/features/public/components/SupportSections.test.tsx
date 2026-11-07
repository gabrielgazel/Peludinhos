import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdoptionTimeline } from './AdoptionTimeline';
import { ContactPanel } from './ContactPanel';

describe('AdoptionTimeline', () => {
  it('apresenta os três passos em ordem', () => {
    render(<AdoptionTimeline />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Escolha um peludinho');
    expect(items[1]).toHaveTextContent('Manifeste seu interesse');
    expect(items[2]).toHaveTextContent('Converse com a equipe');
  });
});

describe('ContactPanel', () => {
  it('mostra local, contato, fonte e CTA', () => {
    render(
      <MemoryRouter>
        <ContactPanel />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Local' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contato' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fonte' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Venha nos visitar' })).toBeInTheDocument();
    expect(screen.getByText(/Cintya Martins/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Notícia na UFOPA/ })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(screen.getByRole('link', { name: /Quero adotar/ })).toHaveAttribute('href', '/adocao');
  });

  it('mantém o foco do CTA visível sobre o card escuro', () => {
    render(
      <MemoryRouter>
        <ContactPanel />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Quero adotar/ })).toHaveClass(
      'focus-visible:outline-2',
      'focus-visible:outline-solid',
    );
  });
});
