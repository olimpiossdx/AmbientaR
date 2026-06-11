import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_C_FORM_TIPOS = {
  pneumaticos:
    'Formulário específico – Indústria da borracha – pneumáticos (fabricação e recauchutagem)',
  plasticos: 'Formulário específico – Indústria de plásticos (moldagem e reciclagem)',
  papel: 'Formulário específico – Indústrias de papel e papelão',
  domissanitarios:
    'Formulário específico – Produtos domissanitários, sabões, detergentes e preparados para limpeza/polimento',
  principal: 'Formulário completo – indústria de borracha (todos os subtipos)',
  geral: 'Geral – outras atividades da Listagem C',
} as const;

export type ListagemCFormTipo = keyof typeof LISTAGEM_C_FORM_TIPOS;

export const LISTAGEM_C_FORM_TIPO_PADRAO: ListagemCFormTipo = 'pneumaticos';

/** Códigos DN 217/17 – pneumáticos */
export const LISTAGEM_C_CODIGOS_PNEUMATICOS = ['C-02-02-1', 'C-02-03-8'] as const;

/** Códigos DN 74/04 – indústria de plásticos */
export const LISTAGEM_C_CODIGOS_PLASTICOS = [
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

/** Códigos DN 74/04 – papel e papelão */
export const LISTAGEM_C_CODIGOS_PAPEL = ['C-01-01-5', 'C-01-02-3', 'C-01-03-1'] as const;

/** Códigos DN 74/04 – produtos domissanitários */
export const LISTAGEM_C_CODIGOS_DOMISSANITARIOS = ['C-04-11-1', 'C-04-12-1', 'C-04-13-0'] as const;

export const LISTAGEM_C_ACTIVITY_BY_TIPO: Record<string, string> = {
  pneumaticos: 'LISTAGEM C – INDÚSTRIA DE BORRACHA – PNEUMÁTICOS',
  plasticos: 'LISTAGEM C – INDÚSTRIA DE PLÁSTICOS',
  papel: 'LISTAGEM C – INDÚSTRIAS DE PAPEL E PAPELÃO',
  domissanitarios:
    'LISTAGEM C – PRODUTOS DOMISSANITÁRIOS, SABÕES, DETERGENTES E PREPARADOS PARA LIMPEZA E POLIMENTO',
  principal: 'LISTAGEM C – INDÚSTRIA DE BORRACHA',
};

export const LISTAGEM_C_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemCFormTipo>> = {
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
