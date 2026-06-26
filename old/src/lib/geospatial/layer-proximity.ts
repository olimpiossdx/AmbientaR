import bbox from "@turf/bbox";
import booleanIntersects from "@turf/boolean-intersects";
import distance from "@turf/distance";
import { point } from "@turf/helpers";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { lineSegment } from "@turf/line-segment";
import type { Feature, Geometry, LineString, MultiLineString, Polygon } from "geojson";
import { flattenAnalysisFeatures } from "@/lib/geospatial/layer-stats";

function samplePositions(geometry: Geometry): [number, number][] {
  const out: [number, number][] = [];
  if (geometry.type === "Point") {
    out.push(geometry.coordinates as [number, number]);
  } else if (geometry.type === "MultiPoint") {
    for (const c of geometry.coordinates) out.push(c as [number, number]);
  } else if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) {
      for (const c of ring) out.push(c as [number, number]);
    }
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      for (const ring of poly) {
        for (const c of ring) out.push(c as [number, number]);
      }
    }
  } else if (geometry.type === "LineString") {
    for (const c of geometry.coordinates) out.push(c as [number, number]);
  } else if (geometry.type === "MultiLineString") {
    for (const line of geometry.coordinates) {
      for (const c of line) out.push(c as [number, number]);
    }
  }
  return out;
}

function minDistancePointToPerimeterM(
  perimeter: Feature<Polygon>,
  coord: [number, number],
): number {
  const target = point(coord);
  if (booleanIntersects(target, perimeter)) return 0;

  const ring = perimeter.geometry.coordinates[0];
  if (!ring?.length) return Infinity;

  const line: Feature<LineString> = {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: ring },
  };

  const segments = lineSegment(line);
  let minKm = Infinity;
  for (const seg of segments.features) {
    const nearest = nearestPointOnLine(seg, target);
    const d = distance(target, nearest, { units: "kilometers" });
    if (d < minKm) minKm = d;
  }
  return minKm * 1000;
}

/**
 * Distância mínima em metros entre o perímetro e as feições (0 se há interseção).
 */
export function computeMinProximityM(
  perimeter: Feature<Polygon>,
  features: Feature[],
): number | undefined {
  const flat = flattenAnalysisFeatures(features);
  if (!flat.length) return undefined;

  let minM = Infinity;
  for (const feature of flat) {
    if (!feature.geometry) continue;
    if (booleanIntersects(perimeter, feature)) return 0;
    for (const coord of samplePositions(feature.geometry)) {
      const d = minDistancePointToPerimeterM(perimeter, coord);
      if (d < minM) minM = d;
    }
  }

  return Number.isFinite(minM) ? minM : undefined;
}

/** Bbox expandido para capturar feições na faixa de proximidade. */
export function expandBboxForProximityM(
  perimeterBbox: [number, number, number, number],
  proximityM: number,
): [number, number, number, number] {
  const deltaDeg = proximityM / 111_000;
  return [
    perimeterBbox[0] - deltaDeg,
    perimeterBbox[1] - deltaDeg,
    perimeterBbox[2] + deltaDeg,
    perimeterBbox[3] + deltaDeg,
  ];
}

export function perimeterBboxFromPolygon(
  perimeter: Feature<Polygon>,
): [number, number, number, number] {
  const b = bbox(perimeter) as [number, number, number, number];
  return b;
}
