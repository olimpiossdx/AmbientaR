/**
 * Catálogo Ondas A+B+C — IDE-Sisema / GeoServer MG.
 * typeNames confirmados via GetCapabilities (2026-05-22).
 * WFS base: https://geoserver.meioambiente.mg.gov.br/ows (não usar /geoserver/ows).
 */

export type WaveACatalogEntry = {
  layerId: string;
  title: string;
  wave: "A" | "B" | "C";
  geometryKind: "polygon" | "line" | "point";
  typeNames: string[];
  labelFields: string[];
  wfsBaseUrls: string[];
  /** Margem extra no bbox WFS (graus). Útil para camadas pontuais esparsas. */
  bboxMarginDegrees?: number;
  /** Limite de feições por GetFeature (camadas pesadas, ex. bioma IBGE). */
  maxWfsFeatures?: number;
};

/** Endpoints WFS válidos no GeoServer MG (raiz do host, não /geoserver/). */
const GEOSERVER_BASES = [
  "https://geoserver.meioambiente.mg.gov.br/ows",
  "https://geoserver.meioambiente.mg.gov.br/wfs",
];

export const WAVE_A_FONTES = [
  {
    nome: "IDE-Sisema GeoServer MG",
    url: "https://geoserver.meioambiente.mg.gov.br/",
    tipo: "ogc" as const,
  },
  {
    nome: "GeoNetwork IDE-Sisema",
    url: "https://idesisema.meioambiente.mg.gov.br/geonetwork",
    tipo: "catalogo" as const,
  },
];

export const WAVE_A_LAYERS: WaveACatalogEntry[] = [
  {
    layerId: "mg_hidrografia",
    title: "Hidrografia (rede principal + massas d'água FBDS MG)",
    wave: "A",
    geometryKind: "line",
    typeNames: [
      "IDE:ide_0104_mg_hidrografia_principal_lin",
      "IDE:ide_240902_mg_rios_duplos_fbds_pol",
    ],
    labelFields: ["nome", "NOME", "name", "tipo", "TIPO", "classificacao", "categoria"],
    wfsBaseUrls: GEOSERVER_BASES,
  },
  {
    layerId: "mg_bioma",
    title: "Bioma (limites IBGE MG)",
    wave: "A",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_0302_mg_limite_biomas_ibge_pol"],
    maxWfsFeatures: 200,
    labelFields: [
      "bioma",
      "BIOMA",
      "Bioma",
      "nome",
      "NOME",
      "classe",
      "CLASSE",
      "legenda",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
  },
  {
    layerId: "mg_solos",
    title: "Solos (mapa MG 1:500.000)",
    wave: "A",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_1502_mg_mapa_solos_pol"],
    labelFields: [
      "solo",
      "SOLO",
      "classe",
      "CLASSE",
      "nome",
      "NOME",
      "legenda",
      "descricao",
      "SIGLA",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
  },
];

/** Onda B — meio físico */
export const WAVE_B_LAYERS: WaveACatalogEntry[] = [
  {
    layerId: "mg_geologia",
    title: "Geologia (mapa geológico MG)",
    wave: "B",
    geometryKind: "polygon",
    typeNames: [
      "IDE:ide_1701_mg_mapa_geologico_pol",
      "IDE:ide_1703_mg_unid_geologico_ambientais_pol",
    ],
    labelFields: ["litologia", "LITOLOGIA", "nome", "NOME", "classe", "CLASSE", "SIGLA"],
    wfsBaseUrls: GEOSERVER_BASES,
  },
  {
    layerId: "mg_geomorfologia",
    title: "Geomorfologia (unidades MG)",
    wave: "B",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_0203_mg_unid_geomorfologicas_pol"],
    labelFields: ["geomorf", "GEOMORF", "nome", "NOME", "classe", "CLASSE", "SIGLA"],
    wfsBaseUrls: GEOSERVER_BASES,
  },
  {
    layerId: "mg_pedologia",
    title: "Pedologia (mapa pedológico simplificado MG)",
    wave: "B",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_2401_mg_mapa_pedologico_simplificado_pol"],
    labelFields: ["pedolo", "PEDOLO", "nome", "NOME", "classe", "CLASSE", "SIGLA", "legenda"],
    wfsBaseUrls: GEOSERVER_BASES,
  },
];

/** Onda C — meio biótico */
export const WAVE_C_LAYERS: WaveACatalogEntry[] = [
  {
    layerId: "mg_inventario_florestal",
    title: "Cobertura florestal / vegetação (MG 2009)",
    wave: "C",
    geometryKind: "polygon",
    typeNames: [
      "IDE:ide_0301_mg_cobertura_florestal__2009_pol",
      "IDE:ide_250101_mg_recuperacao_vegetal_2020_pol",
    ],
    labelFields: [
      "fitofisionomia",
      "FITOFISIONOMIA",
      "vegetacao",
      "classe",
      "CLASSE",
      "nome",
      "NOME",
      "legenda",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
  },
  {
    layerId: "mg_fauna",
    title: "Fauna (ocorrências de espécies MG)",
    wave: "C",
    geometryKind: "point",
    typeNames: [
      "IDE:ide_1802_mg_ocorrencia_especies_avifauna_geral_pol",
      "IDE:ide_1801_mg_especies_catalogadas_pol",
      "IDE:ide_1801_mg_ocorrencia_especies_pto",
      "IDE:ide_1805_mg_pesquisa_especies_ameacadas_pto",
    ],
    bboxMarginDegrees: 0.06,
    labelFields: ["especie", "ESPECIE", "grupo", "GRUPO", "nome", "NOME", "familia"],
    wfsBaseUrls: GEOSERVER_BASES,
  },
];

/** Onda D — patrimônio espeleológico (licenciamento MG / CECAV) */
export const WAVE_D_LAYERS: WaveACatalogEntry[] = [
  {
    layerId: "mg_potencial_cavidades",
    title: "Potencialidade de ocorrência de cavidades (CECAV / DN 217)",
    wave: "C",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_2002_mg_potencialidade_cavidades_pol"],
    labelFields: [
      "potencial",
      "POTENCIAL",
      "potencialidade",
      "POTENCIALIDADE",
      "grau",
      "GRAU",
      "classe",
      "CLASSE",
      "legenda",
      "LEGENDA",
      "descricao",
      "DESCRICAO",
      "nome",
      "NOME",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
  },
];

/** Todas as camadas acordadas (Ondas A + B + C + espeleologia) */
export const SIG_MG_ALL_LAYERS: WaveACatalogEntry[] = [
  ...WAVE_A_LAYERS,
  ...WAVE_B_LAYERS,
  ...WAVE_C_LAYERS,
  ...WAVE_D_LAYERS,
];

export const SIG_MG_LAYER_COUNT = SIG_MG_ALL_LAYERS.length;
