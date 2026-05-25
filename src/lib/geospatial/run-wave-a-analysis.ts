import type { Feature, Geometry, Polygon } from "geojson";
import type { GeoLayerResult, WaveAAnalysisResult } from "@/lib/types/geo-wave-a";
import {
  expandBbox,
  parsePerimeterPolygon,
  perimeterToGeoJson,
  type PerimeterParseInput,
} from "@/lib/geospatial/perimeter";
import {
  SIG_MG_ALL_LAYERS,
  WAVE_A_FONTES,
  type WaveACatalogEntry,
} from "@/lib/geospatial/wave-a-catalog";
import { fetchWfsFeaturesInBbox } from "@/lib/geospatial/wfs-client";
import {
  aggregateLineLayerStats,
  aggregatePointLayerStats,
  aggregatePolygonLayerStats,
  buildFactualSummary,
} from "@/lib/geospatial/layer-stats";

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
  ok: boolean;
}): string {
  if (wfs.noFeaturesInExtent) {
    if (entry.layerId === "mg_fauna") {
      return "Nenhuma ocorrência de fauna registrada no perímetro na base IDE-Sisema (consulta WFS concluída).";
    }
    if (entry.layerId === "mg_bioma") {
      return "Nenhum limite de bioma intersectou o perímetro no recorte WFS (confira no Geosisemanet/IBGE).";
    }
    return "Nenhuma feição no recorte WFS (serviço respondeu; confira no IDE-Sisema).";
  }
  if (wfs.ok) {
    return "Nenhuma feição intersectada no recorte (confira no IDE-Sisema/Geosisemanet).";
  }
  return "Serviço WFS indisponível ou camada não encontrada.";
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

  const wfs = await fetchWfsFeaturesInBbox({
    baseUrls: params.entry.wfsBaseUrls,
    typeNames: params.entry.typeNames,
    bbox: expandedBbox,
    maxFeatures: params.entry.maxWfsFeatures,
  });

  if (!wfs.ok || wfs.features.length === 0) {
    const status =
      wfs.ok || wfs.noFeaturesInExtent ? "partial" : "unavailable";
    return {
      layerId: params.entry.layerId,
      title: params.entry.title,
      status,
      stats: [],
      summary: layerUnavailableSummary(params.entry, wfs),
      errorMessage: wfs.noFeaturesInExtent ? undefined : wfs.error,
      source: wfs.baseUrl
        ? {
            name: "IDE-Sisema GeoServer MG",
            url: wfs.baseUrl,
            layerName: wfs.typeName ?? params.entry.typeNames[0],
            queriedAtUtc,
            method: "WFS GetFeature (bbox)",
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
  }

  return {
    layerId: params.entry.layerId,
    title: params.entry.title,
    status,
    stats,
    summary,
    source: {
      name: "IDE-Sisema GeoServer MG",
      url: wfs.baseUrl ?? params.entry.wfsBaseUrls[0],
      layerName: wfs.typeName ?? params.entry.typeNames[0],
      queriedAtUtc,
      method: "WFS GetFeature (bbox) + interseção",
    },
  };
}

export async function runWaveAAnalysis(
  input: PerimeterParseInput,
): Promise<WaveAAnalysisResult> {
  const parsed = await parsePerimeterPolygon(input);
  if (!parsed) {
    throw new Error(
      "Perímetro inválido. Desenhe um polígono no mapa ou informe GeoJSON/WKT válido. Coordenada isolada gera apenas um buffer mínimo.",
    );
  }

  if (input.dataType === "coordinates") {
    // Permitido com buffer, mas aviso no summary
  }

  const layerResults = await Promise.all(
    SIG_MG_ALL_LAYERS.map((entry) =>
      analyzeCatalogLayer({
        perimeter: parsed.polygon,
        perimeterAreaHa: parsed.areaHa,
        bbox: parsed.bbox,
        entry,
      }),
    ),
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
    fontesConsultadas: WAVE_A_FONTES,
  };
}
