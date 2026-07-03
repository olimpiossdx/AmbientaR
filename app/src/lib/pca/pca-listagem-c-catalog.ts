import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';

/** Listagem C — rótulo oficial DN 217. */
export const PCA_LISTAGEM_C_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.C;

/** Subatividades da Listagem C (espelho do catálogo RCA, independente). */
export const PCA_LISTAGEM_C_SUBACTIVITIES = [
  'Fabricação de Explosivos, Pólvora Negra e Artigos Pirotécnicos',
  'Setor Farmacêutico',
  'Papel e papelão',
  'Indústria da Borracha',
  'Couros e Peles',
  'Indústria de Plásticos',
  'Produtos de Limpeza',
] as const;

export type PcaListagemCSubactivity = (typeof PCA_LISTAGEM_C_SUBACTIVITIES)[number];
