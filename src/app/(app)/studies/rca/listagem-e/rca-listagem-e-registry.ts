import {
  RCA_LISTAGEM_E_CODIGOS_GASODUTO,
  RCA_LISTAGEM_E_SUBACTIVITIES,
} from '@/lib/rca/rca-listagem-e-catalog';

export const RCA_LISTAGEM_E_FORM_TIPOS = {
  rodovias: 'RCA específico – Rodovias',
  gasoduto: 'RCA específico – Gasoduto, oleodutos e minerodutos',
  recapacitacao_cgh_pch: 'RCA – Recapacitação / repotenciação de CGHs e PCHs',
  biogas_aterro: 'RCA específico – Biogás de aterro sanitário',
  biometanizacao_rsu: 'RCA específico – Biometanização de RSU',
  tratamento_termico_rsu: 'RCA específico – Tratamento térmico de RSU',
  barragem_saneamento: 'RCA específico – Barragem de saneamento',
  abastecimento_agua: 'RCA – Sistema de abastecimento de água',
  esgotamento_sanitario: 'RCA – Sistema de esgotamento sanitário',
  tratamento_rsu: 'RCA – Tratamento e disposição final de RSU',
  solo_urbano: 'RCA específico – Solo urbano residencial',
  dragagem: "RCA – Dragagem em corpos d'água",
} as const;

export type RcaListagemEFormTipo = keyof typeof RCA_LISTAGEM_E_FORM_TIPOS;

export const RCA_LISTAGEM_E_FORM_TIPO_PADRAO: RcaListagemEFormTipo = 'rodovias';

export const RCA_LISTAGEM_E_TR_FILES: Record<RcaListagemEFormTipo, string | null> = {
  rodovias: 'rca-rodovias.doc',
  gasoduto:
    'rca-gasoduto-transporte-de-produtos-quimicos-e-oleodutos-e-minerodutos.doc',
  recapacitacao_cgh_pch: null,
  biogas_aterro: 'tr-rca-biogas.pdf',
  biometanizacao_rsu: 'tr-rca-biometanizacao.pdf',
  tratamento_termico_rsu: 'tr-rca-tratamento-termico-1-11-2011.pdf',
  barragem_saneamento: '02-rca-barragem-saneamento.doc',
  abastecimento_agua: 'rca - san001-.pdf',
  esgotamento_sanitario: 'rca - san001-.pdf',
  tratamento_rsu: null,
  solo_urbano: 'RCA_parcelamento_residencial.pdf',
  dragagem: null,
};

const SUBACTIVITY_PARA_FORMULARIO: Record<string, RcaListagemEFormTipo> = {
  rodovias: 'rodovias',
  'gasoduto, transporte de produtos quimicos e oleodutos e minerodutos': 'gasoduto',
  'recapacitacao e/ou repotenciacao de cghs e pchs': 'recapacitacao_cgh_pch',
  'projetos de aproveitamento de biogas de aterro sanitario com ou sem geracao de energia eletrica':
    'biogas_aterro',
  'sistema de biometanizacao de residuos solidos urbanos com geracao de energia eletrica':
    'biometanizacao_rsu',
  'sistema de tratamento termico de residuos solidos urbanos com geracao de energia eletrica':
    'tratamento_termico_rsu',
  'barragem de saneamento': 'barragem_saneamento',
  'sistema de abastecimento de agua': 'abastecimento_agua',
  'sistema de esgotamento sanitario': 'esgotamento_sanitario',
  'sistemas de tratamento e disposicao final de residuos solidos urbanos': 'tratamento_rsu',
  'solo urbano exclusiva ou predominantemente residencial': 'solo_urbano',
  'dragagem em corpos dagua': 'dragagem',
};

