import type { Feature, Geometry, Polygon } from "geojson";
import type { GeoLayerResult, WaveAAnalysisResult } from "@/lib/types/geo-wave-a";
import {
  expandBbox,
  parsePerimeterPolygon,
  perimeterToGeoJson,
  type PerimeterParseInput,
} from "@/lib/geospatial/perimeter";
import {
  DEFAULT_INFLUENCE_CONFIG,
  resolveInfluenceAreas,
  type GeoInfluenceAreaConfig,
} from "@/lib/geospatial/influence-areas";
import { FEDERAL_FONTES } from "@/lib/geospatial/wave-federal-catalog";
import {
  enrichEmbargosLayerSummary,
  enrichMapBiomasAlertaLayerSummary,
  enrichProdesLayerSummary,
  federalLayerUnavailableSummary,
  isEmbargosLayer,
  isMapBiomasAlertaLayer,
  isProdesLayer,
} from "@/lib/geospatial/ibama-embargos";
import { fetchArcGisFeaturesInBbox } from "@/lib/geospatial/arcgis-feature-client";
import { WAVE_A_FONTES, type WaveACatalogEntry } from "@/lib/geospatial/wave-a-catalog";
import {
  GEO_ALL_LAYER_COUNT,
  resolveAllLayersForBbox,
} from "@/lib/geospatial/geo-all-layers";
import { ICMBIO_FONTES } from "@/lib/geospatial/wave-icmbio-catalog";
import { MMA_FONTES } from "@/lib/geospatial/wave-mma-catalog";
import { fetchWfsFeaturesInBbox } from "@/lib/geospatial/wfs-client";
import {
  aggregateLineLayerStats,
  aggregatePointLayerStats,
  aggregatePolygonLayerStats,
  buildFactualSummary,
} from "@/lib/geospatial/layer-stats";
import {
  CAVIDADES_POTENCIAL_LAYER_ID,
  enrichPotencialCavidadesLayerSummary,
} from "@/lib/geospatial/cavidades-potencial";

function geometryKindFromFeatures(
  features: Feature[],
  fallback: WaveACatalogEntry["geometryKind"],
): WaveACatalogEntry["geometryKind"] {
  const g = features[0]?.geometry?.type as Geometry["type"] | undefined;
  if (g === "Point" || g === "MultiPoint") return "point";
  if (g === "LineString" || g === "MultiLineString") return "line";
  if (g === "Polygon" || g === "MultiPolygon") return "polygon";
  return fallback;
}

function layerUnavailableSummary(entry: WaveACatalogEntry, wfs: {
  noFeaturesInExtent?: boolean;
  upstreamWfsDegraded?: boolean;
  ok: boolean;
}): string {
  if (wfs.upstreamWfsDegraded) {
    return "WFS INPE temporariamente degradado (bug GeoServer uid). Consulte mapas em terrabrasilis.dpi.inpe.br.";
  }
  if (wfs.noFeaturesInExtent) {
    if (entry.layerId === "mg_fauna") {
      return "Nenhuma ocorrência de fauna registrada no perímetro na base IDE-Sisema (consulta WFS concluída).";
    }
    if (entry.layerId === "mg_bioma") {
      return "Nenhum limite de bioma intersectou o perímetro no recorte WFS (confira no Geosisemanet/IBGE).";
    }
    if (entry.layerId === CAVIDADES_POTENCIAL_LAYER_ID) {
      return "Sem polígono de potencialidade CECAV no recorte WFS — confira no Geovisualizador IDE-Sisema (mapa 1:2.500.000) e na prospecção de campo (IS 08/2017).";
    }
    if (isEmbargosLayer(entry.layerId)) {
      return "Nenhuma área de embargo IBAMA intersectou o perímetro no recorte WFS SISCOM (consulta concluída).";
    }
    if (entry.layerId === "br_sicar_imoveis") {
      return "Nenhum imóvel CAR no recorte WFS SICAR (serviço respondeu; confira o recibo no portal CAR).";
    }
    const federalMsg = federalLayerUnavailableSummary(entry.layerId, true);
    if (federalMsg) return federalMsg;
    return "Nenhuma feição no recorte WFS (serviço respondeu; confira no IDE-Sisema).";
  }
  if (wfs.ok) {
    return "Nenhuma feição intersectada no recorte (confira no IDE-Sisema/Geosisemanet).";
  }
  return "Serviço WFS indisponível ou camada não encontrada.";
}

