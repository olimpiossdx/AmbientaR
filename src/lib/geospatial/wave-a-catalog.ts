/**
 * Catálogo Ondas A+B+C — IDE-Sisema / GeoServer MG.
 * typeNames confirmados via GetCapabilities (2026-05-22).
 * WFS base: https://geoserver.meioambiente.mg.gov.br/ows (não usar /geoserver/ows).
 */

export type WaveACatalogEntry = {
  layerId: string;
  title: string;
  wave: "A" | "B" | "C" | "E" | "F" | "G";
  geometryKind: "polygon" | "line" | "point";
  typeNames: string[];
  labelFields: string[];
  wfsBaseUrls: string[];
  /** Margem extra no bbox WFS (graus). Útil para camadas pontuais esparsas. */
  bboxMarginDegrees?: number;
  /** Limite de feições por GetFeature (camadas pesadas, ex. bioma IBGE). */
  maxWfsFeatures?: number;
  /** Camada ArcGIS REST (FeatureServer/MapServer) — ex.: PAMGIA IBAMA. */
  arcgisLayerUrl?: string;
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
  {
    nome: "IBGE / bases federais (biomas, limites)",
    url: "https://www.ibge.gov.br/",
    tipo: "catalogo" as const,
  },
];

/** Campos típicos das malhas de diagnóstico ambiental (ide_2401_*). */
const DIAGNOSTICO_LABEL_FIELDS = [
  "indicador",
  "INDICADOR",
  "classe",
  "CLASSE",
  "legenda",
  "LEGENDA",
  "categoria",
  "CATEGORIA",
  "grau",
  "GRAU",
  "gridcode",
  "descricao",
  "DESCRICAO",
  "nome",
  "NOME",
];

function diagnosticoLayer(
  layerId: string,
  title: string,
  typeName: string,
  maxWfsFeatures = 350,
): WaveACatalogEntry {
  return {
    layerId,
    title,
    wave: "E",
    geometryKind: "polygon",
    typeNames: [typeName],
    labelFields: DIAGNOSTICO_LABEL_FIELDS,
    wfsBaseUrls: GEOSERVER_BASES,
    maxWfsFeatures,
  };
}

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

/** Onda E — diagnóstico ambiental estadual (malhas ide_2401, estilo GeoSIG/Pimenta). */
export const WAVE_E_LAYERS: WaveACatalogEntry[] = [
  diagnosticoLayer(
    "mg_qualidade_ambiental",
    "Qualidade ambiental (diagnóstico MG)",
    "IDE:ide_2401_mg_qualidade_ambiental_pol",
  ),
  diagnosticoLayer(
    "mg_risco_ambiental",
    "Risco ambiental (diagnóstico MG)",
    "IDE:ide_2401_mg_risco_ambiental_pol",
  ),
  diagnosticoLayer(
    "mg_vulnerabilidade_erosao",
    "Vulnerabilidade dos solos à erosão",
    "IDE:ide_2401_mg_vulnerabilidade_solos_erosao_pol",
  ),
  diagnosticoLayer(
    "mg_vulnerabilidade_natural",
    "Vulnerabilidade natural",
    "IDE:ide_2401_mg_vulnerabilidade_natural_pol",
  ),
  diagnosticoLayer(
    "mg_vulnerabilidade_solo",
    "Vulnerabilidade do solo",
    "IDE:ide_2401_mg_vulnerabilidade_solo_pol",
  ),
  diagnosticoLayer(
    "mg_vulnerabilidade_contaminacao",
    "Vulnerabilidade do solo à contaminação",
    "IDE:ide_2401_mg_vulnerabilidade_contaminacao_ambiental_uso_solo_pol",
  ),
  diagnosticoLayer(
    "mg_integridade_flora",
    "Integridade ponderada da flora",
    "IDE:ide_2401_mg_integridade_ponderada_flora_pol",
  ),
  diagnosticoLayer(
    "mg_integridade_fauna_diag",
    "Integridade da fauna (diagnóstico MG)",
    "IDE:ide_2401_mg_integridade_fauna_pol",
  ),
  diagnosticoLayer(
    "mg_vulnerabilidade_hidrica",
    "Vulnerabilidade natural dos recursos hídricos",
    "IDE:ide_2401_mg_vulnerabilidade_natural_recursos_hidricos_pol",
  ),
  diagnosticoLayer(
    "mg_erosao_atual",
    "Erosão atual (MG)",
    "IDE:ide_2401_mg_erosao_atual_pol",
  ),
];

