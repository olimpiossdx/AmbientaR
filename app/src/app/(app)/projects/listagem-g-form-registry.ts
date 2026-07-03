import { LISTAGEM_ACTIVITY_BY_CODE } from '@/lib/listagem-activities';
import { LISTAGEM_G_SUBACTIVITIES } from '@/lib/listagem-g/dn217-catalog';
import type { ListagemFormularioTipoConfig } from './use-listagem-formulario-tipo';

export const LISTAGEM_G_FORM_TIPOS = {
  culturas: 'Culturas anuais, perenes e olericultura',
  bovinocultura: 'Criação de bovinos',
  irrigados: 'Projetos agropecuários irrigados',
  silvicultura: 'Silvicultura e carvoejamento',
  graos: 'Beneficiamento e armazenamento de grãos',
  suinocultura: 'Suinocultura',
  avicultura: 'Avicultura',
  geral: 'Geral – outras atividades da Listagem G',
} as const;

export type ListagemGFormTipo = keyof typeof LISTAGEM_G_FORM_TIPOS;

export const LISTAGEM_G_FORM_TIPO_PADRAO: ListagemGFormTipo = 'culturas';

const FORMULARIO_PARA_SUBACTIVITY: Record<ListagemGFormTipo, string> = {
  culturas: LISTAGEM_G_SUBACTIVITIES[0],
  bovinocultura: LISTAGEM_G_SUBACTIVITIES[1],
  irrigados: LISTAGEM_G_SUBACTIVITIES[2],
  silvicultura: LISTAGEM_G_SUBACTIVITIES[3],
  graos: LISTAGEM_G_SUBACTIVITIES[4],
  suinocultura: LISTAGEM_G_SUBACTIVITIES[5],
  avicultura: LISTAGEM_G_SUBACTIVITIES[6],
  geral: LISTAGEM_G_SUBACTIVITIES[0],
};

export const LISTAGEM_G_ACTIVITY_BY_TIPO: Record<string, string> = {
  culturas: LISTAGEM_ACTIVITY_BY_CODE.G,
  bovinocultura: LISTAGEM_ACTIVITY_BY_CODE.G,
  irrigados: LISTAGEM_ACTIVITY_BY_CODE.G,
  silvicultura: LISTAGEM_ACTIVITY_BY_CODE.G,
  graos: LISTAGEM_ACTIVITY_BY_CODE.G,
  suinocultura: LISTAGEM_ACTIVITY_BY_CODE.G,
  avicultura: LISTAGEM_ACTIVITY_BY_CODE.G,
  geral: LISTAGEM_ACTIVITY_BY_CODE.G,
};

export const LISTAGEM_G_CODIGO_PARA_FORMULARIO: Partial<Record<string, ListagemGFormTipo>> = {
  'G-01-01-5': 'culturas',
  'G-01-03-1': 'culturas',
  'G-01-03-2': 'silvicultura',
  'G-02-02-1': 'avicultura',
  'G-02-04-6': 'suinocultura',
  'G-02-07-0': 'bovinocultura',
  'G-02-08-9': 'bovinocultura',
  'G-03-03-4': 'silvicultura',
  'G-03-04-2': 'silvicultura',
  'G-04-01-4': 'graos',
  'G-05-02-0': 'irrigados',
  'G-05-04-3': 'irrigados',
  'G-06-01-8': 'geral',
};

export function subatividadeParaFormularioListagemG(tipo: ListagemGFormTipo): string {
  return FORMULARIO_PARA_SUBACTIVITY[tipo];
}

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
