import { useCallback, useEffect, useState, type DependencyList } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface LoadedState<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Executa um carregador assíncrono e expõe dados/erro/carregando,
 * com `reload()` para refazer a busca (ex.: após salvar).
 *
 * `deps` funciona como no useEffect: mudou → refaz a busca.
 * O resultado é associado a uma chave derivada de `deps`, então mudanças
 * refletem imediatamente em `loading` sem setState síncrono no efeito.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: DependencyList = [],
): AsyncState<T> & { reload: () => void } {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<LoadedState<T> | null>(null);

  const key = JSON.stringify([deps, nonce]);

  useEffect(() => {
    let cancelled = false;

    loader()
      .then((data) => {
        if (!cancelled) setState({ key, data, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            key,
            data: null,
            error: error instanceof Error ? error.message : 'Não foi possível carregar.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const current = state && state.key === key ? state : null;

  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? null,
    reload,
  };
}
