import area from "@turf/area";
import buffer from "@turf/buffer";
import booleanIntersects from "@turf/boolean-intersects";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import intersect from "@turf/intersect";
import type { Feature, Polygon } from "geojson";
import type { GeoLayerStat } from "@/lib/types/geo-wave-a";
import { flattenAnalysisFeatures } from "@/lib/geospatial/layer-stats";
import { safeFeatureCollection } from "@/lib/geospatial/perimeter";
import { computeMinProximityM } from "@/lib/geospatial/layer-proximity";
import { SOCIOAMBIENTAL_BUFFER_KM_PADRAO } from "@/lib/socioambiental/socioambiental-criteria-catalog";
import {
  FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
  FEDERAL_TI_LAYER_ID,
} from "@/lib/geospatial/wave-federal-catalog";
import {
  INCRA_ASSENTAMENTOS_LAYER_ID,
  INCRA_QUILOMBOLAS_LAYER_ID,
  IPHAN_SITIOS_LAYER_ID,
} from "@/lib/geospatial/wave-socioambiental-catalog";

const HA_FROM_M2 = 1 / 10_000;

const BUFFER_LAYER_IDS = new Set([
  "br_mma_uc_cnuc",
  FEDERAL_TI_LAYER_ID,
  INCRA_QUILOMBOLAS_LAYER_ID,
  INCRA_ASSENTAMENTOS_LAYER_ID,
  "br_uc_mma",
  IPHAN_SITIOS_LAYER_ID,
]);

const PROXIMITY_LAYER_IDS = new Set([FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID]);

function intersectAreaHa(
  a: Feature<Polygon>,
  b: Feature,
): number {
  try {
    if (!booleanIntersects(a, b)) return 0;
    const g = b.geometry;
    if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) return 0;
    const result = intersect(
      safeFeatureCollection([a, b as Feature<Polygon>]) as Parameters<
        typeof intersect
      >[0],
    );
    if (result) return area(result) * HA_FROM_M2;
    return 0;
  } catch {
    return 0;
  }
}

function pointCoords(geometry: Feature["geometry"]): [number, number][] {
  if (!geometry) return [];
  if (geometry.type === "Point") {
    return [geometry.coordinates as [number, number]];
  }
  if (geometry.type === "MultiPoint") {
    return geometry.coordinates.map((c) => c as [number, number]);
  }
  return [];
}

function computeBufferOverlapHa(
  perimeter: Feature<Polygon>,
  features: Feature[],
  bufferKm: number,
): number {
  const buffered = buffer(perimeter, bufferKm, { units: "kilometers" });
  if (!buffered?.geometry) return 0;
  const bufferFeature = buffered as Feature<Polygon>;
  let total = 0;
  let pointsInBuffer = 0;
  for (const feature of flattenAnalysisFeatures(features)) {
    const coords = pointCoords(feature.geometry);
    if (coords.length > 0) {
      for (const c of coords) {
        const pt = point(c);
        if (
          booleanPointInPolygon(pt, bufferFeature) &&
          !booleanPointInPolygon(pt, perimeter)
        ) {
          pointsInBuffer += 1;
        }
      }
      continue;
    }
    total += intersectAreaHa(bufferFeature, feature);
  }
  if (pointsInBuffer > 0) {
    total += pointsInBuffer * 0.01;
  }
  return total;
}

export function layerNeedsSocioambientalEnrichment(layerId: string): boolean {
  return BUFFER_LAYER_IDS.has(layerId) || PROXIMITY_LAYER_IDS.has(layerId);
}

export function enrichSocioambientalLayerStats(params: {
  layerId: string;
  perimeter: Feature<Polygon>;
  features: Feature[];
  stats: GeoLayerStat[];
  bufferKm?: number;
}): GeoLayerStat[] {
  const out = [...params.stats];
  const bufferKm = params.bufferKm ?? SOCIOAMBIENTAL_BUFFER_KM_PADRAO;

  if (BUFFER_LAYER_IDS.has(params.layerId) && params.features.length > 0) {
    const bufferHa = computeBufferOverlapHa(
      params.perimeter,
      params.features,
      bufferKm,
    );
    if (bufferHa > 0) {
      out.push({
        label: "__buffer_overlap__",
        areaHa: bufferHa,
      });
    }
  }

  if (PROXIMITY_LAYER_IDS.has(params.layerId) && params.features.length > 0) {
    const proximityM = computeMinProximityM(params.perimeter, params.features);
    if (proximityM != null) {
      out.push({
        label: "__proximity_m__",
        count: Math.round(proximityM),
        proximityM: Math.round(proximityM),
      });
    }
  }

  return out;
}
