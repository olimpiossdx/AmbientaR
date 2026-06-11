import { PCA_LISTAGEM_E_CODIGOS_DUTOS_GASODUTOS } from '@/lib/pca/pca-listagem-e-catalog';

export const PCA_LISTAGEM_E_FORM_TIPOS = {
  dutos_gasodutos: 'PCA específico – Dutos e gasodutos (E-01-10-4 a E-01-13-9)',
  geral: 'PCA geral – demais atividades da Listagem E',
} as const;

export type PcaListagemEFormTipo = keyof typeof PCA_LISTAGEM_E_FORM_TIPOS;

export const PCA_LISTAGEM_E_FORM_TIPO_PADRAO: PcaListagemEFormTipo = 'dutos_gasodutos';

export const PCA_LISTAGEM_E_ACTIVITY_BY_TIPO: Record<string, string> = {
  dutos_gasodutos: 'LISTAGEM E – DUTOS E GASODUTOS',
};

export const PCA_LISTAGEM_E_CODIGO_PARA_FORMULARIO: Partial<
  Record<string, PcaListagemEFormTipo>
> = {
  'E-01-10-4': 'dutos_gasodutos',
  'E-01-11-2': 'dutos_gasodutos',
  'E-01-12-0': 'dutos_gasodutos',
  'E-01-13-9': 'dutos_gasodutos',
};

export function inferirFormularioPcaListagemE(codigoDn?: string | null): PcaListagemEFormTipo {
  if (!codigoDn?.trim()) return PCA_LISTAGEM_E_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return PCA_LISTAGEM_E_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export function inferirSubatividadePcaListagemE(
  subActivity?: string | null,
  codigoDn?: string | null,
): string {
  if (subActivity?.trim()) return subActivity.trim();
  const codigo = codigoDn?.trim().toUpperCase();
  if (
    codigo &&
    (PCA_LISTAGEM_E_CODIGOS_DUTOS_GASODUTOS as readonly string[]).includes(codigo)
  ) {
    return 'Gasoduto, transporte de produtos químicos e oleodutos e minerodutos';
  }
  return '';
}

export function extrairCodigoDnDoProjectE(project: Record<string, unknown>): string | null {
  const listagemE = project.listagemE as Record<string, unknown> | undefined;
  const atividades = listagemE?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  const outras = listagemE?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  if (codigoOutra?.trim()) return codigoOutra.trim();
  const atividadePrincipal = listagemE?.atividadePrincipal as
    | Record<string, { codigo?: string; ativa?: boolean }>
    | undefined;
  if (atividadePrincipal && typeof atividadePrincipal === 'object') {
    for (const entry of Object.values(atividadePrincipal)) {
      if (entry?.ativa && entry.codigo?.trim()) return entry.codigo.trim();
    }
  }
  return null;
}