const FORMULARIO_PARA_SUBACTIVITY: Record<RcaListagemEFormTipo, string> = {
  rodovias: RCA_LISTAGEM_E_SUBACTIVITIES[0],
  gasoduto: RCA_LISTAGEM_E_SUBACTIVITIES[1],
  recapacitacao_cgh_pch: RCA_LISTAGEM_E_SUBACTIVITIES[2],
  biogas_aterro: RCA_LISTAGEM_E_SUBACTIVITIES[3],
  biometanizacao_rsu: RCA_LISTAGEM_E_SUBACTIVITIES[4],
  tratamento_termico_rsu: RCA_LISTAGEM_E_SUBACTIVITIES[5],
  barragem_saneamento: RCA_LISTAGEM_E_SUBACTIVITIES[6],
  abastecimento_agua: RCA_LISTAGEM_E_SUBACTIVITIES[7],
  esgotamento_sanitario: RCA_LISTAGEM_E_SUBACTIVITIES[8],
  tratamento_rsu: RCA_LISTAGEM_E_SUBACTIVITIES[9],
  solo_urbano: RCA_LISTAGEM_E_SUBACTIVITIES[10],
  dragagem: RCA_LISTAGEM_E_SUBACTIVITIES[11],
};

const CODIGO_PARA_FORMULARIO: Partial<Record<string, RcaListagemEFormTipo>> = {
  'E-01-10-4': 'gasoduto',
  'E-01-11-2': 'gasoduto',
  'E-01-12-0': 'gasoduto',
  'E-01-13-9': 'gasoduto',
};

function normalizarSubatividade(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferirFormularioRcaListagemE(
  subActivity?: string | null,
  codigoDn?: string | null,
): RcaListagemEFormTipo {
  const codigo = codigoDn?.trim().toUpperCase();
  if (codigo && CODIGO_PARA_FORMULARIO[codigo]) {
    return CODIGO_PARA_FORMULARIO[codigo]!;
  }
  if (!subActivity?.trim()) return RCA_LISTAGEM_E_FORM_TIPO_PADRAO;
  const key = normalizarSubatividade(subActivity);
  return SUBACTIVITY_PARA_FORMULARIO[key] ?? RCA_LISTAGEM_E_FORM_TIPO_PADRAO;
}

export function subatividadeParaFormularioRcaListagemE(tipo: RcaListagemEFormTipo): string {
  return FORMULARIO_PARA_SUBACTIVITY[tipo];
}

export function normalizarFormularioTipoRcaListagemE(
  tipo?: string | null,
): RcaListagemEFormTipo {
  if (tipo && tipo in RCA_LISTAGEM_E_FORM_TIPOS) {
    return tipo as RcaListagemEFormTipo;
  }
  return RCA_LISTAGEM_E_FORM_TIPO_PADRAO;
}

export function extrairCodigoDnDoProjectE(project: Record<string, unknown>): string | null {
  const listagemE = project.listagemE as Record<string, unknown> | undefined;
  const atividades = listagemE?.atividadesPrincipal as Array<{ codigo?: string }> | undefined;
  const primeiro = atividades?.[0]?.codigo;
  if (primeiro?.trim()) return primeiro.trim();
  const outras = listagemE?.outrasAtividades as Array<{ codigo?: string }> | undefined;
  const codigoOutra = outras?.[0]?.codigo;
  if (codigoOutra?.trim()) return codigoOutra.trim();
  const atividadePrincipal = listagemE?.atividadePrincipal as
    | Record<string, { codigo?: string; ativa?: boolean }>
    | undefined;
  if (atividadePrincipal && typeof atividadePrincipal === 'object') {
    for (const entry of Object.values(atividadePrincipal)) {
      if (entry?.ativa && entry.codigo?.trim()) return entry.codigo.trim();
    }
  }
  return null;
}

export function codigoEhGasodutoListagemE(codigo?: string | null): boolean {
  if (!codigo?.trim()) return false;
  return (RCA_LISTAGEM_E_CODIGOS_GASODUTO as readonly string[]).includes(
    codigo.trim().toUpperCase(),
  );
}
