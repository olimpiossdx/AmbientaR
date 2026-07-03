import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';

/** Listagem D — rótulo oficial DN 217. */
export const PCA_LISTAGEM_D_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.D;

/** Subatividades da Listagem D (espelho do catálogo RCA, independente). */
export const PCA_LISTAGEM_D_SUBACTIVITIES = [
  'Fabricação de Aguardente de Cana-de-Açúcar',
  'Preparação do leite e fabricação de produtos de laticínios',
  'Abatedouros e Matadouros',
  'Formulação de Rações Balanceadas e de Alimentos Preparados para Animais',
  'Processamento de subprodutos de origem animal para produção de sebo, óleos e farinha',
  'Refinação e preparação de óleos e gorduras vegetais, produção de manteiga de cacau e de gorduras de origem animal destinadas à alimentação',
] as const;

export type PcaListagemDSubactivity = (typeof PCA_LISTAGEM_D_SUBACTIVITIES)[number];

/** Código DN da ficha específica de aguardente de cana. */
export const PCA_LISTAGEM_D_CODIGO_AGUARDENTE = 'D-02-02-1';
