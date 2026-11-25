import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Animal } from '../../animals/types/animal.types';
import { HomeHero } from './HomeHero';

const animal = (id: number, name: string): Animal => ({
  id, name, sex: 'F', colorDescription: 'Caramelo', age: '2 anos',
  isNeutered: true, status: 'disponivel', behavior: 'docil', notes: null,
  isDeceased: false, deathDate: null, deathCause: null,
  photoUrl: null, createdAt: null, updatedAt: null,
});

function renderHero(animals: Animal[], loading = false, failed = false) {
  return render(
    <MemoryRouter>
      <HomeHero animals={animals} loading={loading} failed={failed} />
    </MemoryRouter>,
  );
}

describe('HomeHero', () => {
  it('mostra título, contador e CTAs', () => {
    renderHero([animal(1, 'Mel'), animal(2, 'Thor'), animal(3, 'Luna')]);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Todo peludinho merece um lar');
    expect(screen.getByText('3 peludinhos esperando agora')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Conhecer os peludinhos/ })).toHaveAttribute('href', '/adocao');
    expect(screen.getByRole('link', { name: /Como funciona/ })).toHaveAttribute('href', '#como-funciona');
  });

  it('limita a pilha de fotos a três animais', () => {
    renderHero([animal(1, 'Mel'), animal(2, 'Thor'), animal(3, 'Luna'), animal(4, 'Bidu')]);
    expect(screen.getByText('Mel')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
    expect(screen.queryByText('Bidu')).not.toBeInTheDocument();
  });

  it('mostra aviso de carregamento no contador', () => {
    renderHero([], true);
    expect(screen.getByText('Buscando peludinhos...')).toBeInTheDocument();
  });
});
