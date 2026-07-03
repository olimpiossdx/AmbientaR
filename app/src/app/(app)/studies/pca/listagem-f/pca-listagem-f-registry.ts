import { PCA_LISTAGEM_F_CODIGO_POSTO } from '@/lib/pca/pca-listagem-f-catalog';

export { PCA_LISTAGEM_F_CODIGO_POSTO };

export const PCA_LISTAGEM_F_FORM_TIPOS = {
  posto_combustivel: 'PCA específico – Posto de combustível (F-06-01-7)',
  geral: 'PCA geral – demais atividades da Listagem F',
} as const;

export type PcaListagemFFormTipo = keyof typeof PCA_LISTAGEM_F_FORM_TIPOS;

export const PCA_LISTAGEM_F_FORM_TIPO_PADRAO: PcaListagemFFormTipo = 'posto_combustivel';

export const PCA_LISTAGEM_F_ACTIVITY_BY_TIPO: Record<string, string> = {
  posto_combustivel: 'LISTAGEM F – POSTO DE COMBUSTÍVEL',
};

export const PCA_LISTAGEM_F_CODIGO_PARA_FORMULARIO: Partial<
  Record<string, PcaListagemFFormTipo>
> = {
  [PCA_LISTAGEM_F_CODIGO_POSTO]: 'posto_combustivel',
};

export function inferirFormularioPcaListagemF(codigoDn?: string | null): PcaListagemFFormTipo {
  if (!codigoDn?.trim()) return PCA_LISTAGEM_F_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return PCA_LISTAGEM_F_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export function inferirSubatividadePcaListagemF(
  subActivity?: string | null,
  codigoDn?: string | null,
): string {
  if (subActivity?.trim()) return subActivity.trim();
  const codigo = codigoDn?.trim().toUpperCase();
  if (codigo === PCA_LISTAGEM_F_CODIGO_POSTO) {
    return 'Posto de Combustível';
  }
  return '';
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
  if (posto?.ativa) return PCA_LISTAGEM_F_CODIGO_POSTO;
  return null;
}
