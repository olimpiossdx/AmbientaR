import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_C_FORM_TIPOS = {
  pneumaticos:
    'Formulário específico – Indústria da borracha – pneumáticos (fabricação e recauchutagem)',
  principal: 'Formulário completo – indústria de borracha (todos os subtipos)',
  geral: 'Geral – outras atividades da Listagem C',
} as const;

export type ListagemCFormTipo = keyof typeof LISTAGEM_C_FORM_TIPOS;

export const LISTAGEM_C_FORM_TIPO_PADRAO: ListagemCFormTipo = 'pneumaticos';

/** Códigos DN 217/17 – pneumáticos */
export const LISTAGEM_C_CODIGOS_PNEUMATICOS = ['C-02-02-1', 'C-02-03-8'] as const;

export const LISTAGEM_C_ACTIVITY_BY_TIPO: Record<string, string> = {
  pneumaticos: 'LISTAGEM C – INDÚSTRIA DE BORRACHA – PNEUMÁTICOS',
  principal: 'LISTAGEM C – INDÚSTRIA DE BORRACHA',
};

export const LISTAGEM_C_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemCFormTipo>> = {
  'C-02-02-1': 'pneumaticos',
  'C-02-03-8': 'pneumaticos',
};

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
