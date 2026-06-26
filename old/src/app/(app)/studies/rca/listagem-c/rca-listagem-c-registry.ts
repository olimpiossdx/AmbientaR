import { RCA_LISTAGEM_C_SUBACTIVITIES } from '@/lib/rca/rca-listagem-c-catalog';

export const RCA_LISTAGEM_C_FORM_TIPOS = {
  explosivos: 'RCA – Explosivos, pólvora negra e artigos pirotécnicos',
  farmaceutico: 'RCA – Setor farmacêutico',
  papel_papelao: 'RCA específico – Papel e papelão',
  borracha: 'RCA específico – Indústria da borracha',
  couros_peles: 'RCA – Couros e peles',
  plasticos: 'RCA específico – Indústria de plásticos',
  produtos_limpeza: 'RCA específico – Produtos de limpeza',
} as const;

export type RcaListagemCFormTipo = keyof typeof RCA_LISTAGEM_C_FORM_TIPOS;

export const RCA_LISTAGEM_C_FORM_TIPO_PADRAO: RcaListagemCFormTipo = 'explosivos';

export const RCA_LISTAGEM_C_TR_FILES: Record<RcaListagemCFormTipo, string | null> = {
  explosivos: 'formulario_rca_atividades_industriais_versao_1_2006.doc',
  farmaceutico: 'formulario_rca_atividades_industriais_versao_1_2006.doc',
  papel_papelao: 'rca-papel-e-papelao.doc',
  borracha: 'rca-industria-da-borracha.doc',
  couros_peles: 'formulario_rca_atividades_industriais_versao_1_2006.doc',
  plasticos: 'rca-industria-de-plasticos.doc',
  produtos_limpeza: 'rca-produtos-de-limpeza.doc',
};

const SUBACTIVITY_PARA_FORMULARIO: Record<string, RcaListagemCFormTipo> = {
  'fabricacao de explosivos, polvora negra e artigos pirotecnicos': 'explosivos',
  'setor farmaceutico': 'farmaceutico',
  'papel e papelao': 'papel_papelao',
  'industria da borracha': 'borracha',
  'couros e peles': 'couros_peles',
  'industria de plasticos': 'plasticos',
  'produtos de limpeza': 'produtos_limpeza',
};

const FORMULARIO_PARA_SUBACTIVITY: Record<RcaListagemCFormTipo, string> = {
  explosivos: RCA_LISTAGEM_C_SUBACTIVITIES[0],
  farmaceutico: RCA_LISTAGEM_C_SUBACTIVITIES[1],
  papel_papelao: RCA_LISTAGEM_C_SUBACTIVITIES[2],
  borracha: RCA_LISTAGEM_C_SUBACTIVITIES[3],
  couros_peles: RCA_LISTAGEM_C_SUBACTIVITIES[4],
  plasticos: RCA_LISTAGEM_C_SUBACTIVITIES[5],
  produtos_limpeza: RCA_LISTAGEM_C_SUBACTIVITIES[6],
};

function normalizarSubatividade(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferirFormularioRcaListagemC(subActivity?: string | null): RcaListagemCFormTipo {
  if (!subActivity?.trim()) return RCA_LISTAGEM_C_FORM_TIPO_PADRAO;
  const key = normalizarSubatividade(subActivity);
  return SUBACTIVITY_PARA_FORMULARIO[key] ?? RCA_LISTAGEM_C_FORM_TIPO_PADRAO;
}

export function subatividadeParaFormularioRcaListagemC(tipo: RcaListagemCFormTipo): string {
  return FORMULARIO_PARA_SUBACTIVITY[tipo];
}

export function normalizarFormularioTipoRcaListagemC(
  tipo?: string | null,
): RcaListagemCFormTipo {
  if (tipo && tipo in RCA_LISTAGEM_C_FORM_TIPOS) {
    return tipo as RcaListagemCFormTipo;
  }
  return RCA_LISTAGEM_C_FORM_TIPO_PADRAO;
}

export function extrairCodigoDnDoProjectC(project: Record<string, unknown>): string | null {
  const listagemC = project.listagemC as Record<string, unknown> | undefined;
  const atividades = listagemC?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  const outras = listagemC?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  return codigoOutra?.trim() || null;
}
