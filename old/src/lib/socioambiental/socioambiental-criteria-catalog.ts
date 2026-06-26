/**
 * Catálogo fechado de critérios do Extrato Socioambiental (padrão Sicoob/AgroTools/Sicredi).
 * Alimenta blocos de UI, motor espacial, listas CPF/CNPJ e os três modos de relatório.
 */

import type { ModoRelatorioSocioambiental, ProdesModoCriterio } from "@/lib/types/analise-socioambiental";
import {
  FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
  FEDERAL_PRODES_CERRADO_LAYER_ID,
  FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID,
  FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
  FEDERAL_TI_LAYER_ID,
  FEDERAL_UC_LAYER_ID,
  IBAMA_EMBARGOS_LAYER_ID,
} from "@/lib/geospatial/wave-federal-catalog";
import {
  INCRA_ASSENTAMENTOS_LAYER_ID,
  INCRA_QUILOMBOLAS_LAYER_ID,
  IPHAN_SITIOS_LAYER_ID,
} from "@/lib/geospatial/wave-socioambiental-catalog";
export type SocioambientalReportBlockId =
  | "extrato_cadastro"
  | "desmatamento"
  | "embargos_sancoes"
  | "areas_protegidas"
  | "recursos_hidricos"
  | "contexto_ambiental"
  | "licenciamento_mg";

export type SocioambientalTipoConsulta =
  | "intersecao"
  | "buffer"
  | "proximidade"
  | "lista"
  | "car_historico"
  | "metadado"
  | "agregado";

export type SocioambientalProdesBioma = "cerrado" | "mata_atlantica" | "amazonia_legal";

export type SocioambientalCriterioFonte = {
  nome: string;
  url?: string;
  layerId?: string;
};

export type SocioambientalCriterioCatalogEntry = {
  id: string;
  label: string;
  reportBlockId: SocioambientalReportBlockId;
  tipoConsulta: SocioambientalTipoConsulta;
  fonte: SocioambientalCriterioFonte;
  /** Se true, Inapto neste critério impede conformidade plena no protocolo. */
  bloqueante: boolean;
  modosRelatorio: ModoRelatorioSocioambiental[];
  /** UFs onde o critério é aplicável; `BR` = todas. */
  ufsAplicaveis: string[] | "BR";
  faseImplementacao: 1 | 2 | 3 | 4 | 5;
  /** Resultado quando há sobreposição direta com o perímetro. */
  resultadoSobreposicao: "Inapto" | "Alerta";
  /** Resultado quando só há proximidade (sem sobreposição). */
  resultadoProximidade?: "Alerta";
  bufferKm?: number;
  proximidadeLimiteM?: number;
  prodesAno?: number;
  prodesBioma?: SocioambientalProdesBioma;
  /** Filtro de categoria UC (APA, ARIE, etc.) sobre stats da camada. */
  ucCategoriaFiltro?: RegExp;
  /** Filtro de situação TI (homologada / não homologada). */
  tiSituacaoFiltro?: RegExp;
  defaultSelected?: boolean;
  /** Critério derivado (ex.: protocolo Sicoob) — não consulta camada própria. */
  derivado?: boolean;
  motivoNaoAnalisado?: string;
};

export const SOCIOAMBIENTAL_BUFFER_KM_PADRAO = 3;
export const SOCIOAMBIENTAL_PROXIMIDADE_LIMITE_M = 3_000;

const MODOS_TODOS: ModoRelatorioSocioambiental[] = [
  "extrato_socioambiental",
  "extrato_risco_socioambiental",
  "extrato_completo",
];

const MODOS_EXTRATO: ModoRelatorioSocioambiental[] = [
  "extrato_socioambiental",
  "extrato_completo",
];

const MODOS_RISCO: ModoRelatorioSocioambiental[] = [
  "extrato_risco_socioambiental",
  "extrato_completo",
];

