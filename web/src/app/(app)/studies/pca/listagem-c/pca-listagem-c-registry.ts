export const PCA_LISTAGEM_C_FORM_TIPOS = {
  pneumaticos:
    'PCA específico – Indústria da borracha – pneumáticos (fabricação e recauchutagem)',
  plasticos: 'PCA específico – Indústria de plásticos (moldagem e reciclagem)',
  papel: 'PCA específico – Indústrias de papel e papelão',
  domissanitarios:
    'PCA específico – Produtos domissanitários, sabões, detergentes e preparados para limpeza/polimento',
  principal: 'PCA completo – indústria de borracha (todos os subtipos)',
  geral: 'PCA geral – demais atividades da Listagem C',
} as const;

export type PcaListagemCFormTipo = keyof typeof PCA_LISTAGEM_C_FORM_TIPOS;

export const PCA_LISTAGEM_C_FORM_TIPO_PADRAO: PcaListagemCFormTipo = 'pneumaticos';

export const PCA_LISTAGEM_C_CODIGOS_PNEUMATICOS = ['C-02-02-1', 'C-02-03-8'] as const;

export const PCA_LISTAGEM_C_CODIGOS_PLASTICOS = [
  'C-07-01-3',
  'C-07-02-1',
  'C-07-01-4',
  'C-07-04-8',
  'C-07-05-6',
  'C-07-07-2',
  'F-05-01-0',
  'F-05-02-9',
  'F-05-03-7',
] as const;

export const PCA_LISTAGEM_C_CODIGOS_PAPEL = ['C-01-01-5', 'C-01-02-3', 'C-01-03-1'] as const;

export const PCA_LISTAGEM_C_CODIGOS_DOMISSANITARIOS = ['C-04-11-1', 'C-04-12-1', 'C-04-13-0'] as const;

export const PCA_LISTAGEM_C_ACTIVITY_BY_TIPO: Record<string, string> = {
  pneumaticos: 'LISTAGEM C – INDÚSTRIA DE BORRACHA – PNEUMÁTICOS',
  plasticos: 'LISTAGEM C – INDÚSTRIA DE PLÁSTICOS',
  papel: 'LISTAGEM C – INDÚSTRIAS DE PAPEL E PAPELÃO',
  domissanitarios:
    'LISTAGEM C – PRODUTOS DOMISSANITÁRIOS, SABÕES, DETERGENTES E PREPARADOS PARA LIMPEZA E POLIMENTO',
  principal: 'LISTAGEM C – INDÚSTRIA DE BORRACHA',
};

export const PCA_LISTAGEM_C_CODIGO_PARA_FORMULARIO: Partial<Record<string, PcaListagemCFormTipo>> = {
  'C-02-02-1': 'pneumaticos',
  'C-02-03-8': 'pneumaticos',
  'C-07-01-3': 'plasticos',
  'C-07-02-1': 'plasticos',
  'C-07-01-4': 'plasticos',
  'C-07-04-8': 'plasticos',
  'C-07-05-6': 'plasticos',
  'C-07-07-2': 'plasticos',
  'F-05-01-0': 'plasticos',
  'F-05-02-9': 'plasticos',
  'F-05-03-7': 'plasticos',
  'C-01-01-5': 'papel',
  'C-01-02-3': 'papel',
  'C-01-03-1': 'papel',
  'C-04-11-1': 'domissanitarios',
  'C-04-12-1': 'domissanitarios',
  'C-04-13-0': 'domissanitarios',
};

export function inferirFormularioPcaListagemC(codigoDn?: string | null): PcaListagemCFormTipo {
  if (!codigoDn?.trim()) return PCA_LISTAGEM_C_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return PCA_LISTAGEM_C_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export function inferirSubatividadePcaListagemC(
  subActivity?: string | null,
  codigoDn?: string | null,
): string {
  if (subActivity?.trim()) return subActivity.trim();
  const codigo = codigoDn?.trim().toUpperCase();
  if (codigo && (PCA_LISTAGEM_C_CODIGOS_PNEUMATICOS as readonly string[]).includes(codigo)) {
    return 'Indústria da borracha – pneumáticos';
  }
  if (codigo && (PCA_LISTAGEM_C_CODIGOS_PLASTICOS as readonly string[]).includes(codigo)) {
    return 'Indústria de plásticos';
  }
  if (codigo && (PCA_LISTAGEM_C_CODIGOS_PAPEL as readonly string[]).includes(codigo)) {
    return 'Indústrias de papel e papelão';
  }
  if (codigo && (PCA_LISTAGEM_C_CODIGOS_DOMISSANITARIOS as readonly string[]).includes(codigo)) {
    return 'Produtos domissanitários';
  }
  return '';
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
