import { PCA_LISTAGEM_A_SUBACTIVITIES } from '@/lib/pca/pca-listagem-a-catalog';

export const PCA_LISTAGEM_A_FORM_TIPOS = {
  geral: 'PCA geral – demais atividades da Listagem A',
  lavra_subterranea: 'PCA específico – Lavra subterrânea',
  rochas_ornamentais: 'PCA específico – Lavra de rochas ornamentais',
  extracao_areia_cascalho: 'PCA específico – Extração de areia, cascalho e argila',
  barragem_rejeitos: 'PCA específico – Barragem de rejeitos e resíduos',
} as const;

export type PcaListagemAFormTipo = keyof typeof PCA_LISTAGEM_A_FORM_TIPOS;

export const PCA_LISTAGEM_A_FORM_TIPO_PADRAO: PcaListagemAFormTipo = 'geral';

export const PCA_LISTAGEM_A_CODIGOS_LAVRA_SUBTERRANEA = ['A-01-01-1', 'A-01-01-2'] as const;

export const PCA_LISTAGEM_A_CODIGOS_ROCHAS_ORNAMENTAIS = [
  'A-02-06-2',
  'A-05-04-5',
  'A-05-06-3',
] as const;

export const PCA_LISTAGEM_A_CODIGO_PARA_FORMULARIO: Partial<
  Record<string, PcaListagemAFormTipo>
> = {
  'A-01-01-1': 'lavra_subterranea',
  'A-01-01-2': 'lavra_subterranea',
  'A-02-06-2': 'rochas_ornamentais',
  'A-05-04-5': 'rochas_ornamentais',
  'A-05-06-3': 'rochas_ornamentais',
};

const SUBACTIVITY_PARA_FORMULARIO: Record<string, PcaListagemAFormTipo> = {
  'lavra subterranea': 'lavra_subterranea',
  'lavra de rochas ornamentais': 'rochas_ornamentais',
  'extracao areia cascalho argila': 'extracao_areia_cascalho',
  'barragem de rejeitos e residuos': 'barragem_rejeitos',
};

function normalizarSubatividade(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferirFormularioPcaListagemA(
  codigoDn?: string | null,
  subActivity?: string | null,
): PcaListagemAFormTipo {
  if (subActivity?.trim()) {
    const key = normalizarSubatividade(subActivity);
    const porSub = SUBACTIVITY_PARA_FORMULARIO[key];
    if (porSub) return porSub;
  }

  if (!codigoDn?.trim()) return PCA_LISTAGEM_A_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return PCA_LISTAGEM_A_CODIGO_PARA_FORMULARIO[normalizado] ?? PCA_LISTAGEM_A_FORM_TIPO_PADRAO;
}

/** Infere subatividade a partir do cadastro do empreendimento ou código DN. */
export function inferirSubatividadePcaListagemA(
  subActivity?: string | null,
  codigoDn?: string | null,
): string {
  if (subActivity?.trim()) return subActivity.trim();

  const codigo = codigoDn?.trim().toUpperCase();
  if (codigo && (PCA_LISTAGEM_A_CODIGOS_LAVRA_SUBTERRANEA as readonly string[]).includes(codigo)) {
    return PCA_LISTAGEM_A_SUBACTIVITIES[0];
  }
  if (codigo && (PCA_LISTAGEM_A_CODIGOS_ROCHAS_ORNAMENTAIS as readonly string[]).includes(codigo)) {
    return PCA_LISTAGEM_A_SUBACTIVITIES[1];
  }
  return '';
}

export function extrairCodigoDnDoProject(project: Record<string, unknown>): string | null {
  const listagemA = project.listagemA as Record<string, unknown> | undefined;
  const atividades = listagemA?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  const outras = listagemA?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  return codigoOutra?.trim() || null;
}

/** Compatibilidade: rascunhos antigos gravados como `principal`. */
export function normalizarFormularioTipoPcaListagemA(
  tipo?: string | null,
): PcaListagemAFormTipo {
  if (tipo === 'principal') return 'geral';
  if (tipo && tipo in PCA_LISTAGEM_A_FORM_TIPOS) {
    return tipo as PcaListagemAFormTipo;
  }
  return PCA_LISTAGEM_A_FORM_TIPO_PADRAO;
}
