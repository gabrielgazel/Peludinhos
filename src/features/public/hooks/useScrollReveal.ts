import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { RefObject } from 'react';

interface UseScrollRevealResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  isVisible: boolean;
}

/**
 * Liga um elemento ao reveal de scroll: `isVisible` fica `true` na primeira
 * interseção e o observer se desconecta. Se `IntersectionObserver` não
 * existir (SSR/ambiente antigo), o elemento já nasce visível.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(): UseScrollRevealResult<T> {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === 'undefined',
  );

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          // flushSync garante que o reveal seja marcado no mesmo frame em
          // que a interseção acontece (o callback do observer vem fora do
          // fluxo de render do React, que traria atraso de batching).
          observer.disconnect();
          flushSync(() => setIsVisible(true));
        }
      },
      { threshold: 0.15 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, isVisible };
}
