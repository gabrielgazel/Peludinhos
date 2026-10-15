import type { AdoptionIntentPayload } from '../types/adoption.types';

const FAKE_DELAY_MS = 700;

/**
 * Service MOCKADO: só simula o envio (não grava nada em lugar nenhum).
 * Quando a API tiver o endpoint, trocar o corpo por algo como:
 *
 *   httpClient.post<void>('/adoption_intents', payload)
 */
export const adoptionService = {
  submitIntent: (payload: AdoptionIntentPayload): Promise<void> =>
    new Promise((resolve) => {
      void payload;
      setTimeout(resolve, FAKE_DELAY_MS);
    }),
};
