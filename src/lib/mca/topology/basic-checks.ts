import kinks from "@turf/kinks";
import type { Feature, FeatureCollection } from "geojson";
import type { McaSpatialLayer } from "../types-v2";

function hasCoordinates(f: Feature): boolean {
  const g = f.geometry;
  if (!g || g.type === "GeometryCollection") return false;
  if (g.type === "Point") return Array.isArray(g.coordinates) && g.coordinates.length >= 2;
  if (g.type === "MultiPoint" || g.type === "LineString") {
    return Array.isArray(g.coordinates) && g.coordinates.length > 0;
  }
  if (g.type === "MultiLineString" || g.type === "Polygon") {
    return Array.isArray(g.coordinates) && g.coordinates.length > 0;
  }
  if (g.type === "MultiPolygon") {
    return Array.isArray(g.coordinates) && g.coordinates.length > 0;
  }
  return false;
}

/** Avaliação leve de topologia (v2) — sem repair automático. */
export function assessTopology(fc: FeatureCollection): McaSpatialLayer["topologyStatus"] {
  if (!fc.features?.length) return "invalid";

  let selfIntersects = false;
  for (const f of fc.features) {
    if (!hasCoordinates(f)) return "invalid";
    if (f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon") {
      try {
        const hits = kinks(f);
        if (hits.features.length > 0) selfIntersects = true;
      } catch {
        return "invalid";
      }
    }
  }
  return selfIntersects ? "repaired" : "valid";
}

export function topologyScoreFromLayers(
  layers: Map<string, FeatureCollection>,
): number {
  const keys = [...layers.keys()].filter((k) => layers.get(k)?.features?.length);
  if (!keys.length) return 4;
  let valid = 0;
  for (const k of keys) {
    const st = assessTopology(layers.get(k)!);
    if (st === "valid") valid++;
    else if (st === "repaired") valid += 0.5;
  }
  return Math.round((valid / keys.length) * 10);
}
