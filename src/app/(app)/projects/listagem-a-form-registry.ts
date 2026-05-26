import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_A_FORM_TIPOS = {
  principal: 'Formulário completo – atividades minerárias (em uso)',
  geral: 'Geral – outras atividades da Listagem A',
} as const;

export type ListagemAFormTipo = keyof typeof LISTAGEM_A_FORM_TIPOS;

export const LISTAGEM_A_FORM_TIPO_PADRAO: ListagemAFormTipo = 'principal';

export const LISTAGEM_A_ACTIVITY_BY_TIPO: Record<string, string> = {
  principal: 'LISTAGEM A – ATIVIDADES MINERÁRIAS',
};

export const LISTAGEM_A_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemAFormTipo>> = {};

export function inferirFormularioListagemA(codigoDn?: string | null): ListagemAFormTipo {
  if (!codigoDn?.trim()) return LISTAGEM_A_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return LISTAGEM_A_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export const LISTAGEM_A_FORM_CONFIG: ListagemFormularioTipoConfig<ListagemAFormTipo> = {
  letter: 'A',
  defaultTipo: LISTAGEM_A_FORM_TIPO_PADRAO,
  activityByTipo: LISTAGEM_A_ACTIVITY_BY_TIPO,
};
