import type { GeorefVertice } from "@/lib/georeferenciamento/types";

/** Monta polígono GeoJSON a partir de vértices com latitude/longitude (fecha o anel). */
export function verticesToPolygonGeoJSON(
  vertices: GeorefVertice[],
): { type: "Feature"; properties: object; geometry: { type: "Polygon"; coordinates: number[][][] } } | null {
  const pts = vertices
    .filter((v) => v.lon != null && v.lat != null && Number.isFinite(v.lon) && Number.isFinite(v.lat))
    .map((v) => [v.lon!, v.lat!] as [number, number]);

  if (pts.length < 3) return null;

  const first = pts[0];
  const last = pts[pts.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    pts.push([first[0], first[1]]);
  }

  return {
    type: "Feature",
    properties: { source: "georef-import" },
    geometry: {
      type: "Polygon",
      coordinates: [pts],
    },
  };
}
