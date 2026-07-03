import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

/**
 * Registro de formulários da Listagem E.
 * Novas fichas específicas: adicionar em LISTAGEM_E_FORM_TIPOS e, se aplicável,
 * mapear códigos DN em LISTAGEM_E_CODIGO_PARA_FORMULARIO.
 */

export const LISTAGEM_E_FORM_TIPOS = {
  dutos_gasodutos: 'RCA – Dutos e gasodutos (anexo completo)',
  geral: 'Geral – outras atividades da Listagem E',
} as const;

export type ListagemEFormTipo = keyof typeof LISTAGEM_E_FORM_TIPOS;

export const LISTAGEM_E_FORM_TIPO_PADRAO: ListagemEFormTipo = 'dutos_gasodutos';

export const LISTAGEM_E_ACTIVITY_BY_TIPO: Record<string, string> = {
  dutos_gasodutos: 'LISTAGEM E – DUTOS E GASODUTOS',
};

/** Códigos DN 217/17 do anexo de dutos/gasodutos */
export const LISTAGEM_E_CODIGOS_DUTOS_GASODUTOS = [
  'E-01-10-4',
  'E-01-11-2',
  'E-01-12-0',
  'E-01-13-9',
] as const;

/**
 * Mapeamento futuro: código DN → tipo de formulário.
 * Ex.: 'E-XX-XX-X': 'outro_especifico'
 */
export const LISTAGEM_E_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemEFormTipo>> = {
  'E-01-10-4': 'dutos_gasodutos',
  'E-01-11-2': 'dutos_gasodutos',
  'E-01-12-0': 'dutos_gasodutos',
  'E-01-13-9': 'dutos_gasodutos',
};

export function inferirFormularioListagemE(codigoDn?: string | null): ListagemEFormTipo {
  if (!codigoDn?.trim()) return LISTAGEM_E_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return LISTAGEM_E_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export const LISTAGEM_E_FORM_CONFIG: ListagemFormularioTipoConfig<ListagemEFormTipo> = {
  letter: 'E',
  defaultTipo: LISTAGEM_E_FORM_TIPO_PADRAO,
  activityByTipo: LISTAGEM_E_ACTIVITY_BY_TIPO,
};
