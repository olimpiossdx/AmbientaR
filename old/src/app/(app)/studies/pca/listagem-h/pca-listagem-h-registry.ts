import { PCA_LISTAGEM_H_CODIGO_PRINCIPAL, PCA_LISTAGEM_H_SUBACTIVITIES } from '@/lib/pca/pca-listagem-h-catalog';



export const PCA_LISTAGEM_H_FORM_TIPOS = {

  principal: 'PCA completo – supressão Mata Atlântica (H-01-01-1)',

  geral: 'PCA geral – outras atividades da Listagem H',

} as const;



export type PcaListagemHFormTipo = keyof typeof PCA_LISTAGEM_H_FORM_TIPOS;



export const PCA_LISTAGEM_H_FORM_TIPO_PADRAO: PcaListagemHFormTipo = 'principal';

export const PCA_LISTAGEM_H_ACTIVITY_BY_TIPO: Record<string, string> = {
  principal: 'LISTAGEM H – OUTRAS ATIVIDADES',
};

export const PCA_LISTAGEM_H_CODIGO_PARA_FORMULARIO: Partial<

  Record<string, PcaListagemHFormTipo>

> = {

  [PCA_LISTAGEM_H_CODIGO_PRINCIPAL]: 'principal',

};



export function inferirFormularioPcaListagemH(codigoDn?: string | null): PcaListagemHFormTipo {

  if (!codigoDn?.trim()) return PCA_LISTAGEM_H_FORM_TIPO_PADRAO;

  const normalizado = codigoDn.trim().toUpperCase();

  return PCA_LISTAGEM_H_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';

}



export function inferirSubatividadePcaListagemH(subActivity?: string | null): string {

  if (subActivity?.trim()) return subActivity.trim();

  return PCA_LISTAGEM_H_SUBACTIVITIES[0];

}



export function extrairCodigoDnDoProjectH(project: Record<string, unknown>): string | null {

  const listagemH = project.listagemH as Record<string, unknown> | undefined;

  const geral = listagemH?.geral as Record<string, unknown> | undefined;

  const geralAtividades = geral?.atividades as Array<{ codigo?: string }> | undefined;

  const codigoGeral = geralAtividades?.[0]?.codigo;

  if (codigoGeral?.trim()) return codigoGeral.trim();

  const outras = listagemH?.outrasAtividades as Array<{ codigo?: string }> | undefined;

  const codigoOutra = outras?.[0]?.codigo;

  return codigoOutra?.trim() || null;

}


