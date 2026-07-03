import { RCA_LISTAGEM_D_SUBACTIVITIES } from '@/lib/rca/rca-listagem-d-catalog';

export const RCA_LISTAGEM_D_FORM_TIPOS = {
  aguardente: 'RCA específico – Fabricação de aguardente de cana-de-açúcar',
  laticinios: 'RCA – Laticínios (preparação do leite e produtos)',
  abatedouros: 'RCA – Abatedouros e matadouros',
  racao_animal: 'RCA – Rações balanceadas e alimentos para animais',
  subprodutos_animal:
    'RCA específico – Subprodutos de origem animal (sebo, óleos e farinha)',
  oleos_gorduras:
    'RCA específico – Refinação de óleos e gorduras vegetais / manteiga de cacau',
} as const;

export type RcaListagemDFormTipo = keyof typeof RCA_LISTAGEM_D_FORM_TIPOS;

export const RCA_LISTAGEM_D_FORM_TIPO_PADRAO: RcaListagemDFormTipo = 'aguardente';

export const RCA_LISTAGEM_D_TR_FILES: Record<RcaListagemDFormTipo, string | null> = {
  aguardente: '01-rca-fabricacao-aguardente-cana-acucar.doc',
  laticinios: 'formulario_rca_atividades_industriais_versao_1_2006 (1).doc',
  abatedouros: 'formulario_rca_atividades_industriais_versao_1_2006 (1).doc',
  racao_animal: 'formulario_rca_atividades_industriais_versao_1_2006 (1).doc',
  subprodutos_animal:
    'rca-processamento-de-subprodutos-de-origem-animal-para-producao-de-sebo-oleos-e-farinha.doc',
  oleos_gorduras:
    'rca-refinacao-e-preparacao-de-oleos-e-gorduras-vegetais-producao-de-manteiga-de-cacau-e-de-gorduras-de-origem-animal.doc',
};

const SUBACTIVITY_PARA_FORMULARIO: Record<string, RcaListagemDFormTipo> = {
  'fabricacao de aguardente de cana-de-acucar': 'aguardente',
  'preparacao do leite e fabricacao de produtos de laticinios': 'laticinios',
  'abatedouros e matadouros': 'abatedouros',
  'formulacao de racoes balanceadas e de alimentos preparados para animais': 'racao_animal',
  'processamento de subprodutos de origem animal para producao de sebo, oleos e farinha':
    'subprodutos_animal',
  'refinacao e preparacao de oleos e gorduras vegetais, producao de manteiga de cacau e de gorduras de origem animal destinadas a alimentacao':
    'oleos_gorduras',
};

const FORMULARIO_PARA_SUBACTIVITY: Record<RcaListagemDFormTipo, string> = {
  aguardente: RCA_LISTAGEM_D_SUBACTIVITIES[0],
  laticinios: RCA_LISTAGEM_D_SUBACTIVITIES[1],
  abatedouros: RCA_LISTAGEM_D_SUBACTIVITIES[2],
  racao_animal: RCA_LISTAGEM_D_SUBACTIVITIES[3],
  subprodutos_animal: RCA_LISTAGEM_D_SUBACTIVITIES[4],
  oleos_gorduras: RCA_LISTAGEM_D_SUBACTIVITIES[5],
};

function normalizarSubatividade(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferirFormularioRcaListagemD(subActivity?: string | null): RcaListagemDFormTipo {
  if (!subActivity?.trim()) return RCA_LISTAGEM_D_FORM_TIPO_PADRAO;
  const key = normalizarSubatividade(subActivity);
  return SUBACTIVITY_PARA_FORMULARIO[key] ?? RCA_LISTAGEM_D_FORM_TIPO_PADRAO;
}

export function subatividadeParaFormularioRcaListagemD(tipo: RcaListagemDFormTipo): string {
  return FORMULARIO_PARA_SUBACTIVITY[tipo];
}

export function normalizarFormularioTipoRcaListagemD(
  tipo?: string | null,
): RcaListagemDFormTipo {
  if (tipo && tipo in RCA_LISTAGEM_D_FORM_TIPOS) {
    return tipo as RcaListagemDFormTipo;
  }
  return RCA_LISTAGEM_D_FORM_TIPO_PADRAO;
}

export function extrairCodigoDnDoProjectD(project: Record<string, unknown>): string | null {
  const listagemD = project.listagemD as Record<string, unknown> | undefined;
  const atividades = listagemD?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  const outras = listagemD?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  return codigoOutra?.trim() || null;
}
