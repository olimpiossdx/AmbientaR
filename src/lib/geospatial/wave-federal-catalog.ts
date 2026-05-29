/**
 * Camadas federais — módulo Análise Geoespacial (IA).
 * Separado do MCA e do catálogo estadual MG.
 */

import {
  resolveUfsForBbox,
  sicarTypeNameForUf,
} from "@/lib/geospatial/sicar-uf-bounds";
import type { WaveACatalogEntry } from "@/lib/geospatial/wave-a-catalog";

export const SICAR_WFS = "https://geoserver.car.gov.br/geoserver/sicar/ows";

export const IBAMA_SISCOM_WFS =
  "https://siscom.ibama.gov.br/geoserver/publica/ows";

export const TERRABRASILIS_WFS =
  "https://terrabrasilis.dpi.inpe.br/geoserver/ows";

export const PAMGIA_UC_LAYER_URL =
  "https://pamgia.ibama.gov.br/server/rest/services/BasesSincronizadas/lim_unidades_conserva%C3%A7%C3%A3o_mma_a/FeatureServer/0";

export const PAMGIA_TI_LAYER_URL =
  "https://pamgia.ibama.gov.br/server/rest/services/BasesSincronizadas/lim_terra_indigena_funai_a/FeatureServer/0";

export const IBAMA_EMBARGOS_LAYER_ID = "br_ibama_embargos";
export const FEDERAL_UC_LAYER_ID = "br_uc_mma";
export const FEDERAL_TI_LAYER_ID = "br_ti_funai";
export const FEDERAL_PRODES_CERRADO_LAYER_ID = "br_prodes_cerrado";
export const FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID = "br_prodes_mata_atlantica";

/** Áreas de embargo administrativo IBAMA (SISCOM / PAMGIA). */
export const IBAMA_EMBARGOS_LAYER: WaveACatalogEntry = {
  layerId: IBAMA_EMBARGOS_LAYER_ID,
  title: "Embargos IBAMA (SISCOM — áreas embargadas)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["publica:vw_brasil_adm_embargo_a"],
  labelFields: [
    "des_infracao",
    "DES_INFRACAO",
    "sit_embarga_poligono",
    "SIT_EMBARGA_POLIGONO",
    "status_tad",
    "STATUS_TAD",
    "sig_uf",
    "SIG_UF",
    "nom_municipio",
    "NOM_MUNICIPIO",
    "numero_tad",
    "NUMERO_TAD",
    "orgao",
    "ORGAO",
  ],
  wfsBaseUrls: [IBAMA_SISCOM_WFS],
  bboxMarginDegrees: 0.03,
  maxWfsFeatures: 80,
};

/** Unidades de conservação (MMA / CNUC — PAMGIA). */
export const FEDERAL_UC_LAYER: WaveACatalogEntry = {
  layerId: FEDERAL_UC_LAYER_ID,
  title: "Unidades de conservação (MMA / CNUC)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["pamgia:lim_unidades_conservacao_mma_a"],
  labelFields: [
    "nome_uc",
    "NOME_UC",
    "categoria",
    "CATEGORIA",
    "grupo",
    "GRUPO",
    "esfera",
    "ESFERA",
    "situacao",
    "SITUACAO",
    "uf",
    "UF",
    "municipio",
    "MUNICIPIO",
  ],
  wfsBaseUrls: [],
  arcgisLayerUrl: PAMGIA_UC_LAYER_URL,
  bboxMarginDegrees: 0.04,
  maxWfsFeatures: 100,
};

/** Terras indígenas (FUNAI — PAMGIA). */
export const FEDERAL_TI_LAYER: WaveACatalogEntry = {
  layerId: FEDERAL_TI_LAYER_ID,
  title: "Terras indígenas (FUNAI)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["pamgia:lim_terra_indigena_funai_a"],
  labelFields: [
    "terrai_nom",
    "TERRAI_NOM",
    "etnia_nome",
    "ETNIA_NOME",
    "modalidade",
    "MODALIDADE",
    "municipio_",
    "MUNICIPIO_",
    "dominio_un",
    "DOMINIO_UN",
    "faixa_fron",
    "FAIXA_FRON",
  ],
  wfsBaseUrls: [],
  arcgisLayerUrl: PAMGIA_TI_LAYER_URL,
  bboxMarginDegrees: 0.05,
  maxWfsFeatures: 80,
};

