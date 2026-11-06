import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from './carousel';

function Demo({ setApi }: { setApi?: (api: CarouselApi) => void }) {
  return (
    <Carousel aria-label="Animais disponíveis" setApi={setApi}>
      <CarouselContent>
        <CarouselItem>Mel</CarouselItem>
        <CarouselItem>Thor</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

function DemoComInput() {
  return (
    <Carousel aria-label="Animais disponíveis" setApi={(api) => (apiCaptured = api)}>
      <CarouselContent>
        <CarouselItem>Mel</CarouselItem>
        <CarouselItem>Thor</CarouselItem>
      </CarouselContent>
      <input aria-label="Nome" />
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

let apiCaptured: CarouselApi | undefined;

function renderDemoWithApi(ui?: React.ReactElement) {
  apiCaptured = undefined;
  const view = render(ui ?? <Demo setApi={(api) => (apiCaptured = api)} />);
  if (!apiCaptured) throw new Error('Embla não inicializou a api no jsdom');
  const api: NonNullable<CarouselApi> = apiCaptured;
  return { api, ...view };
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

  it('usa a posição como rótulo dos slides sem texto', () => {
    render(
      <Carousel aria-label="Animais disponíveis">
        <CarouselContent>
          <CarouselItem>
            <div data-testid="foto-mel" />
          </CarouselItem>
          <CarouselItem>
            <div data-testid="foto-thor" />
          </CarouselItem>
        </CarouselContent>
      </Carousel>,
    );

    const slides = screen.getAllByRole('group');
    expect(slides).toHaveLength(2);
    expect(slides[0]).toHaveAttribute('aria-label', '1 de 2');
    expect(slides[1]).toHaveAttribute('aria-label', '2 de 2');
  });

  it('desabilita os controles conforme os limites de rolagem', () => {
    const { api, rerender } = renderDemoWithApi();

    // O jsdom não tem layout: os slides têm largura zero e o Embla nunca
    // detecta rolagem. Espiamos a api para valores determinísticos.
    const canScrollPrev = vi.spyOn(api, 'canScrollPrev');
    const canScrollNext = vi.spyOn(api, 'canScrollNext');

    canScrollPrev.mockReturnValue(false);
    canScrollNext.mockReturnValue(true);
    rerender(<Demo />);
    expect(screen.getByRole('button', { name: 'Animais anteriores' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próximos animais' })).toBeEnabled();

    canScrollPrev.mockReturnValue(true);
    canScrollNext.mockReturnValue(false);
    rerender(<Demo />);
    expect(screen.getByRole('button', { name: 'Animais anteriores' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Próximos animais' })).toBeDisabled();
  });

  it('navega com as setas quando o foco está dentro da região', () => {
    const { api } = renderDemoWithApi();
    const scrollPrev = vi.spyOn(api, 'scrollPrev');
    const scrollNext = vi.spyOn(api, 'scrollNext');

    const previous = screen.getByRole('button', { name: 'Animais anteriores' });
    const next = screen.getByRole('button', { name: 'Próximos animais' });

    next.focus();
    fireEvent.keyDown(next, { key: 'ArrowRight' });
    expect(scrollNext).toHaveBeenCalledOnce();

    previous.focus();
    fireEvent.keyDown(previous, { key: 'ArrowLeft' });
    expect(scrollPrev).toHaveBeenCalledOnce();
  });

  it('ignora as setas em campos editáveis', () => {
    const { api } = renderDemoWithApi(<DemoComInput />);
    const scrollPrev = vi.spyOn(api, 'scrollPrev');
    const scrollNext = vi.spyOn(api, 'scrollNext');

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Nome' }), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Nome' }), { key: 'ArrowLeft' });
    expect(scrollNext).not.toHaveBeenCalled();
    expect(scrollPrev).not.toHaveBeenCalled();
  });

  it('anuncia o slide atual em aria-live', () => {
    renderDemoWithApi();
    const announcement = screen.getByText('1 de 2');
    expect(announcement).toHaveAttribute('aria-live', 'polite');
    expect(announcement).toHaveAttribute('aria-atomic', 'true');
  });

  it('zera a duração do Embla quando prefere movimento reduzido', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
      })),
    );

    try {
      const { api } = renderDemoWithApi();
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');

      const engine = (
        api as unknown as { internalEngine?: () => { options: { duration?: number } } }
      ).internalEngine?.();
      expect(engine?.options.duration).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
