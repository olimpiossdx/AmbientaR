import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';

/** Listagem G — rótulo oficial DN 217. */
export const PCA_LISTAGEM_G_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.G;

/** Subatividades da Listagem G (espelho do catálogo RCA, independente). */
export const PCA_LISTAGEM_G_SUBACTIVITIES = [
  'Cultura anuais, perenes e olericultura',
  'Criação de Bovinos',
  'Projetos Agropecuarios Irrigados',
  'Silvicultura e Carvoejamento',
  'Processamento, beneficiamento e armazenamento de graos',
  'Suinocultura',
  'Avicultura',
] as const;

export type PcaListagemGSubactivity = (typeof PCA_LISTAGEM_G_SUBACTIVITIES)[number];