/** Supressão de vegetação — PRODES Cerrado (INPE / TerraBrasilis). */
export const FEDERAL_PRODES_CERRADO_LAYER: WaveACatalogEntry = {
  layerId: FEDERAL_PRODES_CERRADO_LAYER_ID,
  title: "Desmatamento PRODES — Cerrado (INPE)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["prodes-cerrado-nb:yearly_deforestation"],
  labelFields: [
    "year",
    "YEAR",
    "class_name",
    "CLASS_NAME",
    "main_class",
    "MAIN_CLASS",
    "state",
    "STATE",
    "image_date",
    "IMAGE_DATE",
  ],
  wfsBaseUrls: [TERRABRASILIS_WFS],
  bboxMarginDegrees: 0.06,
  maxWfsFeatures: 60,
};

/** Supressão de vegetação — PRODES Mata Atlântica (INPE / TerraBrasilis). */
export const FEDERAL_PRODES_MATA_ATLANTICA_LAYER: WaveACatalogEntry = {
  layerId: FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
  title: "Desmatamento PRODES — Mata Atlântica (INPE)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["prodes-mata-atlantica-nb:yearly_deforestation"],
  labelFields: [
    "year",
    "YEAR",
    "class_name",
    "CLASS_NAME",
    "main_class",
    "MAIN_CLASS",
    "state",
    "STATE",
    "image_date",
    "IMAGE_DATE",
  ],
  wfsBaseUrls: [TERRABRASILIS_WFS],
  bboxMarginDegrees: 0.06,
  maxWfsFeatures: 60,
};

export const FEDERAL_STATIC_LAYERS: WaveACatalogEntry[] = [
  IBAMA_EMBARGOS_LAYER,
  FEDERAL_UC_LAYER,
  FEDERAL_TI_LAYER,
  FEDERAL_PRODES_CERRADO_LAYER,
  FEDERAL_PRODES_MATA_ATLANTICA_LAYER,
];

function sicarLayerForUfs(ufs: string[]): WaveACatalogEntry | null {
  if (!ufs.length) return null;
  const typeNames = ufs.map(sicarTypeNameForUf);
  const ufLabel = ufs.map((u) => u.toUpperCase()).join(", ");
  return {
    layerId: "br_sicar_imoveis",
    title: `Imóveis rurais CAR (SICAR — ${ufLabel})`,
    wave: "G",
    geometryKind: "polygon",
    typeNames,
    labelFields: [
      "cod_imovel",
      "COD_IMOVEL",
      "numero",
      "NUMERO",
      "status",
      "STATUS",
      "nome",
      "NOME",
      "municipio",
      "MUNICIPIO",
    ],
    wfsBaseUrls: [SICAR_WFS],
    maxWfsFeatures: 120,
  };
}

/** Camadas federais resolvidas pelo bbox do perímetro. */
export function resolveFederalLayersForBbox(
  bbox: [number, number, number, number],
): WaveACatalogEntry[] {
  const ufs = resolveUfsForBbox(bbox, 3);
  const layers: WaveACatalogEntry[] = [];
  const sicar = sicarLayerForUfs(ufs.length ? ufs : ["mg"]);
  if (sicar) layers.push(sicar);
  layers.push(...FEDERAL_STATIC_LAYERS);
  return layers;
}

/** Lista estática (fallback MG) para export legado e catálogo. */
export const FEDERAL_WFS_LAYERS: WaveACatalogEntry[] =
  resolveFederalLayersForBbox([-51.13, -22.92, -36.03, -14.23]);

/** SICAR dinâmico + camadas estáticas federais. */
export const WAVE_FEDERAL_LAYER_COUNT = 1 + FEDERAL_STATIC_LAYERS.length;

export const FEDERAL_FONTES = [
  {
    nome: "SICAR GeoServer (MAPA)",
    url: "https://geoserver.car.gov.br/geoserver/sicar/",
    tipo: "ogc" as const,
  },
  {
    nome: "IBAMA SISCOM (embargos WFS)",
    url: IBAMA_SISCOM_WFS,
    tipo: "ogc" as const,
  },
  {
    nome: "IBAMA PAMGIA (UC / TI ArcGIS)",
    url: "https://pamgia.ibama.gov.br/",
    tipo: "catalogo" as const,
  },
  {
    nome: "INPE TerraBrasilis (PRODES WFS)",
    url: TERRABRASILIS_WFS,
    tipo: "ogc" as const,
  },
];