function wfsSourceLabel(baseUrl: string | undefined, entry: WaveACatalogEntry): string {
  if (entry.arcgisLayerUrl?.includes("pamgia.ibama.gov.br")) {
    return "IBAMA PAMGIA (ArcGIS REST)";
  }
  if (baseUrl?.includes("alerta.mapbiomas.org") || isMapBiomasAlertaLayer(entry.layerId)) {
    return "MapBiomas Alerta (WFS)";
  }
  if (baseUrl?.includes("terrabrasilis.dpi.inpe.br") || isProdesLayer(entry.layerId)) {
    return "INPE TerraBrasilis (PRODES WFS)";
  }
  if (baseUrl?.includes("car.gov.br")) return "SICAR GeoServer (MAPA)";
  if (entry.arcgisLayerUrl?.includes("embargos_siscom")) {
    return "IBAMA PAMGIA (embargos ArcGIS)";
  }
  if (baseUrl?.includes("siscom.ibama.gov.br") || isEmbargosLayer(entry.layerId)) {
    return "IBAMA SISCOM / PAMGIA";
  }
  if (baseUrl?.includes("geoservicos.inde.gov.br/geoserver/ICMBio")) {
    return "ICMBio (INDE WFS)";
  }
  if (baseUrl?.includes("geoservicos.inde.gov.br/geoserver/MMA")) {
    return "MMA (INDE WFS)";
  }
  if (entry.wfsBaseUrls.some((u) => u.includes("car.gov.br"))) {
    return "SICAR GeoServer (MAPA)";
  }
  if (entry.wfsBaseUrls.some((u) => u.includes("siscom.ibama.gov.br"))) {
    return "IBAMA SISCOM (embargos WFS)";
  }
  if (entry.wfsBaseUrls.some((u) => u.includes("terrabrasilis.dpi.inpe.br"))) {
    return "INPE TerraBrasilis (PRODES WFS)";
  }
  if (entry.wfsBaseUrls.some((u) => u.includes("alerta.mapbiomas.org"))) {
    return "MapBiomas Alerta (WFS)";
  }
  return "IDE-Sisema GeoServer MG";
}

async function analyzeCatalogLayer(params: {
  perimeter: Feature<Polygon>;
  perimeterAreaHa: number;
  bbox: [number, number, number, number];
  entry: WaveACatalogEntry;
}): Promise<GeoLayerResult> {
  const queriedAtUtc = new Date().toISOString();
  const margin =
    params.entry.bboxMarginDegrees ??
    (params.entry.geometryKind === "point" ? 0.05 : 0.02);
  const expandedBbox = expandBbox(params.bbox, margin);

  const usesArcgis = Boolean(params.entry.arcgisLayerUrl);
  const wfs = usesArcgis
    ? await fetchArcGisFeaturesInBbox({
        layerUrl: params.entry.arcgisLayerUrl!,
        bbox: expandedBbox,
        maxFeatures: params.entry.maxWfsFeatures,
      })
    : await fetchWfsFeaturesInBbox({
        baseUrls: params.entry.wfsBaseUrls,
        typeNames: params.entry.typeNames,
        bbox: expandedBbox,
        maxFeatures: params.entry.maxWfsFeatures,
      });
  const queryMethod = usesArcgis
    ? "ArcGIS REST Query (bbox)"
    : "WFS GetFeature (bbox)";

  if (!wfs.ok || wfs.features.length === 0) {
    const status =
      wfs.ok || wfs.noFeaturesInExtent || wfs.upstreamWfsDegraded
        ? "partial"
        : "unavailable";
    return {
      layerId: params.entry.layerId,
      title: params.entry.title,
      status,
      stats: [],
      summary: layerUnavailableSummary(params.entry, wfs),
      errorMessage: wfs.noFeaturesInExtent ? undefined : wfs.error,
      source: wfs.baseUrl
        ? {
            name: wfsSourceLabel(wfs.baseUrl, params.entry),
            url: wfs.baseUrl,
            layerName: wfs.typeName ?? params.entry.typeNames[0],
            queriedAtUtc,
            method: queryMethod,
          }
        : undefined,
    };
  }

  const geomKind = geometryKindFromFeatures(wfs.features, params.entry.geometryKind);
  const stats =
    geomKind === "line"
      ? aggregateLineLayerStats({
          perimeter: params.perimeter,
          features: wfs.features,
          labelFields: params.entry.labelFields,
        })
      : geomKind === "point"
        ? aggregatePointLayerStats({
            perimeter: params.perimeter,
            features: wfs.features,
            labelFields: params.entry.labelFields,
          })
        : aggregatePolygonLayerStats({
            perimeter: params.perimeter,
            perimeterAreaHa: params.perimeterAreaHa,
            features: wfs.features,
            labelFields: params.entry.labelFields,
          });

  const status = stats.length > 0 ? "ok" : "partial";
  let summary = "";
  if (stats.length === 0) {
    summary =
      "Feições retornadas pelo WFS, mas sem interseção mensurável com o perímetro.";
  } else if (params.entry.geometryKind === "line") {
    const totalKm = stats.reduce((s, x) => s + (x.lengthKm ?? 0), 0);
    summary = `${stats.length} feição(ões) hídrica(s); extensão total no recorte ~${totalKm.toFixed(2)} km.`;
  } else if (geomKind === "point") {
    const total = stats.reduce((s, x) => s + (x.count ?? 0), 0);
    summary = `${total} ocorrência(s) de fauna no perímetro.`;
  } else {
    const top = stats[0];
    summary = `Classe predominante: ${top.label} (${top.pctOfPerimeter ?? 0}% do empreendimento).`;
    if (params.entry.layerId === CAVIDADES_POTENCIAL_LAYER_ID) {
      summary = enrichPotencialCavidadesLayerSummary(
        stats,
        summary,
        params.perimeterAreaHa,
      );
    }
    if (isEmbargosLayer(params.entry.layerId)) {
      summary = enrichEmbargosLayerSummary(stats, summary);
    }
    if (isProdesLayer(params.entry.layerId)) {
      summary = enrichProdesLayerSummary(stats, summary);
    }
    if (isMapBiomasAlertaLayer(params.entry.layerId)) {
      summary = enrichMapBiomasAlertaLayerSummary(stats, summary);
    }
  }

  return {
    layerId: params.entry.layerId,
    title: params.entry.title,
    status,
    stats,
    summary,
    source: {
      name: wfsSourceLabel(wfs.baseUrl, params.entry),
      url: wfs.baseUrl ?? params.entry.wfsBaseUrls[0],
      layerName: wfs.typeName ?? params.entry.typeNames[0],
      queriedAtUtc,
      method: `${queryMethod} + interseção`,
    },
  };
}

