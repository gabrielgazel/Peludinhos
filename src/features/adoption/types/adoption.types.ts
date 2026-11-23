import type {
  AnimalBehavior,
  AnimalSex,
  AnimalStatus,
} from '../../animals/types/animal.types';

export type IntentStatus = 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada';

/** Corpo de F1.13: visitante autenticado manifesta interesse. */
export interface AdoptionIntentPayload {
  animalId: number;
  motivation: string;
}

export interface IntentVisitor {
  id: number;
  name: string;
  email: string;
  isUfopaMember: boolean;
  hasPet: boolean;
  cpf: string | null;
}

export interface IntentAnimal {
  id: number;
  name: string;
  sex: AnimalSex;
  age: string | null;
  colorDescription: string | null;
  status: AnimalStatus;
  behavior: AnimalBehavior | null;
  isNeutered: boolean;
}

export interface Adoption {
  id: number;
  adoptionIntentId: number;
  animalId: number;
  visitorId: number;
  responsibleMemberId: number;
  adoptionDate: string;
  termText: string;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Corpo de registro de adoção: intenção aprovada + termo gerado no front. */
export interface AdoptionRecordPayload {
  adoptionIntentId: number;
  responsibleMemberId: number;
  adoptionDate: string;
  termText: string;
}

export interface AdoptionIntent {
  id: number;
  motivation: string;
  status: IntentStatus;
  animalId: number;
  visitorId: number;
  createdAt: string | null;
  updatedAt: string | null;
  visitor: IntentVisitor | null;
  animal: IntentAnimal | null;
  adoption: Adoption | null;
}

/** ---- Formatos vindos da API (snake_case) ---- */

export interface ApiIntentVisitor {
  visitor_id: number;
  name: string;
  email: string;
  is_ufopa_member: boolean;
  has_pet: boolean;
  cpf: string | null;
}

export interface ApiIntentAnimal {
  animal_id: number;
  name: string;
  sex: AnimalSex;
  age: string | null;
  color_description: string | null;
  status: AnimalStatus;
  behavior: AnimalBehavior | null;
  is_neutered: boolean;
}

export interface ApiAdoptionIntent {
  adoption_intent_id: number;
  motivation: string;
  status: IntentStatus;
  fk_visitor_id: number;
  fk_animal_id: number;
  created_at: string | null;
  updated_at: string | null;
  visitor: ApiIntentVisitor | null;
  animal: ApiIntentAnimal | null;
  adoption?: ApiAdoption | null;
}

/** Registro definitivo da adoção (termo gerado no front e gravado na API). */
export interface ApiAdoption {
  adoption_id: number;
  fk_adoption_intent_id: number;
  fk_animal_id: number;
  fk_visitor_id: number;
  fk_responsible_member_id: number;
  adoption_date: string;
  term_text: string;
  created_at?: string | null;
  updated_at?: string | null;
}
