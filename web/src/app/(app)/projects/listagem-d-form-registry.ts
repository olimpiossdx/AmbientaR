import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_D_FORM_TIPOS = {
  aguardenete_cana: 'RCA – Aguardente de cana-de-açúcar (anexo completo)',
  geral: 'Geral – outras atividades da Listagem D',
} as const;

export type ListagemDFormTipo = keyof typeof LISTAGEM_D_FORM_TIPOS;

export const LISTAGEM_D_FORM_TIPO_PADRAO: ListagemDFormTipo = 'aguardenete_cana';

export const LISTAGEM_D_CODIGO_AGUARDENTE = 'D-02-02-1';

export const LISTAGEM_D_ACTIVITY_BY_TIPO: Record<string, string> = {
  aguardenete_cana: 'LISTAGEM D – RCA AGUARDENTE DE CANA',
};

export const LISTAGEM_D_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemDFormTipo>> = {
  'D-02-02-1': 'aguardenete_cana',
};

export function inferirFormularioListagemD(codigoDn?: string | null): ListagemDFormTipo {
  if (!codigoDn?.trim()) return LISTAGEM_D_FORM_TIPO_PADRAO;
  const normalizado = codigoDn.trim().toUpperCase();
  return LISTAGEM_D_CODIGO_PARA_FORMULARIO[normalizado] ?? 'geral';
}

export const LISTAGEM_D_FORM_CONFIG: ListagemFormularioTipoConfig<ListagemDFormTipo> = {
  letter: 'D',
  defaultTipo: LISTAGEM_D_FORM_TIPO_PADRAO,
  activityByTipo: LISTAGEM_D_ACTIVITY_BY_TIPO,
};
