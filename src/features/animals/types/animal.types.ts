/**
 * Espelha a tabela Animal do Modelo DB (campos usados na área pública).
 *
 * ATENÇÃO: os valores dos enums `status` e `behavior` abaixo são
 * suposições — confirmar com o backend quando a API estiver pronta.
 * `photoUrl` ainda não existe no modelo; é opcional até definirem
 * como as fotos serão armazenadas.
 */
export type AnimalSex = 'M' | 'F';
export type AnimalStatus = 'disponivel' | 'em_processo' | 'adotado';
export type AnimalBehavior = 'docil' | 'brincalhao' | 'timido' | 'agitado';

export interface Animal {
  id: number;
  name: string;
  sex: AnimalSex;
  colorDescription: string;
  age: string;
  isNeutered: boolean;
  status: AnimalStatus;
  behavior: AnimalBehavior;
  notes: string;
  photoUrl?: string | null;
}