function prodesYearEntries(
  bioma: SocioambientalProdesBioma,
  layerId: string,
  title: string,
  years: number[],
): SocioambientalCriterioCatalogEntry[] {
  return years.map((ano) => ({
    id: `prodes_${bioma}_${ano}`,
    label: `PRODES ${title} — ${ano}`,
    reportBlockId: "desmatamento" as const,
    tipoConsulta: "intersecao" as const,
    fonte: {
      nome: "INPE TerraBrasilis",
      url: "https://terrabrasilis.dpi.inpe.br/",
      layerId,
    },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 2 as const,
    resultadoSobreposicao: "Inapto" as const,
    prodesAno: ano,
    prodesBioma: bioma,
    defaultSelected: true,
  }));
}

function prodesAgregadoEntry(
  bioma: SocioambientalProdesBioma,
  layerId: string,
  title: string,
): SocioambientalCriterioCatalogEntry {
  return {
    id: `prodes_${bioma}_agregado`,
    label: `PRODES ${title} (série agregada)`,
    reportBlockId: "desmatamento",
    tipoConsulta: "intersecao",
    fonte: {
      nome: "INPE TerraBrasilis",
      url: "https://terrabrasilis.dpi.inpe.br/",
      layerId,
    },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Inapto",
    prodesBioma: bioma,
    defaultSelected: true,
  };
}

const PRODES_CERRADO_ANOS = [2018, 2019, 2020, 2021, 2022, 2023];
const PRODES_AL_ANOS = Array.from({ length: 16 }, (_, i) => 2008 + i);

