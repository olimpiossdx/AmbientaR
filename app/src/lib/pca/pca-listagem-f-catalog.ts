import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';

/** Listagem F — rótulo oficial DN 217. */
export const PCA_LISTAGEM_F_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.F;

/** Subatividades da Listagem F (espelho do catálogo RCA, independente). */
export const PCA_LISTAGEM_F_SUBACTIVITIES = ['Posto de Combustível'] as const;

export type PcaListagemFSubactivity = (typeof PCA_LISTAGEM_F_SUBACTIVITIES)[number];

/** Código DN – posto revendedor de combustíveis. */
export const PCA_LISTAGEM_F_CODIGO_POSTO = 'F-06-01-7';
