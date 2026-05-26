import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_G_FORM_TIPOS = {
  principal: 'Formulário específico – agrossilvipastoris (em desenvolvimento)',
  geral: 'Geral – outras atividades da Listagem G',
} as const;

export type ListagemGFormTipo = keyof typeof LISTAGEM_G_FORM_TIPOS;

export const LISTAGEM_G_FORM_TIPO_PADRAO: ListagemGFormTipo = 'principal';

export const LISTAGEM_G_ACTIVITY_BY_TIPO: Record<string, string> = {
  principal: 'LISTAGEM G – AGROSSILVIPASTORIS',
};

export const LISTAGEM_G_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemGFormTipo>> = {};

export function inferirFormularioListagemG(codigoDn?: string | null): ListagemGFormTipo {
  if (!codigoDn?.trim()) return LISTAGEM_G_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return LISTAGEM_G_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export const LISTAGEM_G_FORM_CONFIG: ListagemFormularioTipoConfig<ListagemGFormTipo> = {
  letter: 'G',
  defaultTipo: LISTAGEM_G_FORM_TIPO_PADRAO,
  activityByTipo: LISTAGEM_G_ACTIVITY_BY_TIPO,
};