/** Critérios estáticos (sem PRODES por ano). */
const CRITERIOS_BASE: SocioambientalCriterioCatalogEntry[] = [
  // —— Cadastro e território ——
  {
    id: "car_sicar_imoveis",
    label: "Cadastro Rural (CAR/SICAR)",
    reportBlockId: "extrato_cadastro",
    tipoConsulta: "intersecao",
    fonte: {
      nome: "SICAR GeoServer",
      url: "https://www.car.gov.br/",
      layerId: "br_sicar_imoveis",
    },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
    defaultSelected: true,
  },
  {
    id: "car_app_hidrica",
    label: "APP hídrica (MapCAR)",
    reportBlockId: "extrato_cadastro",
    tipoConsulta: "intersecao",
    fonte: {
      nome: "IDE-Sisema MG",
      layerId: "mg_app_hidrica_mapcar",
    },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
    defaultSelected: true,
  },
  {
    id: "car_historico_omissao",
    label: "Histórico CAR (omissão de áreas de risco)",
    reportBlockId: "extrato_cadastro",
    tipoConsulta: "car_historico",
    fonte: { nome: "Snapshots AmbientaR (SICAR)" },
    bloqueante: false,
    modosRelatorio: MODOS_RISCO,
    ufsAplicaveis: "BR",
    faseImplementacao: 4,
    resultadoSobreposicao: "Alerta",
    defaultSelected: true,
  },
  {
    id: "territorio_bioma_pct",
    label: "Cruzamento bioma (% ha)",
    reportBlockId: "extrato_cadastro",
    tipoConsulta: "metadado",
    fonte: { nome: "IBGE / MapBiomas", layerId: "mg_bioma" },
    bloqueante: false,
    modosRelatorio: MODOS_RISCO,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 2,
    resultadoSobreposicao: "Alerta",
    defaultSelected: true,
  },

  // —— Agente / listas (Fase 3) ——
  {
    id: "mte_trabalho_escravo",
    label: "Trabalho escravo (MTE — lista)",
    reportBlockId: "embargos_sancoes",
    tipoConsulta: "lista",
    fonte: { nome: "Lista Suja MTE", url: "https://www.gov.br/trabalho-e-emprego/" },
    bloqueante: true,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 3,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "ibama_embargo_lista",
    label: "Embargos IBAMA (lista CPF/CNPJ)",
    reportBlockId: "embargos_sancoes",
    tipoConsulta: "lista",
    fonte: {
      nome: "IBAMA PAMGIA (SISCOM)",
      url: "https://pamgia.ibama.gov.br/",
    },
    bloqueante: true,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 3,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "icmbio_embargo_lista",
    label: "Embargos ICMBio (lista)",
    reportBlockId: "embargos_sancoes",
    tipoConsulta: "lista",
    fonte: {
      nome: "ICMBio INDE WFS",
      url: "https://geoservicos.inde.gov.br/geoserver/ICMBio/ows",
    },
    bloqueante: true,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 3,
    resultadoSobreposicao: "Inapto",
  },
  {
    id: "ibama_autuacoes_lista",
    label: "Autuações IBAMA (lista)",
    reportBlockId: "embargos_sancoes",
    tipoConsulta: "lista",
    fonte: { nome: "IBAMA PAMGIA (SISCOM)" },
    bloqueante: false,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 3,
    resultadoSobreposicao: "Inapto",
  },
  {
    id: "reserva_legal_documento",
    label: "Reserva Legal (documento CPF/CNPJ)",
    reportBlockId: "embargos_sancoes",
    tipoConsulta: "lista",
    fonte: {
      nome: "SICAR GeoServer",
      url: "https://geoserver.car.gov.br/geoserver/sicar/ows",
    },
    bloqueante: true,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 3,
    resultadoSobreposicao: "Inapto",
  },
  {
    id: "restricao_beneficiario_cpr",
    label: "Restrição por beneficiário (CPR)",
    reportBlockId: "embargos_sancoes",
    tipoConsulta: "lista",
    fonte: { nome: "Listas MTE / IBAMA / ICMBio (beneficiários CPR)" },
    bloqueante: true,
    modosRelatorio: MODOS_RISCO,
    ufsAplicaveis: "BR",
    faseImplementacao: 3,
    resultadoSobreposicao: "Inapto",
  },

  // —— Embargos polígono ——
  {
    id: "ibama_embargo_poligono",
    label: "Embargos IBAMA (polígono)",
    reportBlockId: "embargos_sancoes",
    tipoConsulta: "intersecao",
    fonte: { nome: "IBAMA PAMGIA", layerId: IBAMA_EMBARGOS_LAYER_ID },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 1,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "icmbio_embargo_poligono",
    label: "Embargos ICMBio (polígono)",
    reportBlockId: "embargos_sancoes",
    tipoConsulta: "intersecao",
    fonte: { nome: "ICMBio INDE", layerId: "br_icmbio_embargos" },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 1,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "sema_mt_embargo_poligono",
    label: "Embargos SEMA-MT (polígono)",
    reportBlockId: "embargos_sancoes",
    tipoConsulta: "intersecao",
    fonte: { nome: "SEMA-MT GeoServer" },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MT"],
    faseImplementacao: 5,
    resultadoSobreposicao: "Inapto",
    motivoNaoAnalisado: "Fora do escopo MG (expansão por UF).",
  },
  {
    id: "ldi_pa_poligono",
    label: "LDI Pará (polígono)",
    reportBlockId: "embargos_sancoes",
    tipoConsulta: "intersecao",
    fonte: { nome: "SEMAS-PA" },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["PA"],
    faseImplementacao: 5,
    resultadoSobreposicao: "Inapto",
    motivoNaoAnalisado: "Fora do escopo MG (expansão por UF).",
  },

  // —— Desmatamento ——
  {
    id: "mapbiomas_alerta_intersecao",
    label: "MapBiomas Alerta (sobreposição)",
    reportBlockId: "desmatamento",
    tipoConsulta: "intersecao",
    fonte: {
      nome: "MapBiomas Alerta",
      url: "https://alerta.mapbiomas.org/",
      layerId: FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
    },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 1,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "mapbiomas_alerta_proximidade",
    label: "MapBiomas Alerta (proximidade ≤ 3 km)",
    reportBlockId: "desmatamento",
    tipoConsulta: "proximidade",
    fonte: {
      nome: "MapBiomas Alerta",
      layerId: FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
    },
    bloqueante: false,
    modosRelatorio: MODOS_RISCO,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Inapto",
    resultadoProximidade: "Alerta",
    proximidadeLimiteM: SOCIOAMBIENTAL_PROXIMIDADE_LIMITE_M,
    defaultSelected: true,
  },

  // —— Áreas protegidas ——
  {
    id: "uc_federal_pamgia",
    label: "Unidades de Conservação (federal — PAMGIA)",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "MMA PAMGIA", layerId: FEDERAL_UC_LAYER_ID },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 1,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "uc_cnuc_mma",
    label: "Unidades de Conservação (CNUC MMA)",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "MMA INDE", layerId: "br_mma_uc_cnuc" },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 1,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "uc_estadual_mg",
    label: "Unidades de Conservação (estadual MG)",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_unidades_conservacao" },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "uc_apa",
    label: "Área de Proteção Ambiental (APA)",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "MMA CNUC", layerId: "br_mma_uc_cnuc" },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Inapto",
    ucCategoriaFiltro: /APA/i,
    defaultSelected: true,
  },
  {
    id: "uc_arie",
    label: "Área de Relevante Interesse Ecológico (ARIE)",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "MMA CNUC", layerId: "br_mma_uc_cnuc" },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Inapto",
    ucCategoriaFiltro: /ARIE|Área de Relevante/i,
    defaultSelected: true,
  },
  {
    id: "uc_reserva_particular",
    label: "Reservas particulares do patrimônio natural (RPPN)",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "MMA CNUC" },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 5,
    resultadoSobreposicao: "Inapto",
    motivoNaoAnalisado: "Camada RPPN dedicada — expansão Fase 5.",
  },
  {
    id: "icmbio_uc_federal",
    label: "UC federal (ICMBio INDE)",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "ICMBio", layerId: "br_icmbio_uc_federal" },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 1,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "ti_homologada",
    label: "Terra Indígena homologada",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "FUNAI PAMGIA", layerId: FEDERAL_TI_LAYER_ID },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Inapto",
    tiSituacaoFiltro: /homolog/i,
    defaultSelected: true,
  },
  {
    id: "ti_nao_homologada",
    label: "Terra Indígena não homologada",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "FUNAI PAMGIA", layerId: FEDERAL_TI_LAYER_ID },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Inapto",
    tiSituacaoFiltro: /n[aã]o\s*homolog|declarad|regulariz/i,
    defaultSelected: true,
  },

  // —— Comunidades ——
  {
    id: "quilombolas_intersecao",
    label: "Territórios quilombolas (sobreposição)",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "INCRA", layerId: INCRA_QUILOMBOLAS_LAYER_ID },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "assentamentos_intersecao",
    label: "Assentamentos da reforma agrária (sobreposição)",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "INCRA", layerId: INCRA_ASSENTAMENTOS_LAYER_ID },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },
  {
    id: "iphan_sitios_intersecao",
    label: "Sítios arqueológicos IPHAN (sobreposição)",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "intersecao",
    fonte: { nome: "IPHAN / PAMGIA", layerId: IPHAN_SITIOS_LAYER_ID },
    bloqueante: true,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Inapto",
    defaultSelected: true,
  },

  // —— Buffers 3 km (sempre Alerta) ——
  {
    id: "uc_buffer_3km",
    label: "UC — buffer 3 km",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "buffer",
    fonte: { nome: "MMA CNUC", layerId: "br_mma_uc_cnuc" },
    bloqueante: false,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Alerta",
    bufferKm: SOCIOAMBIENTAL_BUFFER_KM_PADRAO,
    defaultSelected: true,
  },
  {
    id: "ti_buffer_3km",
    label: "TI — buffer 3 km",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "buffer",
    fonte: { nome: "FUNAI", layerId: FEDERAL_TI_LAYER_ID },
    bloqueante: false,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Alerta",
    bufferKm: SOCIOAMBIENTAL_BUFFER_KM_PADRAO,
    defaultSelected: true,
  },
  {
    id: "quilombolas_buffer_3km",
    label: "Quilombolas — buffer 3 km",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "buffer",
    fonte: { nome: "INCRA", layerId: INCRA_QUILOMBOLAS_LAYER_ID },
    bloqueante: false,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Alerta",
    bufferKm: SOCIOAMBIENTAL_BUFFER_KM_PADRAO,
    defaultSelected: true,
  },
  {
    id: "assentamentos_buffer_3km",
    label: "Assentamentos — buffer 3 km",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "buffer",
    fonte: { nome: "INCRA", layerId: INCRA_ASSENTAMENTOS_LAYER_ID },
    bloqueante: false,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Alerta",
    bufferKm: SOCIOAMBIENTAL_BUFFER_KM_PADRAO,
    defaultSelected: true,
  },
  {
    id: "iphan_buffer_3km",
    label: "Sítios IPHAN — buffer 3 km",
    reportBlockId: "areas_protegidas",
    tipoConsulta: "buffer",
    fonte: { nome: "IPHAN / PAMGIA", layerId: IPHAN_SITIOS_LAYER_ID },
    bloqueante: false,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 2,
    resultadoSobreposicao: "Alerta",
    bufferKm: SOCIOAMBIENTAL_BUFFER_KM_PADRAO,
    defaultSelected: true,
  },

  // —— Recursos hídricos MG ——
  {
    id: "mg_hidrografia",
    label: "Hidrografia",
    reportBlockId: "recursos_hidricos",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_hidrografia" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_outorgas",
    label: "Outorgas IGAM",
    reportBlockId: "recursos_hidricos",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_outorgas_igam" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_massas_dagua",
    label: "Massas d'água (MG)",
    reportBlockId: "recursos_hidricos",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_massas_dagua" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_hidrografia_classe_especial",
    label: "Hidrografia — classe especial (MG)",
    reportBlockId: "recursos_hidricos",
    tipoConsulta: "intersecao",
    fonte: {
      nome: "IDE-Sisema MG",
      layerId: "mg_hidrografia_classe_especial",
    },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },

  // —— Contexto MG ——
  {
    id: "mg_contexto_bioma",
    label: "Bioma (MG)",
    reportBlockId: "contexto_ambiental",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_bioma" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_contexto_solos",
    label: "Solos (MG)",
    reportBlockId: "contexto_ambiental",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_solos" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_contexto_geologia",
    label: "Geologia (MG)",
    reportBlockId: "contexto_ambiental",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_geologia" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_contexto_geomorfologia",
    label: "Geomorfologia (MG)",
    reportBlockId: "contexto_ambiental",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_geomorfologia" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_contexto_pedologia",
    label: "Pedologia (MG)",
    reportBlockId: "contexto_ambiental",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_pedologia" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_contexto_inventario_florestal",
    label: "Inventário florestal (MG)",
    reportBlockId: "contexto_ambiental",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_inventario_florestal" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_contexto_fauna",
    label: "Fauna (MG)",
    reportBlockId: "contexto_ambiental",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_fauna" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_contexto_zee",
    label: "ZEE — zonas (MG)",
    reportBlockId: "contexto_ambiental",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_zee_zonas" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_contexto_icms_ecologico",
    label: "ICMS ecológico (MG)",
    reportBlockId: "contexto_ambiental",
    tipoConsulta: "intersecao",
    fonte: { nome: "IDE-Sisema MG", layerId: "mg_icms_ecologico" },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },

  // —— Licenciamento MG ——
  {
    id: "mg_licenciamento",
    label: "Empreendimentos licenciados (MG)",
    reportBlockId: "licenciamento_mg",
    tipoConsulta: "intersecao",
    fonte: {
      nome: "IDE-Sisema MG",
      layerId: "mg_empreendimentos_licenciados",
    },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },
  {
    id: "mg_licenciamento_municipal",
    label: "Licenciamento municipal (MG)",
    reportBlockId: "licenciamento_mg",
    tipoConsulta: "intersecao",
    fonte: {
      nome: "IDE-Sisema MG",
      layerId: "mg_licenciamento_municipal",
    },
    bloqueante: false,
    modosRelatorio: MODOS_TODOS,
    ufsAplicaveis: ["MG"],
    faseImplementacao: 1,
    resultadoSobreposicao: "Alerta",
  },

  // —— Protocolo agregado ——
  {
    id: "protocolo_sicoob",
    label: "Protocolo Sicoob (agregado)",
    reportBlockId: "desmatamento",
    tipoConsulta: "agregado",
    fonte: { nome: "AmbientaR — regra de protocolo" },
    bloqueante: true,
    modosRelatorio: MODOS_EXTRATO,
    ufsAplicaveis: "BR",
    faseImplementacao: 5,
    resultadoSobreposicao: "Inapto",
    derivado: true,
  },
];

