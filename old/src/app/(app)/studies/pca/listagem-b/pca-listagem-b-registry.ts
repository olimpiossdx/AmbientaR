export const PCA_LISTAGEM_B_FORM_TIPOS = {
  ferroligas:
    'PCA específico – Produção de ligas ferrosas (ferro ligas), silício metálico e ligas à base de silício',
  fundidos_ferro_aco:
    'PCA específico – Produção de fundidos de ferro e aço (com/sem tratamento químico superficial)',
  fundidos_nao_ferrosos:
    'PCA específico – Fundidos de metais não ferrosos (com/sem tratamento químico e galvanotécnico)',
  principal: 'PCA completo – atividades industriais (em uso)',
  geral: 'PCA geral – demais atividades da Listagem B',
} as const;

export type PcaListagemBFormTipo = keyof typeof PCA_LISTAGEM_B_FORM_TIPOS;

export const PCA_LISTAGEM_B_FORM_TIPO_PADRAO: PcaListagemBFormTipo = 'principal';

export const PCA_LISTAGEM_B_ACTIVITY_BY_TIPO: Record<string, string> = {
  ferroligas: 'LISTAGEM B – ATIVIDADES INDUSTRIAIS',
  fundidos_ferro_aco: 'LISTAGEM B – ATIVIDADES INDUSTRIAIS',
  fundidos_nao_ferrosos: 'LISTAGEM B – ATIVIDADES INDUSTRIAIS',
  principal: 'LISTAGEM B – ATIVIDADES INDUSTRIAIS',
};

export const PCA_LISTAGEM_B_CODIGOS_FERROLIGAS = ['B-03-04-2'] as const;

export const PCA_LISTAGEM_B_CODIGOS_FUNDIDOS_FERRO_ACO = ['B-03-07-7', 'B-03-08-5'] as const;

export const PCA_LISTAGEM_B_CODIGOS_FUNDIDOS_NAO_FERROSOS = ['B-04-04-9', 'B-04-05-7'] as const;

export const PCA_LISTAGEM_B_CODIGO_PARA_FORMULARIO: Partial<
  Record<string, PcaListagemBFormTipo>
> = {
  'B-03-04-2': 'ferroligas',
  'B-03-07-7': 'fundidos_ferro_aco',
  'B-03-08-5': 'fundidos_ferro_aco',
  'B-04-04-9': 'fundidos_nao_ferrosos',
  'B-04-05-7': 'fundidos_nao_ferrosos',
};

export function inferirFormularioPcaListagemB(codigoDn?: string | null): PcaListagemBFormTipo {
  if (!codigoDn?.trim()) return PCA_LISTAGEM_B_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return PCA_LISTAGEM_B_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export function inferirSubatividadePcaListagemB(
  subActivity?: string | null,
  codigoDn?: string | null,
): string {
  if (subActivity?.trim()) return subActivity.trim();
  const codigo = codigoDn?.trim().toUpperCase();
  if (codigo && (PCA_LISTAGEM_B_CODIGOS_FERROLIGAS as readonly string[]).includes(codigo)) {
    return 'Produção de ligas ferrosas (ferroligas)';
  }
  if (
    codigo &&
    (PCA_LISTAGEM_B_CODIGOS_FUNDIDOS_FERRO_ACO as readonly string[]).includes(codigo)
  ) {
    return 'Produção de Fundidos de Ferro e Aço';
  }
  if (
    codigo &&
    (PCA_LISTAGEM_B_CODIGOS_FUNDIDOS_NAO_FERROSOS as readonly string[]).includes(codigo)
  ) {
    return 'Produção de Fundidos de Metais Não Ferrosos';
  }
  return '';
}

export function extrairCodigoDnDoProjectB(project: Record<string, unknown>): string | null {
  const listagemB = project.listagemB as Record<string, unknown> | undefined;
  const atividades = listagemB?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  const outras = listagemB?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  return codigoOutra?.trim() || null;
}
