/**
 * Camadas ICMBio via GeoServer INDE (WFS).
 * Complementa PAMGIA ArcGIS onde WFS INDE estiver disponível.
 */

import type { WaveACatalogEntry } from "@/lib/geospatial/wave-a-catalog";

export const ICMBIO_WFS_BASE = "https://geoservicos.inde.gov.br/geoserver/ICMBio/ows";

export const ICMBIO_UC_LAYER: WaveACatalogEntry = {
  layerId: "br_icmbio_uc_federal",
  title: "Unidades de conservação federais (ICMBio / INDE)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["ICMBio:limiteucsfederais_a"],
  labelFields: ["nome", "NOME", "name", "Name", "categoria", "CATEGORIA", "grupo", "GRUPO"],
  wfsBaseUrls: [ICMBIO_WFS_BASE],
  maxWfsFeatures: 80,
  bboxMarginDegrees: 0.04,
};

export const ICMBIO_EMBARGOS_LAYER: WaveACatalogEntry = {
  layerId: "br_icmbio_embargos",
  title: "Áreas embargadas (ICMBio)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["ICMBio:embargos_icmbio"],
  labelFields: [
    "nome",
    "NOME",
    "situacao",
    "SITUACAO",
    "num_auto",
    "NUM_AUTO",
    "municipio",
    "MUNICIPIO",
  ],
  wfsBaseUrls: [ICMBIO_WFS_BASE],
  maxWfsFeatures: 60,
  bboxMarginDegrees: 0.03,
};

export const ICMBIO_CAVERNAS_LAYER: WaveACatalogEntry = {
  layerId: "br_icmbio_cavernas",
  title: "Cavernas cadastradas (ICMBio)",
  wave: "G",
  geometryKind: "point",
  typeNames: ["ICMBio:cavernas_092022_p"],
  labelFields: ["nome", "NOME", "name", "codigo", "CODIGO"],
  wfsBaseUrls: [ICMBIO_WFS_BASE],
  maxWfsFeatures: 100,
  bboxMarginDegrees: 0.05,
};

export const ICMBIO_LAYERS: WaveACatalogEntry[] = [
  ICMBIO_UC_LAYER,
  ICMBIO_EMBARGOS_LAYER,
  ICMBIO_CAVERNAS_LAYER,
];

export const ICMBIO_FONTES = [
  {
    nome: "ICMBio GeoServer INDE",
    url: ICMBIO_WFS_BASE,
    tipo: "ogc" as const,
  },
];
