/**
 * Camadas adicionais do Extrato Socioambiental (INCRA, FUNAI WFS, IPHAN placeholder).
 */

import type { WaveACatalogEntry } from "@/lib/geospatial/wave-a-catalog";
import { resolveUfsForBbox } from "@/lib/geospatial/sicar-uf-bounds";

export const INCRA_WFS_BASE =
  "https://acervofundiariomaps.incra.gov.br/i3geo/geoserver/ows";

export const FUNAI_WFS_BASE =
  "https://geoserver.funai.gov.br/geoserver/Funai/ows";

export const INCRA_ASSENTAMENTOS_LAYER_ID = "br_incra_assentamentos";
export const INCRA_QUILOMBOLAS_LAYER_ID = "br_incra_quilombolas";
export const FUNAI_TI_WFS_LAYER_ID = "br_funai_ti_wfs";
export const IPHAN_SITIOS_LAYER_ID = "br_iphan_sitios";

/** Espelho PAMGIA/IBAMA — portal IPHAN WFS retorna 302 (indisponível em servidor). */
export const PAMGIA_IPHAN_SITIOS_LAYER_URL =
  "https://pamgia.ibama.gov.br/server/rest/services/BasesSincronizadas/loc_sitios_arqueologicos_iphan_p/MapServer/0";

export function incraTypeNameForUf(
  prefix: "assentamentos" | "quilombolas",
  uf: string,
): string {
  return `${prefix}_${uf.toLowerCase()}`;
}

export function resolveIncraTypeNamesForBbox(
  prefix: "assentamentos" | "quilombolas",
  bbox: [number, number, number, number],
): string[] {
  return resolveUfsForBbox(bbox).map((uf) => incraTypeNameForUf(prefix, uf));
}

/** Assentamentos da reforma agrária (INCRA i3geo — GML2). */
export const INCRA_ASSENTAMENTOS_LAYER: WaveACatalogEntry & {
  gmlOutput: true;
  incraPrefix: "assentamentos";
} = {
  layerId: INCRA_ASSENTAMENTOS_LAYER_ID,
  title: "Assentamentos da reforma agrária (INCRA)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["assentamentos_mg"],
  labelFields: ["nome", "NOME", "nome_proje", "NOME_PROJE", "municipio", "MUNICIPIO"],
  wfsBaseUrls: [INCRA_WFS_BASE],
  bboxMarginDegrees: 0.05,
  maxWfsFeatures: 80,
  gmlOutput: true,
  incraPrefix: "assentamentos",
};

/** Territórios quilombolas (INCRA i3geo — GML2). */
export const INCRA_QUILOMBOLAS_LAYER: WaveACatalogEntry & {
  gmlOutput: true;
  incraPrefix: "quilombolas";
} = {
  layerId: INCRA_QUILOMBOLAS_LAYER_ID,
  title: "Territórios quilombolas (INCRA)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["quilombolas_mg"],
  labelFields: ["nome", "NOME", "nm_comunid", "NM_COMUNID", "municipio", "MUNICIPIO"],
  wfsBaseUrls: [INCRA_WFS_BASE],
  bboxMarginDegrees: 0.05,
  maxWfsFeatures: 80,
  gmlOutput: true,
  incraPrefix: "quilombolas",
};

/** TI poligonais FUNAI (WFS alternativo ao PAMGIA). */
export const FUNAI_TI_WFS_LAYER: WaveACatalogEntry = {
  layerId: FUNAI_TI_WFS_LAYER_ID,
  title: "Terras indígenas (FUNAI WFS)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["Funai:tis_poligonais_portarias"],
  labelFields: [
    "terrai_nom",
    "terrai_nome",
    "etnia_nome",
    "modalidade",
    "fase_ti",
    "situacao",
  ],
  wfsBaseUrls: [FUNAI_WFS_BASE],
  bboxMarginDegrees: 0.05,
  maxWfsFeatures: 80,
};

/** Sítios arqueológicos IPHAN (PAMGIA ArcGIS — base sincronizada SICG). */
export const IPHAN_SITIOS_LAYER: WaveACatalogEntry = {
  layerId: IPHAN_SITIOS_LAYER_ID,
  title: "Sítios arqueológicos (IPHAN)",
  wave: "G",
  geometryKind: "point",
  typeNames: ["loc_sitios_arqueologicos_iphan_p"],
  labelFields: [
    "identifica",
    "IDENTIFICA",
    "co_iphan",
    "CO_IPHAN",
    "ds_classif",
    "DS_CLASSIF",
    "ds_naturez",
    "DS_NATUREZ",
    "sintese_be",
    "SINTESE_BE",
  ],
  wfsBaseUrls: [],
  arcgisLayerUrl: PAMGIA_IPHAN_SITIOS_LAYER_URL,
  bboxMarginDegrees: 0.03,
  maxWfsFeatures: 120,
};

export const SOCIOAMBIENTAL_EXTRA_LAYERS: WaveACatalogEntry[] = [
  INCRA_ASSENTAMENTOS_LAYER,
  INCRA_QUILOMBOLAS_LAYER,
  FUNAI_TI_WFS_LAYER,
  IPHAN_SITIOS_LAYER,
];

export function patchIncraLayerForBbox(
  entry: typeof INCRA_ASSENTAMENTOS_LAYER | typeof INCRA_QUILOMBOLAS_LAYER,
  bbox: [number, number, number, number],
): WaveACatalogEntry {
  return {
    ...entry,
    typeNames: resolveIncraTypeNamesForBbox(entry.incraPrefix, bbox),
  };
}

export function resolveSocioambientalLayersForBbox(
  bbox: [number, number, number, number],
): WaveACatalogEntry[] {
  return [
    patchIncraLayerForBbox(INCRA_ASSENTAMENTOS_LAYER, bbox),
    patchIncraLayerForBbox(INCRA_QUILOMBOLAS_LAYER, bbox),
    FUNAI_TI_WFS_LAYER,
    IPHAN_SITIOS_LAYER,
  ];
}

export const SOCIOAMBIENTAL_FONTES = [
  {
    nome: "INCRA Acervo Fundiário (i3geo)",
    url: INCRA_WFS_BASE,
    tipo: "ogc" as const,
  },
  {
    nome: "FUNAI GeoServer",
    url: FUNAI_WFS_BASE,
    tipo: "ogc" as const,
  },
  {
    nome: "IPHAN / PAMGIA (sítios arqueológicos)",
    url: PAMGIA_IPHAN_SITIOS_LAYER_URL,
    tipo: "ogc" as const,
  },
];
