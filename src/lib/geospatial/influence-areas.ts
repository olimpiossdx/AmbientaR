/**
 * Áreas de influência — módulo Análise Geoespacial (IA) apenas.
 * ADA = perímetro da análise. AID/AII = buffer ou desenho manual.
 */

import area from "@turf/area";
import bbox from "@turf/bbox";
import buffer from "@turf/buffer";
import type { Feature, Polygon } from "geojson";
import {
  parseGeoJsonObject,
  parsePerimeterPolygon,
  perimeterToGeoJson,
  type PerimeterParseInput,
} from "@/lib/geospatial/perimeter";
import { DEFAULT_INFLUENCE_CONFIG } from "@/lib/geospatial/influence-areas-config";
import type {
  GeoInfluenceAreaConfig,
  GeoInfluenceAreaPolygon,
  GeoInfluenceAreas,
} from "@/lib/types/geo-wave-a";

export type { GeoInfluenceAreaConfig, GeoInfluenceAreaPolygon, GeoInfluenceAreas };
export { DEFAULT_INFLUENCE_CONFIG };
export type InfluenceAreaMode = GeoInfluenceAreaConfig["aidMode"];

function featureToInfluencePolygon(
  feature: Feature<Polygon>,
  key: GeoInfluenceAreaPolygon["key"],
  title: string,
  source: GeoInfluenceAreaPolygon["source"],
): GeoInfluenceAreaPolygon {
  const ringBbox = bbox(feature) as [number, number, number, number];
  return {
    key,
    title,
    geojson: perimeterToGeoJson(feature),
    areaHa: Number((area(feature) * 0.0001).toFixed(4)),
    bbox: ringBbox,
    source,
  };
}

function polygonFromManual(
  raw: Record<string, unknown> | null | undefined,
): Feature<Polygon> | null {
  if (!raw) return null;
  return parseGeoJsonObject(raw);
}

function bufferPolygon(
  base: Feature<Polygon>,
  distanceKm: number,
): Feature<Polygon> | null {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;
  try {
    const buffered = buffer(base, distanceKm, { units: "kilometers" });
    if (!buffered?.geometry) return null;
    return parseGeoJsonObject(buffered) ?? null;
  } catch {
    return null;
  }
}

export async function resolveInfluenceAreas(
  input: PerimeterParseInput,
  config: GeoInfluenceAreaConfig = DEFAULT_INFLUENCE_CONFIG,
): Promise<GeoInfluenceAreas | null> {
  const parsed = await parsePerimeterPolygon(input);
  if (!parsed) return null;

  const ada = featureToInfluencePolygon(
    parsed.polygon,
    "ada",
    "Área diretamente afetada (ADA)",
    "perimeter",
  );

  let aid: GeoInfluenceAreaPolygon | null = null;
  if (config.aidMode === "manual") {
    const manual = polygonFromManual(config.aidManualGeojson);
    if (manual) {
      aid = featureToInfluencePolygon(
        manual,
        "aid",
        "Área de influência direta (AID)",
        "manual",
      );
    }
  } else if (config.aidMode === "buffer") {
    const buffered = bufferPolygon(parsed.polygon, config.aidBufferKm);
    if (buffered) {
      aid = featureToInfluencePolygon(
        buffered,
        "aid",
        `Área de influência direta (AID — buffer ${config.aidBufferKm} km)`,
        "buffer",
      );
    }
  }

  let aii: GeoInfluenceAreaPolygon | null = null;
  if (config.aiiMode === "manual") {
    const manual = polygonFromManual(config.aiiManualGeojson);
    if (manual) {
      aii = featureToInfluencePolygon(
        manual,
        "aii",
        "Área de influência indireta (AII)",
        "manual",
      );
    }
  } else if (config.aiiMode === "buffer") {
    const baseForAii =
      config.aiiBufferKm > 0 && aid
        ? polygonFromManual(aid.geojson)
        : parsed.polygon;
    const base = baseForAii ?? parsed.polygon;
    const buffered = bufferPolygon(base, config.aiiBufferKm);
    if (buffered) {
      aii = featureToInfluencePolygon(
        buffered,
        "aii",
        `Área de influência indireta (AII — buffer ${config.aiiBufferKm} km)`,
        "buffer",
      );
    }
  }

  return { ada, aid, aii, config };
}

export function influenceAreasForWaveResult(
  perimeter: {
    geojson: Record<string, unknown>;
    areaHa: number;
    bbox: [number, number, number, number];
  },
  config: GeoInfluenceAreaConfig,
  resolved?: GeoInfluenceAreas | null,
): GeoInfluenceAreas {
  if (resolved) return resolved;
  const adaFeature = parseGeoJsonObject(perimeter.geojson);
  if (!adaFeature) {
    throw new Error("Perímetro ADA inválido.");
  }
  return {
    ada: {
      key: "ada",
      title: "Área diretamente afetada (ADA)",
      geojson: perimeter.geojson,
      areaHa: perimeter.areaHa,
      bbox: perimeter.bbox,
      source: "perimeter",
    },
    aid: null,
    aii: null,
    config,
  };
}
