import type { FeatureCollection } from "geojson";

export function mcaLayerFeatureCount(geojson: unknown): number {
  if (!geojson || typeof geojson !== "object") return 0;
  const fc = geojson as FeatureCollection;
  return Array.isArray(fc.features) ? fc.features.length : 0;
}
