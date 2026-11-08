import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { Animal } from '../../animals/types/animal.types';
import { FeaturedAnimals } from './FeaturedAnimals';

const animal = (id: number, name: string, status: Animal['status'] = 'disponivel'): Animal => ({
  id, name, sex: 'F', colorDescription: 'Caramelo', age: '2 anos',
  isNeutered: true, status, behavior: 'docil', notes: null,
  isDeceased: false, photoUrl: null, createdAt: null, updatedAt: null,
});

function renderSection(animals: Animal[], loading = false, failed = false) {
  return render(
    <MemoryRouter>
      <FeaturedAnimals animals={animals} loading={loading} failed={failed} />
    </MemoryRouter>,
  );
}

describe('FeaturedAnimals', () => {
  it('mostra no máximo oito animais', () => {
    const many = Array.from({ length: 12 }, (_, i) => animal(i + 1, `Animal ${i + 1}`));
    renderSection(many);
    expect(screen.getAllByRole('group', { name: /Animal \d+ de 8/ })).toHaveLength(8);
  });

  it('conta o total real de animais, mas mantém no máximo oito slides', () => {
    const many = Array.from({ length: 12 }, (_, i) => animal(i + 1, `Animal ${i + 1}`));
    renderSection(many);
    expect(screen.getByText('12 disponíveis')).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: /Animal \d+ de 8/ })).toHaveLength(8);
  });

  it('mostra skeletons durante o carregamento', () => {
    renderSection([], true);
    expect(screen.getAllByTestId('animal-skeleton')).toHaveLength(3);
    expect(
      screen.queryByRole('region', { name: 'Peludinhos disponíveis para adoção' }),
    ).not.toBeInTheDocument();
  });

  it('mostra estado vazio', () => {
    renderSection([]);
    expect(screen.getByText('Nenhum peludinho disponível agora')).toBeInTheDocument();
  });

  it('mostra erro com saída', () => {
    renderSection([], false, true);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar');
    expect(screen.getByRole('link', { name: 'Tentar novamente' })).toHaveAttribute('href', '/');
  });

  it('linka para a listagem completa', () => {
    renderSection([animal(1, 'Mel')]);
    expect(screen.getByRole('link', { name: 'Ver todos' })).toHaveAttribute('href', '/adocao');
  });

  it('exibe nome e ações do animal', () => {
    renderSection([animal(1, 'Mel')]);
    expect(screen.getByText('Mel')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mais' })).toHaveAttribute('href', '/adocao/1');
    expect(screen.getByRole('link', { name: 'Tenho interesse' })).toHaveAttribute(
      'href',
      '/adocao/1/intencao',
    );
  });

  it('quebra nomes longos sem estourar o card', () => {
    renderSection([animal(1, 'Princesa Isabel do Campus Santarém')]);
    expect(screen.getByText('Princesa Isabel do Campus Santarém')).toHaveClass('break-words');
  });

  it('troca foto quebrada pelo fallback de pata', () => {
    const withPhoto = { ...animal(1, 'Mel'), photoUrl: 'https://example.com/mel.jpg' };
    const { container } = renderSection([withPhoto]);
    fireEvent.error(screen.getByRole('img', { name: 'Foto de Mel' }));
    expect(screen.queryByRole('img', { name: 'Foto de Mel' })).not.toBeInTheDocument();
    expect(container.querySelector('.animal-photo--card')).not.toBeNull();
  });

  it('posiciona as setas do carrossel abaixo das fotos', () => {
    renderSection([animal(1, 'Mel')]);
    const region = screen.getByRole('region', { name: 'Peludinhos disponíveis para adoção' });
    expect(region).toHaveClass('pb-12');
    expect(screen.getByRole('button', { name: 'Animais anteriores' })).toHaveClass(
      'bottom-0',
      'left-[calc(50%-3rem)]',
    );
    expect(screen.getByRole('button', { name: 'Próximos animais' })).toHaveClass(
      'bottom-0',
      'right-[calc(50%-3rem)]',
    );
  });
});
