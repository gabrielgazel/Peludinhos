import { useEffect, useState } from 'react';
import { animalService } from '../services/animalService';
import type { Animal } from '../types/animal.types';

interface ListResult {
  animals: Animal[];
  failed: boolean;
}

export function useAvailableAnimals() {
  const [result, setResult] = useState<ListResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    animalService
      .list({ limit: 200 })
      .then((page) => {
        if (!cancelled) setResult({ animals: page.items, failed: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ animals: [], failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    animals: result?.animals ?? [],
    loading: result === null,
    failed: result?.failed ?? false,
  };
}

interface DetailResult {
  id: number;
  animal: Animal | null;
  failed: boolean;
}

export function useAnimal(id: number) {
  const [result, setResult] = useState<DetailResult | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) return;

    let cancelled = false;

    animalService
      .getById(id)
      .then((animal) => {
        if (!cancelled) setResult({ id, animal, failed: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ id, animal: null, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Vale apenas o resultado do id atual; ids inválidos nunca carregam.
  const validId = Number.isFinite(id) && id > 0;
  const current = validId && result !== null && result.id === id ? result : null;

  return {
    animal: current?.animal ?? null,
    loading: validId && current === null,
    failed: current?.failed ?? false,
  };
}
