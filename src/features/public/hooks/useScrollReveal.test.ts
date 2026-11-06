import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollReveal } from './useScrollReveal';

describe('useScrollReveal', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('começa invisível e fica visível ao intersectar', () => {
    let callback: IntersectionObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: IntersectionObserverCallback) { callback = cb; }
      observe() {}
      unobserve() {}
      disconnect = disconnect;
      takeRecords() { return []; }
      root = null;
      rootMargin = '';
      thresholds = [];
    });

    const { result, unmount } = renderHook(() => useScrollReveal());
    expect(result.current.isVisible).toBe(false);

    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(result.current.isVisible).toBe(true);

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
