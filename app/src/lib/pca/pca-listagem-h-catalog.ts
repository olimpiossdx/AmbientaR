import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';

/** Listagem H — rótulo oficial DN 217. */
export const PCA_LISTAGEM_H_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.H;

/** Subatividades da Listagem H (espelho do catálogo RCA, independente). */
export const PCA_LISTAGEM_H_SUBACTIVITIES = [
  'Supressão de vegetação – Mata Atlântica (H-01-01-1)',
] as const;

export type PcaListagemHSubactivity = (typeof PCA_LISTAGEM_H_SUBACTIVITIES)[number];

/** Código DN – supressão em Mata Atlântica (Lei 11.428/2006). */
export const PCA_LISTAGEM_H_CODIGO_PRINCIPAL = 'H-01-01-1';
