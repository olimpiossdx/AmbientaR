/**
 * Catálogo Onda A — IDE-Sisema / GeoServer MG.
 * typeNames confirmados via metadados públicos; endpoints alternativos por resiliência.
 */

export type WaveACatalogEntry = {
  layerId: string;
  title: string;
  wave: "A" | "B" | "C";
  geometryKind: "polygon" | "line" | "point";
  typeNames: string[];
  labelFields: string[];
  wfsBaseUrls: string[];
};

const GEOSERVER_BASES = [
  "https://geoserver.meioambiente.mg.gov.br/geoserver/ows",
  "https://geoserver.meioambiente.mg.gov.br/geoserver/wfs",
  "https://geoportal.meioambiente.mg.gov.br/geoserver/ows",
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
    title: "Hidrografia (FBDS MG)",
    wave: "A",
    geometryKind: "line",
    typeNames: [
      "ide:ide_240901_mg_hidrografia_fbds_lin",
      "ide_240901_mg_hidrografia_fbds_lin",
      "ide:mg_hidrografia_fbds_lin",
    ],
    labelFields: ["nome", "NOME", "name", "tipo", "TIPO", "classificacao"],
    wfsBaseUrls: GEOSERVER_BASES,
  },
  {
    layerId: "mg_bioma",
    title: "Bioma / cobertura (MapBiomas MG)",
    wave: "A",
    geometryKind: "polygon",
    typeNames: [
      "ide:ide_1403_mg_nat_ant_mapbiomas_col9",
      "ide_1403_mg_nat_ant_mapbiomas_col9",
      "ide:mg_mapbiomas_bioma",
    ],
    labelFields: [
      "bioma",
      "BIOMA",
      "classe",
      "CLASSE",
      "class_name",
      "nome_classe",
      "legenda",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
  },
  {
    layerId: "mg_solos",
    title: "Solos (mapa MG 1:500.000)",
    wave: "A",
    geometryKind: "polygon",
    typeNames: [
      "ide:ide_1502_mg_mapa_solos_pol",
      "ide_1502_mg_mapa_solos_pol",
      "ide:mg_mapa_solos_pol",
    ],
    labelFields: [
      "solo",
      "SOLO",
      "classe",
      "CLASSE",
      "nome",
      "NOME",
      "legenda",
      "descricao",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
  },
];

/** Onda B — meio físico */
export const WAVE_B_LAYERS: WaveACatalogEntry[] = [
  {
    layerId: "mg_geologia",
    title: "Geologia",
    wave: "B",
    geometryKind: "polygon",
    typeNames: [
      "ide:ide_1501_mg_geologia_pol",
      "ide_1501_mg_geologia_pol",
      "ide:mg_geologia_pol",
    ],
    labelFields: ["litologia", "LITOLOGIA", "nome", "NOME", "classe", "CLASSE"],
    wfsBaseUrls: GEOSERVER_BASES,
  },
  {
    layerId: "mg_geomorfologia",
    title: "Geomorfologia",
    wave: "B",
    geometryKind: "polygon",
    typeNames: [
      "ide:ide_1503_mg_geomorfologia_pol",
      "ide_1503_mg_geomorfologia_pol",
      "ide:mg_geomorfologia_pol",
    ],
    labelFields: ["geomorf", "GEOMORF", "nome", "NOME", "classe", "CLASSE"],
    wfsBaseUrls: GEOSERVER_BASES,
  },
  {
    layerId: "mg_pedologia",
    title: "Pedologia",
    wave: "B",
    geometryKind: "polygon",
    typeNames: [
      "ide:ide_1504_mg_pedologia_pol",
      "ide_1504_mg_pedologia_pol",
      "ide:mg_pedologia_pol",
    ],
    labelFields: ["pedolo", "PEDOLO", "nome", "NOME", "classe", "CLASSE"],
    wfsBaseUrls: GEOSERVER_BASES,
  },
];

/** Onda C — meio biótico */
export const WAVE_C_LAYERS: WaveACatalogEntry[] = [
  {
    layerId: "mg_inventario_florestal",
    title: "Inventário / vegetação",
    wave: "C",
    geometryKind: "polygon",
    typeNames: [
      "ide:ide_1401_mg_vegetacao_pol",
      "ide_1401_mg_vegetacao_pol",
      "ide:mg_vegetacao_pol",
    ],
    labelFields: [
      "fitofisionomia",
      "FITOFISIONOMIA",
      "vegetacao",
      "classe",
      "CLASSE",
      "nome",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
  },
  {
    layerId: "mg_fauna",
    title: "Fauna (ocorrências)",
    wave: "C",
    geometryKind: "point",
    typeNames: [
      "ide:ide_1601_mg_fauna_pon",
      "ide_1601_mg_fauna_pon",
      "ide:mg_fauna_pon",
    ],
    labelFields: ["especie", "ESPECIE", "grupo", "GRUPO", "nome", "NOME"],
    wfsBaseUrls: GEOSERVER_BASES,
  },
];

/** Todas as camadas acordadas (Ondas A + B + C) */
export const SIG_MG_ALL_LAYERS: WaveACatalogEntry[] = [
  ...WAVE_A_LAYERS,
  ...WAVE_B_LAYERS,
  ...WAVE_C_LAYERS,
];
