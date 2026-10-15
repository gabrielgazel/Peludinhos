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
      .listAvailable()
      .then((animals) => {
        if (!cancelled) setResult({ animals, failed: false });
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

  // Só vale o resultado do id atual; ao trocar de id volta a "carregando".
  const current = result !== null && result.id === id ? result : null;

  return {
    animal: current?.animal ?? null,
    loading: current === null,
    failed: current?.failed ?? false,
  };
}
