/**
 * Campos alinhados ao Modelo DB: AdoptionIntent (motivation),
 * Visitor (name, birth_date, cpf, email, is_ufopa_member, has_pet)
 * e VisitorAddress (street, number, neighborhood, cep, reference_point).
 */
export interface AdoptionIntentPayload {
  animalId: number;
  visitor: {
    name: string;
    email: string;
    birthDate: string;
    cpf: string;
    isUfopaMember: boolean;
    hasPet: boolean;
  };
  address: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    referencePoint: string;
  };
  motivation: string;
}
