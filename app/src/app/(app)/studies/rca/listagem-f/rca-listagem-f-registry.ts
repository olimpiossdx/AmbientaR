import {
  RCA_LISTAGEM_F_CODIGO_POSTO,
  RCA_LISTAGEM_F_SUBACTIVITIES,
} from '@/lib/rca/rca-listagem-f-catalog';

export const RCA_LISTAGEM_F_FORM_TIPOS = {
  posto_combustivel: 'RCA específico – Posto de combustível (F-06-01-7)',
} as const;

export type RcaListagemFFormTipo = keyof typeof RCA_LISTAGEM_F_FORM_TIPOS;

export const RCA_LISTAGEM_F_FORM_TIPO_PADRAO: RcaListagemFFormTipo = 'posto_combustivel';

export const RCA_LISTAGEM_F_TR_FILES: Record<RcaListagemFFormTipo, string | null> = {
  posto_combustivel: '03-rca-posto-revendedor-combustivel.doc',
};

const SUBACTIVITY_PARA_FORMULARIO: Record<string, RcaListagemFFormTipo> = {
  'posto de combustivel': 'posto_combustivel',
};

const FORMULARIO_PARA_SUBACTIVITY: Record<RcaListagemFFormTipo, string> = {
  posto_combustivel: RCA_LISTAGEM_F_SUBACTIVITIES[0] ?? 'Posto de Combustível',
};

const CODIGO_PARA_FORMULARIO: Partial<Record<string, RcaListagemFFormTipo>> = {
  [RCA_LISTAGEM_F_CODIGO_POSTO]: 'posto_combustivel',
};

function normalizarSubatividade(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferirFormularioRcaListagemF(
  subActivity?: string | null,
  codigoDn?: string | null,
): RcaListagemFFormTipo {
  const codigo = codigoDn?.trim().toUpperCase();
  if (codigo && CODIGO_PARA_FORMULARIO[codigo]) {
    return CODIGO_PARA_FORMULARIO[codigo]!;
  }
  if (!subActivity?.trim()) return RCA_LISTAGEM_F_FORM_TIPO_PADRAO;
  const key = normalizarSubatividade(subActivity);
  return SUBACTIVITY_PARA_FORMULARIO[key] ?? RCA_LISTAGEM_F_FORM_TIPO_PADRAO;
}

export function subatividadeParaFormularioRcaListagemF(tipo: RcaListagemFFormTipo): string {
  return FORMULARIO_PARA_SUBACTIVITY[tipo];
}

export function normalizarFormularioTipoRcaListagemF(
  tipo?: string | null,
): RcaListagemFFormTipo {
  if (tipo && tipo in RCA_LISTAGEM_F_FORM_TIPOS) {
    return tipo as RcaListagemFFormTipo;
  }
  return RCA_LISTAGEM_F_FORM_TIPO_PADRAO;
}

export function extrairCodigoDnDoProjectF(project: Record<string, unknown>): string | null {
  const listagemF = project.listagemF as Record<string, unknown> | undefined;
  const atividades = listagemF?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  const outras = listagemF?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  if (codigoOutra?.trim()) return codigoOutra.trim();
  const posto = (
    listagemF?.atividadePrincipal as Record<string, { codigo?: string; ativa?: boolean }> | undefined
  )?.postoRevendedor;
  if (posto?.ativa && posto.codigo?.trim()) return posto.codigo.trim();
  if (posto?.ativa) return RCA_LISTAGEM_F_CODIGO_POSTO;
  return null;
}
