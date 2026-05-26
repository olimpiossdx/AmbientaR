import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_C_FORM_TIPOS = {
  principal: 'Formulário completo – indústria de borracha (em uso)',
  geral: 'Geral – outras atividades da Listagem C',
} as const;

export type ListagemCFormTipo = keyof typeof LISTAGEM_C_FORM_TIPOS;

export const LISTAGEM_C_FORM_TIPO_PADRAO: ListagemCFormTipo = 'principal';

export const LISTAGEM_C_ACTIVITY_BY_TIPO: Record<string, string> = {
  principal: 'LISTAGEM C – INDÚSTRIA DE BORRACHA',
};

export const LISTAGEM_C_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemCFormTipo>> = {};

export function inferirFormularioListagemC(codigoDn?: string | null): ListagemCFormTipo {
  if (!codigoDn?.trim()) return LISTAGEM_C_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return LISTAGEM_C_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export const LISTAGEM_C_FORM_CONFIG: ListagemFormularioTipoConfig<ListagemCFormTipo> = {
  letter: 'C',
  defaultTipo: LISTAGEM_C_FORM_TIPO_PADRAO,
  activityByTipo: LISTAGEM_C_ACTIVITY_BY_TIPO,
};
