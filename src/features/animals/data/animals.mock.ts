import type { Animal } from '../types/animal.types';

/**
 * Dados FICTÍCIOS só para a apresentação, enquanto a peludinhos-api
 * não tem endpoints de animais.
 */
export const ANIMALS_MOCK: Animal[] = [
  {
    id: 1,
    name: 'Mel',
    sex: 'F',
    colorDescription: 'Caramelo com patas brancas',
    age: '2 anos',
    isNeutered: true,
    status: 'disponivel',
    behavior: 'docil',
    notes:
      'Cachorra muito carinhosa, convive bem com crianças e com outros animais. Gosta de passeios curtos e de colo.',
  },
  {
    id: 2,
    name: 'Thor',
    sex: 'M',
    colorDescription: 'Preto com peito branco',
    age: '1 ano e 6 meses',
    isNeutered: true,
    status: 'disponivel',
    behavior: 'brincalhao',
    notes:
      'Cheio de energia, adora correr e buscar a bolinha. Ideal para quem tem quintal ou rotina ativa.',
  },
  {
    id: 3,
    name: 'Pipoca',
    sex: 'F',
    colorDescription: 'Branca com manchas amarelas',
    age: '8 meses',
    isNeutered: false,
    status: 'disponivel',
    behavior: 'brincalhao',
    notes:
      'Gatinha filhote, curiosa e travessa. Já usa caixa de areia e come ração sem problemas.',
  },
  {
    id: 4,
    name: 'Bolinha',
    sex: 'M',
    colorDescription: 'Cinza rajado',
    age: '4 anos',
    isNeutered: true,
    status: 'disponivel',
    behavior: 'timido',
    notes:
      'Gato calmo, que precisa de um tempinho para criar confiança. Depois se torna muito companheiro.',
  },
  {
    id: 5,
    name: 'Luna',
    sex: 'F',
    colorDescription: 'Preta com manchas brancas',
    age: '3 anos',
    isNeutered: true,
    status: 'disponivel',
    behavior: 'docil',
    notes:
      'Tranquila e obediente, anda bem na guia. Se adapta fácil a apartamentos.',
  },
  {
    id: 6,
    name: 'Caramelo',
    sex: 'M',
    colorDescription: 'Caramelo claro',
    age: '5 anos',
    isNeutered: true,
    status: 'disponivel',
    behavior: 'docil',
    notes:
      'Senhorzinho simpático, adora uma sombra e um cafuné. Convive bem com outros cães.',
  },
  {
    id: 7,
    name: 'Nina',
    sex: 'F',
    colorDescription: 'Tricolor (branco, preto e laranja)',
    age: '1 ano',
    isNeutered: false,
    status: 'disponivel',
    behavior: 'agitado',
    notes:
      'Gata muito ativa e exploradora. Precisa de brinquedos e espaço para gastar energia.',
  },
  {
    id: 8,
    name: 'Fred',
    sex: 'M',
    colorDescription: 'Marrom escuro',
    age: '6 meses',
    isNeutered: false,
    status: 'em_processo',
    behavior: 'brincalhao',
    notes: 'Filhote com processo de adoção em andamento.',
  },
];
