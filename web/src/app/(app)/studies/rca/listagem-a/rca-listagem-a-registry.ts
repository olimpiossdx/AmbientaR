import { RCA_LISTAGEM_A_SUBACTIVITIES } from '@/lib/rca/rca-listagem-a-catalog';

export const RCA_LISTAGEM_A_FORM_TIPOS = {
  lavra_subterranea: 'RCA específico – Lavra subterrânea',
  rochas_ornamentais: 'RCA específico – Lavra de rochas ornamentais',
  extracao_areia_cascalho: 'RCA – Extração de areia, cascalho e argila',
  barragem_rejeitos: 'RCA – Barragem de rejeitos e resíduos',
} as const;

export type RcaListagemAFormTipo = keyof typeof RCA_LISTAGEM_A_FORM_TIPOS;

export const RCA_LISTAGEM_A_FORM_TIPO_PADRAO: RcaListagemAFormTipo = 'lavra_subterranea';

export const RCA_LISTAGEM_A_TR_FILES: Record<RcaListagemAFormTipo, string | null> = {
  lavra_subterranea: 'rca-lavra-subterranea.doc',
  rochas_ornamentais: 'termo-de-referencia-lavra-de-rochas-ornamentais-21.doc',
  extracao_areia_cascalho: null,
  barragem_rejeitos: null,
};

const SUBACTIVITY_PARA_FORMULARIO: Record<string, RcaListagemAFormTipo> = {
  'lavra subterranea': 'lavra_subterranea',
  'lavra de rochas ornamentais': 'rochas_ornamentais',
  'extracao areia cascalho argila': 'extracao_areia_cascalho',
  'barragem de rejeitos e residuos': 'barragem_rejeitos',
};

const FORMULARIO_PARA_SUBACTIVITY: Record<RcaListagemAFormTipo, string> = {
  lavra_subterranea: RCA_LISTAGEM_A_SUBACTIVITIES[0],
  rochas_ornamentais: RCA_LISTAGEM_A_SUBACTIVITIES[1],
  extracao_areia_cascalho: RCA_LISTAGEM_A_SUBACTIVITIES[2],
  barragem_rejeitos: RCA_LISTAGEM_A_SUBACTIVITIES[3],
};

function normalizarSubatividade(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferirFormularioRcaListagemA(subActivity?: string | null): RcaListagemAFormTipo {
  if (!subActivity?.trim()) return RCA_LISTAGEM_A_FORM_TIPO_PADRAO;
  const key = normalizarSubatividade(subActivity);
  return SUBACTIVITY_PARA_FORMULARIO[key] ?? RCA_LISTAGEM_A_FORM_TIPO_PADRAO;
}

export function subatividadeParaFormularioRcaListagemA(
  tipo: RcaListagemAFormTipo,
): string {
  return FORMULARIO_PARA_SUBACTIVITY[tipo];
}

export function normalizarFormularioTipoRcaListagemA(
  tipo?: string | null,
): RcaListagemAFormTipo {
  if (tipo && tipo in RCA_LISTAGEM_A_FORM_TIPOS) {
    return tipo as RcaListagemAFormTipo;
  }
  return RCA_LISTAGEM_A_FORM_TIPO_PADRAO;
}
