import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './carousel';

function Demo() {
  return (
    <Carousel aria-label="Animais disponíveis">
      <CarouselContent>
        <CarouselItem>Mel</CarouselItem>
        <CarouselItem>Thor</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

describe('Carousel', () => {
  it('expõe a região e os slides com rótulos', () => {
    render(<Demo />);
    expect(screen.getByRole('region', { name: 'Animais disponíveis' })).toHaveAttribute(
      'aria-roledescription',
      'carrossel',
    );
    expect(screen.getByRole('group', { name: 'Mel' })).toHaveAttribute(
      'aria-roledescription',
      'slide',
    );
  });

  it('oferece controles com nomes em português', () => {
    render(<Demo />);
    expect(screen.getByRole('button', { name: 'Animais anteriores' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próximos animais' })).toBeInTheDocument();
  });
});
