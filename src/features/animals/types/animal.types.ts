/**
 * Tipos do animal espelhando a resposta da peludinhos-api
 * (`AnimalOut`), com nomes em camelCase usados na interface.
 */

export type AnimalSex = 'M' | 'F';

export type AnimalStatus = 'disponivel' | 'em_processo' | 'adotado' | 'indisponivel';

export type AnimalBehavior =
  | 'docil'
  | 'sociavel'
  | 'assustado'
  | 'agressivo'
  | 'independente';

export interface Animal {
  id: number;
  name: string;
  sex: AnimalSex;
  colorDescription: string | null;
  age: string | null;
  isNeutered: boolean;
  status: AnimalStatus;
  behavior: AnimalBehavior | null;
  notes: string | null;
  isDeceased: boolean;
  /** Ainda não existe no modelo; reservado para quando houver upload de fotos. */
  photoUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Corpo aceito pela API em POST/PATCH /api/animals (snake_case). */
export interface AnimalPayload {
  name: string;
  sex: AnimalSex;
  color_description?: string | null;
  age?: string | null;
  is_neutered: boolean;
  status: AnimalStatus;
  behavior?: AnimalBehavior | null;
  notes?: string | null;
  mother_id?: number | null;
}

/** ---- Formatos vindos da API (snake_case) ---- */

export interface ApiAnimal {
  animal_id: number;
  name: string;
  sex: AnimalSex;
  color_description: string | null;
  age: string | null;
  is_neutered: boolean;
  status: AnimalStatus;
  behavior: AnimalBehavior | null;
  notes: string | null;
  is_deceased: boolean;
  fk_administrator_member_id: number | null;
  fk_mother: number | null;
  created_at: string | null;
  updated_at: string | null;
}
