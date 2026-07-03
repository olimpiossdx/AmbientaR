export const PCA_LISTAGEM_G_FORM_TIPOS = {
  principal: 'PCA completo – agrossilvipastoris (ficha principal)',
  geral: 'PCA geral – demais atividades da Listagem G',
} as const;

export type PcaListagemGFormTipo = keyof typeof PCA_LISTAGEM_G_FORM_TIPOS;

export const PCA_LISTAGEM_G_FORM_TIPO_PADRAO: PcaListagemGFormTipo = 'principal';

export const PCA_LISTAGEM_G_ACTIVITY_BY_TIPO: Record<string, string> = {
  principal: 'LISTAGEM G – AGROSSILVIPASTORIS',
};

export const PCA_LISTAGEM_G_CODIGO_PARA_FORMULARIO: Partial<
  Record<string, PcaListagemGFormTipo>
> = {};

export function inferirFormularioPcaListagemG(codigoDn?: string | null): PcaListagemGFormTipo {
  if (!codigoDn?.trim()) return PCA_LISTAGEM_G_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return PCA_LISTAGEM_G_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export function inferirSubatividadePcaListagemG(subActivity?: string | null): string {
  if (subActivity?.trim()) return subActivity.trim();
  return '';
}

export function extrairCodigoDnDoProjectG(project: Record<string, unknown>): string | null {
  const listagemG = project.listagemG as Record<string, unknown> | undefined;
  const atividades = listagemG?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  const geral = listagemG?.geral as Record<string, unknown> | undefined;
  const geralAtividades = geral?.atividades as Array<{ codigo?: string }> | undefined;
  const codigoGeral = geralAtividades?.[0]?.codigo;
  if (codigoGeral?.trim()) return codigoGeral.trim();
  const outras = listagemG?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  return codigoOutra?.trim() || null;
}
