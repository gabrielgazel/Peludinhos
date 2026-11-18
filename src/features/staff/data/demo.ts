/**
 * Dados de EXEMPLO para a tela de insumos em modo demonstração (D4.4).
 *
 * NÃO são dados reais, NÃO vêm do banco e NÃO devem ser tratados como
 * persistência. Os nomes, quantidades e validades abaixo são fictícios e
 * servem apenas para avaliar a leitura das tabelas. Quando a API de
 * medicamentos/produtos existir, este módulo deve ser removido e as tabelas
 * passam a ser alimentadas por um service real.
 */

export type DemoSupply = {
  /** Nome comercial do item. */
  name: string;
  /** Categoria legível (classe do medicamento ou tipo de produto). */
  type: string;
  /** Quantidade disponível em estoque. */
  quantity: number;
  /** Unidade da quantidade (comprimido, frasco, saco etc.). */
  unit: string;
  /** Validade ISO AAAA-MM-DD; `null` significa que o item não tem validade. */
  validity: string | null;
  /** Onde o item fica guardado ou para qual uso é destinado. */
  location: string;
};

export const DEMO_MEDICINES: DemoSupply[] = [
  {
    name: 'Amoxicilina 500 mg',
    type: 'Antibiótico',
    quantity: 24,
    unit: 'cápsulas',
    validity: '2027-03-15',
    location: 'Farmácia — caixa A',
  },
  {
    name: 'Dipirona 500 mg',
    type: 'Analgésico',
    quantity: 60,
    unit: 'comprimidos',
    validity: '2026-12-20',
    location: 'Farmácia — caixa B',
  },
  {
    name: 'Simparic 20 mg',
    type: 'Antiparasitário',
    quantity: 8,
    unit: 'comprimidos',
    validity: '2027-01-10',
    location: 'Farmácia — caixa A',
  },
  {
    name: 'Vacina V10',
    type: 'Vacina',
    quantity: 6,
    unit: 'doses',
    validity: '2026-11-30',
    location: 'Refrigeração — sala veterinária',
  },
  {
    name: 'Miconazol spray',
    type: 'Antifúngico',
    quantity: 15,
    unit: 'frascos',
    validity: null,
    location: 'Farmácia — caixa C',
  },
];

export const DEMO_PRODUCTS: DemoSupply[] = [
  {
    name: 'Ração adulto raças médias',
    type: 'Alimentação',
    quantity: 12,
    unit: 'sacos',
    validity: '2027-02-28',
    location: 'Depósito — prateleira 1',
  },
  {
    name: 'Shampoo neutro',
    type: 'Higiene',
    quantity: 20,
    unit: 'frascos',
    validity: '2027-06-30',
    location: 'Depósito — prateleira 2',
  },
  {
    name: 'Desinfetante hospitalar',
    type: 'Limpeza',
    quantity: 10,
    unit: 'galões',
    validity: '2026-12-05',
    location: 'Depósito — área de limpeza',
  },
  {
    name: 'Toalhas descartáveis',
    type: 'Higiene',
    quantity: 200,
    unit: 'unidades',
    validity: null,
    location: 'Depósito — prateleira 3',
  },
  {
    name: 'Coleiras identificadas',
    type: 'Acessório',
    quantity: 35,
    unit: 'unidades',
    validity: null,
    location: 'Recepção — gaveta 2',
  },
];
