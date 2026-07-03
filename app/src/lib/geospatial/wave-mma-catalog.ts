/**
 * Camadas federais MMA via GeoServer INDE + contexto ZEE nacional (CKAN).
 */

import type { WaveACatalogEntry } from "@/lib/geospatial/wave-a-catalog";

export const MMA_WFS_BASE = "https://geoservicos.inde.gov.br/geoserver/MMA/ows";

export const MMA_UC_NACIONAL_LAYER: WaveACatalogEntry = {
  layerId: "br_mma_uc_cnuc",
  title: "Unidades de conservação — CNUC (MMA / INDE)",
  wave: "G",
  geometryKind: "polygon",
  typeNames: ["MMA:cnuc_2026_03_atualizado", "MMA:cnuc_2026_03", "MMA:cnuc_04_2024"],
  labelFields: [
    "nome",
    "NOME",
    "Name",
    "categoria",
    "CATEGORIA",
    "grupo",
    "GRUPO",
    "esfera",
    "ESFERA",
  ],
  wfsBaseUrls: [MMA_WFS_BASE],
  maxWfsFeatures: 100,
  bboxMarginDegrees: 0.04,
};

export const MMA_LAYERS: WaveACatalogEntry[] = [MMA_UC_NACIONAL_LAYER];

export const MMA_CKAN_PACKAGE_ZEE =
  "diretrizes-de-uso-e-ocupacao-em-bases-sustentaveis-por-zoneamento-ecologico-economico";

export const MMA_CKAN_API = "https://dados.mma.gov.br/api/3/action";

export const MMA_FONTES = [
  {
    nome: "MMA GeoServer INDE",
    url: MMA_WFS_BASE,
    tipo: "ogc" as const,
  },
  {
    nome: "Portal Dados Abertos MMA (CKAN)",
    url: "https://dados.mma.gov.br/",
    tipo: "catalogo" as const,
  },
];
