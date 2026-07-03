import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

/**
 * Registro de formulários da Listagem F.
 * Novas fichas: adicionar em LISTAGEM_F_FORM_TIPOS e LISTAGEM_F_CODIGO_PARA_FORMULARIO.
 */

export const LISTAGEM_F_FORM_TIPOS = {
  posto_combustivel: 'RCA – Posto de combustível (anexo completo)',
  geral: 'Geral – outras atividades da Listagem F',
} as const;

export type ListagemFFormTipo = keyof typeof LISTAGEM_F_FORM_TIPOS;

export const LISTAGEM_F_FORM_TIPO_PADRAO: ListagemFFormTipo = 'posto_combustivel';

export const LISTAGEM_F_ACTIVITY_BY_TIPO: Record<string, string> = {
  posto_combustivel: 'LISTAGEM F – POSTO DE COMBUSTÍVEL',
};

/** Código DN 217/17 – posto revendedor */
export const LISTAGEM_F_CODIGO_POSTO = 'F-06-01-7';

export const LISTAGEM_F_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemFFormTipo>> = {
  'F-06-01-7': 'posto_combustivel',
};

export function inferirFormularioListagemF(codigoDn?: string | null): ListagemFFormTipo {
  if (!codigoDn?.trim()) return LISTAGEM_F_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return LISTAGEM_F_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export const LISTAGEM_F_FORM_CONFIG: ListagemFormularioTipoConfig<ListagemFFormTipo> = {
  letter: 'F',
  defaultTipo: LISTAGEM_F_FORM_TIPO_PADRAO,
  activityByTipo: LISTAGEM_F_ACTIVITY_BY_TIPO,
};
