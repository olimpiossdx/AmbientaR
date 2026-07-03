import {
  RCA_LISTAGEM_H_CODIGO_PRINCIPAL,
  RCA_LISTAGEM_H_SUBACTIVITIES,
} from '@/lib/rca/rca-listagem-h-catalog';

export const RCA_LISTAGEM_H_FORM_TIPOS = {
  supressao_mata_atlantica:
    'RCA – Supressão de vegetação Mata Atlântica (H-01-01-1 / Lei 11.428)',
} as const;

export type RcaListagemHFormTipo = keyof typeof RCA_LISTAGEM_H_FORM_TIPOS;

export const RCA_LISTAGEM_H_FORM_TIPO_PADRAO: RcaListagemHFormTipo = 'supressao_mata_atlantica';

export const RCA_LISTAGEM_H_TR_FILES: Record<RcaListagemHFormTipo, string | null> = {
  supressao_mata_atlantica: null,
};

const SUBACTIVITY_PARA_FORMULARIO: Record<string, RcaListagemHFormTipo> = {
  'supressao de vegetacao - mata atlantica (h-01-01-1)': 'supressao_mata_atlantica',
};

const FORMULARIO_PARA_SUBACTIVITY: Record<RcaListagemHFormTipo, string> = {
  supressao_mata_atlantica:
    RCA_LISTAGEM_H_SUBACTIVITIES[0] ??
    'Supressão de vegetação – Mata Atlântica (H-01-01-1)',
};

const CODIGO_PARA_FORMULARIO: Partial<Record<string, RcaListagemHFormTipo>> = {
  [RCA_LISTAGEM_H_CODIGO_PRINCIPAL]: 'supressao_mata_atlantica',
};

function normalizarSubatividade(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferirFormularioRcaListagemH(
  subActivity?: string | null,
  codigoDn?: string | null,
): RcaListagemHFormTipo {
  const codigo = codigoDn?.trim().toUpperCase();
  if (codigo && CODIGO_PARA_FORMULARIO[codigo]) {
    return CODIGO_PARA_FORMULARIO[codigo]!;
  }
  if (!subActivity?.trim()) return RCA_LISTAGEM_H_FORM_TIPO_PADRAO;
  const key = normalizarSubatividade(subActivity);
  return SUBACTIVITY_PARA_FORMULARIO[key] ?? RCA_LISTAGEM_H_FORM_TIPO_PADRAO;
}

export function subatividadeParaFormularioRcaListagemH(tipo: RcaListagemHFormTipo): string {
  return FORMULARIO_PARA_SUBACTIVITY[tipo];
}

export function normalizarFormularioTipoRcaListagemH(
  tipo?: string | null,
): RcaListagemHFormTipo {
  if (tipo && tipo in RCA_LISTAGEM_H_FORM_TIPOS) {
    return tipo as RcaListagemHFormTipo;
  }
  return RCA_LISTAGEM_H_FORM_TIPO_PADRAO;
}

export function extrairCodigoDnDoProjectH(project: Record<string, unknown>): string | null {
  const listagemH = project.listagemH as Record<string, unknown> | undefined;
  const geral = listagemH?.geral as Record<string, unknown> | undefined;
  const geralAtividades = geral?.atividades as Array<{ codigo?: string }> | undefined;
  const codigoGeral = geralAtividades?.[0]?.codigo;
  if (codigoGeral?.trim()) return codigoGeral.trim();
  const outras = listagemH?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  if (codigoOutra?.trim()) return codigoOutra.trim();
  const atividades = listagemH?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  return null;
}
