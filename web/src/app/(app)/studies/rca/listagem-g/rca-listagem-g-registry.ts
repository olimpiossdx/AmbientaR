import { RCA_LISTAGEM_G_SUBACTIVITIES } from '@/lib/rca/rca-listagem-g-catalog';

export const RCA_LISTAGEM_G_FORM_TIPOS = {
  culturas: 'RCA – Culturas anuais, perenes e olericultura',
  bovinocultura: 'RCA específico – Criação de bovinos',
  irrigados: 'RCA – Projetos agropecuários irrigados',
  silvicultura: 'RCA específico – Silvicultura e carvoejamento',
  graos: 'RCA – Processamento, beneficiamento e armazenamento de grãos',
  suinocultura: 'RCA – Suinocultura',
  avicultura: 'RCA – Avicultura',
} as const;

export type RcaListagemGFormTipo = keyof typeof RCA_LISTAGEM_G_FORM_TIPOS;

export const RCA_LISTAGEM_G_FORM_TIPO_PADRAO: RcaListagemGFormTipo = 'culturas';

export const RCA_LISTAGEM_G_TR_FILES: Record<RcaListagemGFormTipo, string | null> = {
  culturas: null,
  bovinocultura: '05-rca-bovinocultura.doc',
  irrigados: null,
  silvicultura: '04-rca-silvicultura-carvoejamento.doc',
  graos: null,
  suinocultura: null,
  avicultura: null,
};

const SUBACTIVITY_PARA_FORMULARIO: Record<string, RcaListagemGFormTipo> = {
  'cultura anuais, perenes e olericultura': 'culturas',
  'criacao de bovinos': 'bovinocultura',
  'projetos agropecuarios irrigados': 'irrigados',
  'silvicultura e carvoejamento': 'silvicultura',
  'processamento, beneficiamento e armazenamento de graos': 'graos',
  suinocultura: 'suinocultura',
  avicultura: 'avicultura',
};

const FORMULARIO_PARA_SUBACTIVITY: Record<RcaListagemGFormTipo, string> = {
  culturas: RCA_LISTAGEM_G_SUBACTIVITIES[0],
  bovinocultura: RCA_LISTAGEM_G_SUBACTIVITIES[1],
  irrigados: RCA_LISTAGEM_G_SUBACTIVITIES[2],
  silvicultura: RCA_LISTAGEM_G_SUBACTIVITIES[3],
  graos: RCA_LISTAGEM_G_SUBACTIVITIES[4],
  suinocultura: RCA_LISTAGEM_G_SUBACTIVITIES[5],
  avicultura: RCA_LISTAGEM_G_SUBACTIVITIES[6],
};

function normalizarSubatividade(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferirFormularioRcaListagemG(
  subActivity?: string | null,
  _codigoDn?: string | null,
): RcaListagemGFormTipo {
  if (!subActivity?.trim()) return RCA_LISTAGEM_G_FORM_TIPO_PADRAO;
  const key = normalizarSubatividade(subActivity);
  return SUBACTIVITY_PARA_FORMULARIO[key] ?? RCA_LISTAGEM_G_FORM_TIPO_PADRAO;
}

export function subatividadeParaFormularioRcaListagemG(tipo: RcaListagemGFormTipo): string {
  return FORMULARIO_PARA_SUBACTIVITY[tipo];
}

export function normalizarFormularioTipoRcaListagemG(
  tipo?: string | null,
): RcaListagemGFormTipo {
  if (tipo && tipo in RCA_LISTAGEM_G_FORM_TIPOS) {
    return tipo as RcaListagemGFormTipo;
  }
  return RCA_LISTAGEM_G_FORM_TIPO_PADRAO;
}

export function extrairCodigoDnDoProjectG(project: Record<string, unknown>): string | null {
  const listagemG = project.listagemG as Record<string, unknown> | undefined;
  const atividades = listagemG?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  const geral = listagemG?.geral as Record<string, unknown> | undefined;
  const geralAtividades = geral?.atividades as Array<{ codigo?: string }> | undefined;
  const codigoGeral = geralAtividades?.[0]?.codigo;
  if (codigoGeral?.trim()) return codigoGeral.trim();
  const outras = listagemG?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  return codigoOutra?.trim() || null;
}