const PRODES_CRITERIOS_POR_ANO: SocioambientalCriterioCatalogEntry[] = [
  ...prodesYearEntries(
    "cerrado",
    FEDERAL_PRODES_CERRADO_LAYER_ID,
    "Cerrado",
    PRODES_CERRADO_ANOS,
  ),
  ...prodesYearEntries(
    "mata_atlantica",
    FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
    "Mata Atlântica",
    PRODES_CERRADO_ANOS,
  ),
  ...prodesYearEntries(
    "amazonia_legal",
    FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID,
    "Amazônia Legal",
    PRODES_AL_ANOS,
  ),
];

const PRODES_CRITERIOS_AGREGADOS: SocioambientalCriterioCatalogEntry[] = [
  prodesAgregadoEntry(
    "cerrado",
    FEDERAL_PRODES_CERRADO_LAYER_ID,
    "Cerrado",
  ),
  prodesAgregadoEntry(
    "mata_atlantica",
    FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
    "Mata Atlântica",
  ),
  prodesAgregadoEntry(
    "amazonia_legal",
    FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID,
    "Amazônia Legal",
  ),
];

export const SOCIOAMBIENTAL_CRITERIA_CATALOG: SocioambientalCriterioCatalogEntry[] =
  [
    ...CRITERIOS_BASE,
    ...PRODES_CRITERIOS_POR_ANO,
    ...PRODES_CRITERIOS_AGREGADOS,
  ];

