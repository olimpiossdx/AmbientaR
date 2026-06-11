import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';

/** Listagem B — rótulo oficial DN 217. */
export const PCA_LISTAGEM_B_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.B;

/** Subatividades da Listagem B (espelho do catálogo RCA, independente). */
export const PCA_LISTAGEM_B_SUBACTIVITIES = [
  'Fabricação de Telhas, Tijolos e Outros Artigos de Barro Cozido',
  'Fabricação de Materiais Cerâmicos',
  'Siderurgia - Produção de ferro Gusa',
  'Produção de ligas metálicas (ferro ligas)',
  'Produção de Fundidos de Ferro e Aço',
  'Produção de fundidos de metais não-ferrosos, inclusive ligas, com e sem tratamento químico superficial e/ou galvanotécnico, inclusive a partir da reciclagem.',
  'Fabricação de móveis',
] as const;

export type PcaListagemBSubactivity = (typeof PCA_LISTAGEM_B_SUBACTIVITIES)[number];
