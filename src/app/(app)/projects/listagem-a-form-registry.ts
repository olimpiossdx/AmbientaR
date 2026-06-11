import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_A_FORM_TIPOS = {
  lavra_subterranea: 'Formulário específico – Lavra subterrânea (TR completo)',
  rochas_ornamentais:
    'Formulário específico – Lavra de rochas ornamentais (ardósias, mármores, granitos e quartzitos)',
  principal: 'Formulário completo – atividades minerárias (em uso)',
  geral: 'Geral – outras atividades da Listagem A',
} as const;

export type ListagemAFormTipo = keyof typeof LISTAGEM_A_FORM_TIPOS;

export const LISTAGEM_A_FORM_TIPO_PADRAO: ListagemAFormTipo = 'principal';

export const LISTAGEM_A_ACTIVITY_BY_TIPO: Record<string, string> = {
  lavra_subterranea: 'LISTAGEM A – ATIVIDADES MINERÁRIAS',
  rochas_ornamentais: 'LISTAGEM A – ATIVIDADES MINERÁRIAS',
  principal: 'LISTAGEM A – ATIVIDADES MINERÁRIAS',
};

/** Códigos DN 217/17 associados à lavra de rochas ornamentais */
export const LISTAGEM_A_CODIGOS_ROCHAS_ORNAMENTAIS = [
  'A-02-06-2',
  'A-05-04-5',
  'A-05-06-3',
] as const;

/** Códigos DN 217/17 associados à lavra subterrânea */
export const LISTAGEM_A_CODIGOS_LAVRA_SUBTERRANEA = ['A-01-01-1', 'A-01-01-2'] as const;

export const LISTAGEM_A_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemAFormTipo>> = {
  'A-01-01-1': 'lavra_subterranea',
  'A-01-01-2': 'lavra_subterranea',
  'A-02-06-2': 'rochas_ornamentais',
  'A-05-04-5': 'rochas_ornamentais',
  'A-05-06-3': 'rochas_ornamentais',
};

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
