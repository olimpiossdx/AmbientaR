import { RCA_LISTAGEM_B_SUBACTIVITIES } from '@/lib/rca/rca-listagem-b-catalog';

export const RCA_LISTAGEM_B_FORM_TIPOS = {
  telhas_tijolos: 'RCA – Telhas, tijolos e artigos de barro cozido',
  materiais_ceramicos: 'RCA – Fabricação de materiais cerâmicos',
  siderurgia: 'RCA – Siderurgia (produção de ferro gusa)',
  ligas_ferrosas: 'RCA específico – Produção de ligas ferrosas (ferro ligas)',
  fundidos_ferro_aco: 'RCA específico – Fundidos de ferro e aço',
  fundidos_nao_ferrosos: 'RCA específico – Fundidos de metais não ferrosos',
  moveis: 'RCA – Fabricação de móveis',
} as const;

export type RcaListagemBFormTipo = keyof typeof RCA_LISTAGEM_B_FORM_TIPOS;

export const RCA_LISTAGEM_B_FORM_TIPO_PADRAO: RcaListagemBFormTipo = 'telhas_tijolos';

export const RCA_LISTAGEM_B_TR_FILES: Record<RcaListagemBFormTipo, string | null> = {
  telhas_tijolos: 'formulario_rca_atividades_industriais_versao_1_2006.doc',
  materiais_ceramicos: 'formulario_rca_atividades_industriais_versao_1_2006.doc',
  siderurgia: 'formulario_rca_atividades_industriais_versao_1_2006.doc',
  ligas_ferrosas: 'rca-producao-de-ligas-ferrosas-ferro-ligas.doc',
  fundidos_ferro_aco: 'rca-producao-de-fundidos-de-ferro-e-aco.doc',
  fundidos_nao_ferrosos: 'rca-producao-de-fundidos-de-nao-ferrosos.doc',
  moveis: 'formulario_rca_atividades_industriais_versao_1_2006.doc',
};

const SUBACTIVITY_PARA_FORMULARIO: Record<string, RcaListagemBFormTipo> = {
  'fabricacao de telhas, tijolos e outros artigos de barro cozido': 'telhas_tijolos',
  'fabricacao de materiais ceramicos': 'materiais_ceramicos',
  'siderurgia - producao de ferro gusa': 'siderurgia',
  'producao de ligas metalicas (ferro ligas)': 'ligas_ferrosas',
  'producao de fundidos de ferro e aco': 'fundidos_ferro_aco',
  'producao de fundidos de metais nao-ferrosos, inclusive ligas, com e sem tratamento quimico superficial e/ou galvanotecnico, inclusive a partir da reciclagem.':
    'fundidos_nao_ferrosos',
  'fabricacao de moveis': 'moveis',
};

const FORMULARIO_PARA_SUBACTIVITY: Record<RcaListagemBFormTipo, string> = {
  telhas_tijolos: RCA_LISTAGEM_B_SUBACTIVITIES[0],
  materiais_ceramicos: RCA_LISTAGEM_B_SUBACTIVITIES[1],
  siderurgia: RCA_LISTAGEM_B_SUBACTIVITIES[2],
  ligas_ferrosas: RCA_LISTAGEM_B_SUBACTIVITIES[3],
  fundidos_ferro_aco: RCA_LISTAGEM_B_SUBACTIVITIES[4],
  fundidos_nao_ferrosos: RCA_LISTAGEM_B_SUBACTIVITIES[5],
  moveis: RCA_LISTAGEM_B_SUBACTIVITIES[6],
};

function normalizarSubatividade(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferirFormularioRcaListagemB(subActivity?: string | null): RcaListagemBFormTipo {
  if (!subActivity?.trim()) return RCA_LISTAGEM_B_FORM_TIPO_PADRAO;
  const key = normalizarSubatividade(subActivity);
  return SUBACTIVITY_PARA_FORMULARIO[key] ?? RCA_LISTAGEM_B_FORM_TIPO_PADRAO;
}

export function subatividadeParaFormularioRcaListagemB(tipo: RcaListagemBFormTipo): string {
  return FORMULARIO_PARA_SUBACTIVITY[tipo];
}

export function normalizarFormularioTipoRcaListagemB(
  tipo?: string | null,
): RcaListagemBFormTipo {
  if (tipo && tipo in RCA_LISTAGEM_B_FORM_TIPOS) {
    return tipo as RcaListagemBFormTipo;
  }
  return RCA_LISTAGEM_B_FORM_TIPO_PADRAO;
}

export function extrairCodigoDnDoProjectB(project: Record<string, unknown>): string | null {
  const listagemB = project.listagemB as Record<string, unknown> | undefined;
  const atividades = listagemB?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  const outras = listagemB?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  return codigoOutra?.trim() || null;
}
