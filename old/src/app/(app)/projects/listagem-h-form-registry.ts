import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_H_FORM_TIPOS = {
  principal: 'Formulário específico – outras atividades (em desenvolvimento)',
  geral: 'Geral – outras atividades da Listagem H',
} as const;

export type ListagemHFormTipo = keyof typeof LISTAGEM_H_FORM_TIPOS;

export const LISTAGEM_H_FORM_TIPO_PADRAO: ListagemHFormTipo = 'principal';

export const LISTAGEM_H_ACTIVITY_BY_TIPO: Record<string, string> = {
  principal: 'LISTAGEM H – OUTRAS ATIVIDADES',
};

export const LISTAGEM_H_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemHFormTipo>> = {};

export function inferirFormularioListagemH(codigoDn?: string | null): ListagemHFormTipo {
  if (!codigoDn?.trim()) return LISTAGEM_H_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return LISTAGEM_H_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export const LISTAGEM_H_FORM_CONFIG: ListagemFormularioTipoConfig<ListagemHFormTipo> = {
  letter: 'H',
  defaultTipo: LISTAGEM_H_FORM_TIPO_PADRAO,
  activityByTipo: LISTAGEM_H_ACTIVITY_BY_TIPO,
};