export const WAVE_ALL_LAYER_COUNT = GEO_ALL_LAYER_COUNT;

function waveLayersForAnalysis(
  bbox: [number, number, number, number],
): WaveACatalogEntry[] {
  return resolveAllLayersForBbox(bbox);
}

const WAVE_A_BATCH_SIZE = 8;

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T, index: number) => Promise<R>,
  onItem?: (item: R, index: number, total: number) => void,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    const chunk = await Promise.all(
      slice.map((item, j) => fn(item, i + j)),
    );
    chunk.forEach((result, j) => {
      const index = i + j;
      onItem?.(result, index, items.length);
      out.push(result);
    });
  }
  return out;
}

export type WaveAAnalysisProgress = {
  layer: GeoLayerResult;
  index: number;
  total: number;
};

export async function runWaveAAnalysis(
  input: PerimeterParseInput,
  influenceConfig: GeoInfluenceAreaConfig = DEFAULT_INFLUENCE_CONFIG,
  onLayerComplete?: (progress: WaveAAnalysisProgress) => void,
): Promise<WaveAAnalysisResult> {
  const parsed = await parsePerimeterPolygon(input);
  if (!parsed) {
    throw new Error(
      "Perímetro inválido. Desenhe um polígono no mapa ou informe GeoJSON/WKT válido. Coordenada isolada gera apenas um buffer mínimo.",
    );
  }

  const influenceAreas = await resolveInfluenceAreas(input, influenceConfig);
  const catalog = waveLayersForAnalysis(parsed.bbox);

  const layerResults = await mapInBatches(
    catalog,
    WAVE_A_BATCH_SIZE,
    (entry) =>
      analyzeCatalogLayer({
        perimeter: parsed.polygon,
        perimeterAreaHa: parsed.areaHa,
        bbox: parsed.bbox,
        entry,
      }),
    (layer, index, total) => onLayerComplete?.({ layer, index, total }),
  );

  const generatedAtUtc = new Date().toISOString();
  const factualSummary = buildFactualSummary(
    parsed.areaHa,
    layerResults.map((l) => ({
      title: l.title,
      stats: l.stats,
      status: l.status,
    })),
  );

  return {
    wave: "ABC",
    generatedAtUtc,
    perimeter: {
      geojson: perimeterToGeoJson(parsed.polygon),
      areaHa: Number(parsed.areaHa.toFixed(4)),
      source: input.dataType,
      bbox: parsed.bbox,
    },
    layers: layerResults,
    factualSummary,
    fontesConsultadas: [...WAVE_A_FONTES, ...FEDERAL_FONTES, ...ICMBIO_FONTES, ...MMA_FONTES],
    ...(influenceAreas ? { influenceAreas } : {}),
  };
}
