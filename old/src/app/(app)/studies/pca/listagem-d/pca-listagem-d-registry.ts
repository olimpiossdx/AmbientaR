import { PCA_LISTAGEM_D_CODIGO_AGUARDENTE } from '@/lib/pca/pca-listagem-d-catalog';

export { PCA_LISTAGEM_D_CODIGO_AGUARDENTE };

export const PCA_LISTAGEM_D_FORM_TIPOS = {
  aguardenete_cana: 'PCA específico – Aguardente de cana-de-açúcar (D-02-02-1)',
  geral: 'PCA geral – demais atividades da Listagem D',
} as const;

export type PcaListagemDFormTipo = keyof typeof PCA_LISTAGEM_D_FORM_TIPOS;

export const PCA_LISTAGEM_D_FORM_TIPO_PADRAO: PcaListagemDFormTipo = 'aguardenete_cana';

export const PCA_LISTAGEM_D_ACTIVITY_BY_TIPO: Record<string, string> = {
  aguardenete_cana: 'LISTAGEM D – RCA AGUARDENTE DE CANA',
};

export const PCA_LISTAGEM_D_CODIGO_PARA_FORMULARIO: Partial<
  Record<string, PcaListagemDFormTipo>
> = {
  [PCA_LISTAGEM_D_CODIGO_AGUARDENTE]: 'aguardenete_cana',
};

export function inferirFormularioPcaListagemD(codigoDn?: string | null): PcaListagemDFormTipo {
  if (!codigoDn?.trim()) return PCA_LISTAGEM_D_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return PCA_LISTAGEM_D_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export function inferirSubatividadePcaListagemD(
  subActivity?: string | null,
  codigoDn?: string | null,
): string {
  if (subActivity?.trim()) return subActivity.trim();
  const codigo = codigoDn?.trim().toUpperCase();
  if (codigo === PCA_LISTAGEM_D_CODIGO_AGUARDENTE) {
    return 'Fabricação de Aguardente de Cana-de-Açúcar';
  }
  return '';
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
