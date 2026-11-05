import * as React from 'react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from './button';

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselOrientation = 'horizontal' | 'vertical';

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: CarouselOrientation;
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: CarouselApi;
  opts?: CarouselOptions;
  orientation: CarouselOrientation;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel precisa ser usado dentro de um <Carousel />');
  }

  return context;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener?.('change', handleChange);

    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

function Carousel({
  opts,
  plugins,
  setApi,
  orientation,
  className,
  children,
  onKeyDown,
  ...props
}: React.ComponentProps<'div'> & CarouselProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const resolvedOrientation = orientation ?? (opts?.axis === 'y' ? 'vertical' : 'horizontal');

  const emblaOptions = React.useMemo<CarouselOptions>(
    () => ({
      ...opts,
      ...(prefersReducedMotion ? { duration: 0 } : {}),
      axis: resolvedOrientation === 'vertical' ? 'y' : 'x',
    }),
    [opts, prefersReducedMotion, resolvedOrientation],
  );

  const [carouselRef, api] = useEmblaCarousel(emblaOptions, plugins);
  const subscribeToApi = React.useCallback(
    (onChange: () => void) => {
      if (!api) return () => {};

      api.on('reInit', onChange);
      api.on('select', onChange);

      return () => {
        api.off('reInit', onChange);
        api.off('select', onChange);
      };
    },
    [api],
  );

  const canScrollPrev = React.useSyncExternalStore(
    subscribeToApi,
    () => api?.canScrollPrev() ?? false,
    () => false,
  );
  const canScrollNext = React.useSyncExternalStore(
    subscribeToApi,
    () => api?.canScrollNext() ?? false,
    () => false,
  );
  const currentSlide = React.useSyncExternalStore(
    subscribeToApi,
    () => api?.selectedScrollSnap() ?? 0,
    () => 0,
  );
  const slideCount = React.useSyncExternalStore(
    subscribeToApi,
    () => api?.slideNodes().length ?? 0,
    () => 0,
  );

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);

      if (event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '');

      if (isEditable) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollNext();
      }
    },
    [onKeyDown, scrollPrev, scrollNext],
  );

  React.useEffect(() => {
    if (!api || !setApi) return;

    setApi(api);
  }, [api, setApi]);

  const status = slideCount > 0 ? `${currentSlide + 1} de ${slideCount}` : '';

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts: emblaOptions,
        orientation: resolvedOrientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        data-slot="carousel"
        role="region"
        aria-roledescription="carrossel"
        className={cn('relative', className)}
        {...props}
        onKeyDown={handleKeyDown}
      >
        {children}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {status}
        </div>
      </div>
    </CarouselContext.Provider>
  );
}

type CarouselItemProps = React.ComponentProps<'div'> & {
  slideIndex?: number;
  slideCount?: number;
};

function getNodeText(node: React.ReactNode): string | undefined {
  const text = React.Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child);
      }

      if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
        return getNodeText(child.props.children);
      }

      return '';
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text || undefined;
}

function CarouselContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  const { carouselRef, orientation } = useCarousel();
  const slideCount = React.Children.count(children);

  return (
    <div ref={carouselRef} data-slot="carousel-content" className="overflow-hidden">
      <div
        className={cn(
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          className,
        )}
        {...props}
      >
        {React.Children.map(children, (child, index) =>
          React.isValidElement<CarouselItemProps>(child) && child.type === CarouselItem ? (
            React.cloneElement(child, { slideIndex: index, slideCount })
          ) : (
            child
          ),
        )}
      </div>
    </div>
  );
}

function CarouselItem({
  className,
  children,
  'aria-label': ariaLabel,
  slideIndex = 0,
  slideCount = 0,
  ...props
}: CarouselItemProps) {
  const { orientation } = useCarousel();
  const contentLabel = getNodeText(children);
  const indexedLabel =
    slideCount > 0 ? `${slideIndex + 1} de ${slideCount}` : undefined;

  return (
    <div
      data-slot="carousel-item"
      role="group"
      aria-roledescription="slide"
      aria-label={ariaLabel ?? contentLabel ?? indexedLabel}
      className={cn(
        'min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? 'pl-4' : 'pt-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CarouselPrevious({
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      type="button"
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        'absolute rounded-full',
        orientation === 'horizontal'
          ? 'top-1/2 -left-12 -translate-y-1/2'
          : '-top-12 left-1/2 -translate-x-1/2 rotate-90',
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft aria-hidden="true" />
      <span className="sr-only">Animais anteriores</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = 'outline',
  size = 'icon',
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      type="button"
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        'absolute rounded-full',
        orientation === 'horizontal'
          ? 'top-1/2 -right-12 -translate-y-1/2'
          : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight aria-hidden="true" />
      <span className="sr-only">Próximos animais</span>
    </Button>
  );
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
};
