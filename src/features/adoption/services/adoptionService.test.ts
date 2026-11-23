import { describe, expect, it } from 'vitest';
import { mapIntent } from './adoptionService';
import type { Adoption, AdoptionIntent, ApiAdoption, ApiAdoptionIntent } from '../types/adoption.types';

const adoptionRow: ApiAdoption = {
  adoption_id: 21,
  fk_adoption_intent_id: 3,
  fk_animal_id: 6,
  fk_visitor_id: 11,
  fk_responsible_member_id: 7,
  adoption_date: '2026-11-20',
  term_text: 'Termo registrado.',
  created_at: null,
  updated_at: null,
};

const expectedAdoption: Adoption = {
  id: 21,
  adoptionIntentId: 3,
  animalId: 6,
  visitorId: 11,
  responsibleMemberId: 7,
  adoptionDate: '2026-11-20',
  termText: 'Termo registrado.',
  createdAt: null,
  updatedAt: null,
};

const apiRow: ApiAdoptionIntent = {
  adoption_intent_id: 3,
  motivation: 'Motivação aprovada.',
  status: 'aprovada',
  fk_visitor_id: 11,
  fk_animal_id: 6,
  created_at: '2026-11-20T10:00:00',
  updated_at: null,
  visitor: null,
  animal: null,
};

const apiRowSemAdoption: ApiAdoptionIntent = {
  adoption_intent_id: 3,
  motivation: 'Motivação aprovada.',
  status: 'aprovada',
  fk_visitor_id: 11,
  fk_animal_id: 6,
  created_at: '2026-11-20T10:00:00',
  updated_at: null,
  visitor: null,
  animal: null,
};

const expectedIntent: AdoptionIntent = {
  id: 3,
  motivation: 'Motivação aprovada.',
  status: 'aprovada',
  animalId: 6,
  visitorId: 11,
  createdAt: '2026-11-20T10:00:00',
  updatedAt: null,
  visitor: null,
  animal: null,
  adoption: expectedAdoption,
};

describe('adoptionService', () => {
  it('mapeia adoption aninhada e aceita ausência', () => {
    expect(mapIntent({ ...apiRow, adoption: adoptionRow })).toEqual(expectedIntent);

    const semAdoption = { ...apiRowSemAdoption };
    expect(mapIntent(semAdoption)).toEqual({ ...expectedIntent, adoption: null });
  });
});
