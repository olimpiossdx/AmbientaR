import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_B_FORM_TIPOS = {
  principal: 'Formulário completo – atividades industriais (em uso)',
  geral: 'Geral – outras atividades da Listagem B',
} as const;

export type ListagemBFormTipo = keyof typeof LISTAGEM_B_FORM_TIPOS;

export const LISTAGEM_B_FORM_TIPO_PADRAO: ListagemBFormTipo = 'principal';

export const LISTAGEM_B_ACTIVITY_BY_TIPO: Record<string, string> = {
  principal: 'LISTAGEM B – ATIVIDADES INDUSTRIAIS',
};

export const LISTAGEM_B_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemBFormTipo>> = {};

export function inferirFormularioListagemB(codigoDn?: string | null): ListagemBFormTipo {
  if (!codigoDn?.trim()) return LISTAGEM_B_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return LISTAGEM_B_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export const LISTAGEM_B_FORM_CONFIG: ListagemFormularioTipoConfig<ListagemBFormTipo> = {
  letter: 'B',
  defaultTipo: LISTAGEM_B_FORM_TIPO_PADRAO,
  activityByTipo: LISTAGEM_B_ACTIVITY_BY_TIPO,
};
