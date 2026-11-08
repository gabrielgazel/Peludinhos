import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Animal } from '../../animals/types/animal.types';
import { useAvailableAnimals } from '../../animals/hooks/useAnimals';
import { PublicHomePage } from './PublicHomePage';

vi.mock('../../animals/hooks/useAnimals', () => ({ useAvailableAnimals: vi.fn() }));

const animal = (id: number, name: string, status: Animal['status']): Animal => ({
  id, name, sex: 'F', colorDescription: 'Caramelo', age: '2 anos',
  isNeutered: true, status, behavior: 'docil', notes: null,
  isDeceased: false, photoUrl: null, createdAt: null, updatedAt: null,
});

describe('PublicHomePage', () => {
  beforeEach(() => {
    vi.mocked(useAvailableAnimals).mockReturnValue({
      animals: [animal(1, 'Mel', 'disponivel'), animal(2, 'Bidu', 'adotado')],
      loading: false,
      failed: false,
    });
  });

  it('compõe as cinco seções principais', () => {
    render(<MemoryRouter><PublicHomePage /></MemoryRouter>);
    ['O projeto', 'Como funciona a adoção', 'Quem está esperando', 'Venha nos visitar'].forEach(
      (title) => expect(screen.getByRole('heading', { name: title })).toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Todo peludinho merece um lar');
  });

  it('não exibe animal adotado', () => {
    render(<MemoryRouter><PublicHomePage /></MemoryRouter>);
    expect(screen.queryByText('Bidu')).not.toBeInTheDocument();
    expect(screen.getByText('1 peludinho esperando agora')).toBeInTheDocument();
  });

  it('aplica o espaçamento de seção da spec em todas as seções', () => {
    render(<MemoryRouter><PublicHomePage /></MemoryRouter>);
    ['O projeto', 'Como funciona a adoção', 'Quem está esperando', 'Venha nos visitar'].forEach(
      (title) =>
        expect(screen.getByRole('heading', { name: title }).closest('section')).toHaveClass(
          'py-[clamp(56px,8vw,96px)]',
        ),
    );
  });
});
