import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';

/** Listagem A — rótulo oficial DN 217. */
export const PCA_LISTAGEM_A_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.A;

/** Subatividades da Listagem A (espelho do catálogo RCA, independente). */
export const PCA_LISTAGEM_A_SUBACTIVITIES = [
  'Lavra Subterrânea',
  'Lavra de rochas ornamentais',
  'Extração Areia Cascalho Argila',
  'Barragem de rejeitos e resíduos',
] as const;

export type PcaListagemASubactivity = (typeof PCA_LISTAGEM_A_SUBACTIVITIES)[number];
