import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';

/** Listagem E — rótulo oficial DN 217. */
export const PCA_LISTAGEM_E_ACTIVITY = LISTAGEM_ACTIVITY_BY_CODE.E;

/** Subatividades da Listagem E (espelho do catálogo RCA, independente). */
export const PCA_LISTAGEM_E_SUBACTIVITIES = [
  'Rodovias',
  'Gasoduto, transporte de produtos químicos e oleodutos e minerodutos',
  'Recapacitação e/ou Repotenciação de CGHs e PCHs',
  'Projetos de aproveitamento de Biogás de Aterro Sanitário com ou sem Geração de Energia Elétrica',
  'Sistema de Biometanização de Resíduos Sólidos Urbanos com Geração de Energia Elétrica',
  'Sistema de Tratamento Térmico de Resíduos Sólidos Urbanos com Geração de Energia Elétrica',
  'Barragem de Saneamento',
  'Sistema de Abastecimento de Água',
  'Sistema de Esgotamento Sanitário',
  'Sistemas de Tratamento e Disposição Final de Resíduos Sólidos Urbanos',
  'Solo Urbano Exclusiva ou Predominantemente Residencial',
  "Dragagem em corpos d'água",
] as const;

export type PcaListagemESubactivity = (typeof PCA_LISTAGEM_E_SUBACTIVITIES)[number];

/** Códigos DN do anexo de dutos/gasodutos. */
export const PCA_LISTAGEM_E_CODIGOS_DUTOS_GASODUTOS = [
  'E-01-10-4',
  'E-01-11-2',
  'E-01-12-0',
  'E-01-13-9',
] as const;
