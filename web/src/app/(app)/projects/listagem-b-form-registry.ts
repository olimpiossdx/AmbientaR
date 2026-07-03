import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_B_FORM_TIPOS = {
  ferroligas:
    'Formulário específico – Produção de ligas ferrosas (ferro ligas), silício metálico e ligas à base de silício',
  fundidos_ferro_aco:
    'Formulário específico – Produção de fundidos de ferro e aço (com/sem tratamento químico superficial)',
  fundidos_nao_ferrosos:
    'Formulário específico – Fundidos de metais não ferrosos (com/sem tratamento químico e galvanotécnico)',
  principal: 'Formulário completo – atividades industriais (em uso)',
  geral: 'Geral – outras atividades da Listagem B',
} as const;

export type ListagemBFormTipo = keyof typeof LISTAGEM_B_FORM_TIPOS;

export const LISTAGEM_B_FORM_TIPO_PADRAO: ListagemBFormTipo = 'principal';

export const LISTAGEM_B_ACTIVITY_BY_TIPO: Record<string, string> = {
  ferroligas: 'LISTAGEM B – ATIVIDADES INDUSTRIAIS',
  fundidos_ferro_aco: 'LISTAGEM B – ATIVIDADES INDUSTRIAIS',
  fundidos_nao_ferrosos: 'LISTAGEM B – ATIVIDADES INDUSTRIAIS',
  principal: 'LISTAGEM B – ATIVIDADES INDUSTRIAIS',
};

/** Código DN 217/17 – produção de ligas ferrosas (ferroligas) */
export const LISTAGEM_B_CODIGOS_FERROLIGAS = ['B-03-04-2'] as const;

/** Códigos DN 217/17 – fundidos de ferro e aço */
export const LISTAGEM_B_CODIGOS_FUNDIDOS_FERRO_ACO = ['B-03-07-7', 'B-03-08-5'] as const;

/** Códigos DN 217/17 – fundidos de metais não ferrosos */
export const LISTAGEM_B_CODIGOS_FUNDIDOS_NAO_FERROSOS = ['B-04-04-9', 'B-04-05-7'] as const;

export const LISTAGEM_B_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemBFormTipo>> = {
  'B-03-04-2': 'ferroligas',
  'B-03-07-7': 'fundidos_ferro_aco',
  'B-03-08-5': 'fundidos_ferro_aco',
  'B-04-04-9': 'fundidos_nao_ferrosos',
  'B-04-05-7': 'fundidos_nao_ferrosos',
};

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