/** Onda F — clima, declividade e aptidão (IDE-Sisema + IBGE/NCB). */
export const WAVE_F_LAYERS: WaveACatalogEntry[] = [
  diagnosticoLayer(
    "mg_temperatura_media",
    "Temperatura média anual (MG)",
    "IDE:ide_2401_mg_temperatura_media_anual_pol",
  ),
  diagnosticoLayer(
    "mg_precipitacao_media",
    "Precipitação média anual (MG)",
    "IDE:ide_2401_mg_precipitacao_media_anual",
  ),
  diagnosticoLayer(
    "mg_zoneamento_climatico",
    "Zoneamento climático (MG)",
    "IDE:ide_2401_mg_zoneamento_climatico_pol",
  ),
  diagnosticoLayer(
    "mg_indice_umidade",
    "Índice de umidade (Thornthwaite)",
    "IDE:ide_1601_mg_indice_umidade_thornthwaite_pol",
  ),
  diagnosticoLayer(
    "mg_declividade",
    "Declividade (MG)",
    "IDE:ide_2401_mg_declividade_pol",
  ),
  diagnosticoLayer(
    "mg_potencialidade_social",
    "Potencialidade social (MG)",
    "IDE:ide_2401_mg_potencialidade_social_pol",
  ),
  {
    layerId: "mg_aptidao_agricola",
    title: "Aptidão agrícola dos solos (MG)",
    wave: "F",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_1504_mg_solos_aptidao_agricola_pol"],
    labelFields: [
      "aptidao",
      "APTIDAO",
      "classe",
      "CLASSE",
      "legenda",
      "LEGENDA",
      "indicador",
      "INDICADOR",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
    maxWfsFeatures: 300,
  },
];

/** Onda G — conservação, APP/hidro complementar e massas d'água. */
export const WAVE_G_LAYERS: WaveACatalogEntry[] = [
  diagnosticoLayer(
    "mg_areas_prioritarias_conservacao",
    "Áreas prioritárias para conservação",
    "IDE:ide_2401_mg_areas_prioritarias_conservacao_pol",
  ),
  diagnosticoLayer(
    "mg_areas_prioritarias_recuperacao",
    "Áreas prioritárias para recuperação",
    "IDE:ide_2401_mg_areas_prioritarias_recuperacao_pol",
  ),
  {
    layerId: "mg_unidades_conservacao",
    title: "Unidades de conservação (estaduais e federais MG)",
    wave: "G",
    geometryKind: "polygon",
    typeNames: [
      "IDE:ide_2010_mg_unidades_conservacao_estaduais_pol",
      "IDE:ide_2010_mg_unidades_conservacao_federais_pol",
      "IDE:ide_2010_mg_unidades_conservacao_municipais_pol",
    ],
    labelFields: ["nome", "NOME", "categoria", "CATEGORIA", "grupo", "GRUPO", "classe", "CLASSE"],
    wfsBaseUrls: GEOSERVER_BASES,
    maxWfsFeatures: 200,
  },
  {
    layerId: "mg_massas_dagua",
    title: "Massas d'água (FBDS MG)",
    wave: "G",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_240904_mg_massas_dagua_fbds_pol"],
    labelFields: ["nome", "NOME", "tipo", "TIPO", "classe", "CLASSE"],
    wfsBaseUrls: GEOSERVER_BASES,
    maxWfsFeatures: 200,
  },
  {
    layerId: "mg_hidrografia_classe_especial",
    title: "Hidrografia enquadrada em classe especial",
    wave: "G",
    geometryKind: "line",
    typeNames: ["IDE:ide_2008_mg_trecho_enquadrada_classe_especial_lin"],
    labelFields: ["nome", "NOME", "classe", "CLASSE", "categoria", "CATEGORIA"],
    wfsBaseUrls: GEOSERVER_BASES,
    maxWfsFeatures: 200,
  },
  {
    layerId: "mg_app_hidrica_mapcar",
    title: "APP hídrica (MAPCAR / IDE-Sisema)",
    wave: "G",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_210603_mg_hid_app_hidrica_mapcar_sul_pol"],
    labelFields: [
      "tipo_app",
      "TIPO_APP",
      "legenda",
      "LEGENDA",
      "classe",
      "CLASSE",
      "nome",
      "NOME",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
    bboxMarginDegrees: 0.03,
    maxWfsFeatures: 80,
  },
  {
    layerId: "mg_licenciamento_municipal",
    title: "Licenciamento ambiental municipal (polígonos)",
    wave: "G",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_2102_mg_licenciamento_ambiental_municipal_pol"],
    labelFields: [
      "nome",
      "NOME",
      "empreendimento",
      "EMPREENDIMENTO",
      "processo",
      "PROCESSO",
      "situacao",
      "SITUACAO",
      "municipio",
      "MUNICIPIO",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
    bboxMarginDegrees: 0.05,
    maxWfsFeatures: 100,
  },
  {
    layerId: "mg_empreendimentos_licenciados",
    title: "Empreendimentos licenciados SEMAD (pontos)",
    wave: "G",
    geometryKind: "point",
    typeNames: ["IDE:ide_2101_mg_empreendimentos_licenciados_pto"],
    labelFields: [
      "nome",
      "NOME",
      "empreendimento",
      "EMPREENDIMENTO",
      "processo",
      "PROCESSO",
      "situacao",
      "SITUACAO",
      "municipio",
      "MUNICIPIO",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
    bboxMarginDegrees: 0.08,
    maxWfsFeatures: 120,
  },
];

/** Onda H — ZEE-MG, outorgas IGAM e ICMS ecológico. */
export const WAVE_H_LAYERS: WaveACatalogEntry[] = [
  {
    layerId: "mg_zee_zonas",
    title: "ZEE-MG — Zonas ecológico-econômicas",
    wave: "E",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_2401_mg_zonas_ecologico_economicas_pol"],
    labelFields: [
      "zona",
      "ZONA",
      "classe",
      "CLASSE",
      "iee",
      "IEE",
      "legenda",
      "LEGENDA",
      "descricao",
      "DESCRICAO",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
    maxWfsFeatures: 50,
  },
  {
    layerId: "mg_icms_ecologico",
    title: "ICMS Ecológico (MG)",
    wave: "E",
    geometryKind: "polygon",
    typeNames: ["IDE:ide_2401_mg_icms_ecologico_pol"],
    labelFields: ["classe", "CLASSE", "legenda", "LEGENDA", "categoria", "CATEGORIA"],
    wfsBaseUrls: GEOSERVER_BASES,
    maxWfsFeatures: 80,
  },
  {
    layerId: "mg_outorgas_igam",
    title: "Outorgas de uso de recursos hídricos (IGAM)",
    wave: "G",
    geometryKind: "point",
    typeNames: [
      "IDE:ide_2103_mg_outorgas_uso_recursos_hidricos_pto",
      "IDE:ide_2103_mg_federais_ana_outorgas_pto",
    ],
    labelFields: [
      "numero",
      "NUMERO",
      "processo",
      "PROCESSO",
      "situacao",
      "SITUACAO",
      "finalidade",
      "FINALIDADE",
      "nome",
      "NOME",
    ],
    wfsBaseUrls: GEOSERVER_BASES,
    bboxMarginDegrees: 0.08,
    maxWfsFeatures: 120,
  },
];

/** Todas as camadas (Ondas A–G + espeleologia). */
export const SIG_MG_ALL_LAYERS: WaveACatalogEntry[] = [
  ...WAVE_A_LAYERS,
  ...WAVE_B_LAYERS,
  ...WAVE_C_LAYERS,
  ...WAVE_D_LAYERS,
  ...WAVE_E_LAYERS,
  ...WAVE_F_LAYERS,
  ...WAVE_G_LAYERS,
  ...WAVE_H_LAYERS,
];

export const SIG_MG_LAYER_COUNT = SIG_MG_ALL_LAYERS.length;