const CRITERIA_BY_ID = new Map(
  SOCIOAMBIENTAL_CRITERIA_CATALOG.map((c) => [c.id, c]),
);

export function getCriterioById(
  id: string,
): SocioambientalCriterioCatalogEntry | undefined {
  return CRITERIA_BY_ID.get(id);
}

export function getCriteriaForReportBlock(
  blockId: SocioambientalReportBlockId,
): SocioambientalCriterioCatalogEntry[] {
  return SOCIOAMBIENTAL_CRITERIA_CATALOG.filter((c) => c.reportBlockId === blockId);
}

export function resolveLayerIdsFromCriteria(
  criteria: SocioambientalCriterioCatalogEntry[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of criteria) {
    const layerId = c.fonte.layerId;
    if (!layerId || seen.has(layerId)) continue;
    seen.add(layerId);
    out.push(layerId);
  }
  return out;
}

export function resolveActiveCriteria(params: {
  blockIds: SocioambientalReportBlockId[];
  prodesModo: ProdesModoCriterio;
  uf?: string;
}): SocioambientalCriterioCatalogEntry[] {
  const blockSet = new Set(params.blockIds);
  return SOCIOAMBIENTAL_CRITERIA_CATALOG.filter((c) => {
    if (!blockSet.has(c.reportBlockId)) return false;
    if (c.derivado) return false;
    if (c.prodesBioma) {
      if (params.prodesModo === "por_ano" && !c.prodesAno) return false;
      if (params.prodesModo === "agregado" && c.prodesAno) return false;
    }
    if (params.uf && c.ufsAplicaveis !== "BR") {
      if (!c.ufsAplicaveis.includes(params.uf)) return false;
    }
    return true;
  });
}

export function resolveLayerIdsForBlocks(
  blockIds: SocioambientalReportBlockId[],
  prodesModo: ProdesModoCriterio = "agregado",
  uf?: string,
): string[] {
  const criteria = resolveActiveCriteria({ blockIds, prodesModo, uf });
  return resolveLayerIdsFromCriteria(criteria);
}

export function countCriteriaForBlocks(
  blockIds: SocioambientalReportBlockId[],
  prodesModo: ProdesModoCriterio = "agregado",
  uf?: string,
): number {
  return resolveActiveCriteria({ blockIds, prodesModo, uf }).length;
}
