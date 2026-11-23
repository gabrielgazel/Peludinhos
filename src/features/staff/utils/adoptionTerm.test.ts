import { describe, expect, it } from 'vitest';
import type { AdoptionIntent, IntentAnimal, IntentVisitor } from '../../adoption/types/adoption.types';
import { buildAdoptionTerm } from './adoptionTerm';

const visitor: IntentVisitor = {
  id: 11,
  name: 'Bruno Visitante',
  email: 'bruno@example.com',
  isUfopaMember: false,
  hasPet: false,
  cpf: null,
};

const animal: IntentAnimal = {
  id: 6,
  name: 'Thor',
  sex: 'M',
  age: '3 anos',
  colorDescription: 'Caramelo',
  status: 'disponivel',
  behavior: 'docil',
  isNeutered: false,
};

const intent: AdoptionIntent = {
  id: 3,
  motivation: 'Tenho espaço e quero um companheiro.',
  status: 'aprovada',
  animalId: 6,
  visitorId: 11,
  createdAt: '2026-02-11T11:00:00',
  updatedAt: null,
  visitor,
  animal,
  adoption: null,
};

const SECOND_LINE =
  'Declaro que recebo o animal acima em adoção definitiva e me comprometo a proporcionar-lhe cuidados, alimentação, abrigo e acompanhamento veterinário adequados, conforme as informações fornecidas no pedido de adoção.';

describe('buildAdoptionTerm', () => {
  it('gera texto determinístico', () => {
    expect(buildAdoptionTerm(intent, 7, '2026-11-23')).toBe(
      [
        'Adoção definitiva — Pedido #3 — Animal Thor — Adotante Bruno Visitante — Data 23/11/2026 — Responsável Membro #7.',
        SECOND_LINE,
      ].join('\n'),
    );
  });

  it('usa travessão para responsável nulo', () => {
    expect(buildAdoptionTerm(intent, null, '2026-11-23')).toBe(
      [
        'Adoção definitiva — Pedido #3 — Animal Thor — Adotante Bruno Visitante — Data 23/11/2026 — Responsável —.',
        SECOND_LINE,
      ].join('\n'),
    );
  });
});
