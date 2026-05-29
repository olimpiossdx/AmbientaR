import type { FeatureCollection } from "geojson";
import {
  mcaPreviewBboxFromCollections,
  mcaPreviewProject,
} from "./map-preview-bbox";

export type McaPreviewSvgOptions = {
  background?: "light" | "none";
  drawLines?: boolean;
  drawPoints?: boolean;
};

/** SVG esquemático multi-layer (cliente → PNG para POST /pdf). */
export function mcaLayersToPreviewSvg(
  perimeter: FeatureCollection | null,
  layers: Record<string, FeatureCollection>,
  width = 640,
  height = 480,
  options?: McaPreviewSvgOptions,
): string | null {
  const all: FeatureCollection[] = [];
  if (perimeter?.features?.length) all.push(perimeter);
  for (const fc of Object.values(layers)) {
    if (fc?.features?.length) all.push(fc);
  }
  if (!all.length) return null;

  const bbox = mcaPreviewBboxFromCollections(...all);
  if (!bbox) return null;

  const pad = 16;
  const proj = (lon: number, lat: number): string => {
    const [x, y] = mcaPreviewProject(lon, lat, bbox, width, height, pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const shapes: string[] = [];
  const strokeFor = (id: string): string => {
    if (id.startsWith("USO_")) return "#16a34a";
    if (id.startsWith("HYD_")) return "#2563eb";
    if (id.startsWith("AMB_")) return "#7c3aed";
    if (id.startsWith("INFRA_")) return "#ea580c";
    if (id.startsWith("FUND_")) return "#0f172a";
    return "#94a3b8";
  };

  const fillFor = (id: string): string | null => {
    if (id.startsWith("USO_")) return "#22c55e";
    if (id.startsWith("AMB_")) return "#a78bfa";
    if (id.startsWith("INFRA_")) return "#fb923c";
    return null;
  };

  const addPolygonFc = (id: string, fc: FeatureCollection) => {
    const fill = fillFor(id);
    for (const f of fc.features) {
      const g = f.geometry;
      if (!g || g.type !== "Polygon") continue;
      const ring = g.coordinates[0];
      if (!ring?.length) continue;
      const pts = ring.map(([lon, lat]) => proj(lon, lat)).join(" ");
      shapes.push(
        `<polygon points="${pts}" fill="${fill ?? "none"}" stroke="${strokeFor(id)}" stroke-width="1.8" fill-opacity="0.38"/>`,
      );
    }
  };

  const addLineFc = (id: string, fc: FeatureCollection) => {
    for (const f of fc.features) {
      const g = f.geometry;
      if (!g) continue;
      const lines =
        g.type === "LineString"
          ? [g.coordinates]
          : g.type === "MultiLineString"
            ? g.coordinates
            : [];
      for (const coords of lines) {
        if (!coords?.length) continue;
        const pts = coords.map(([lon, lat]) => proj(lon, lat)).join(" ");
        shapes.push(
          `<polyline points="${pts}" fill="none" stroke="${strokeFor(id)}" stroke-width="2.2" stroke-linecap="round"/>`,
        );
      }
    }
  };

  const addPointFc = (id: string, fc: FeatureCollection) => {
    for (const f of fc.features) {
      const g = f.geometry;
      if (!g || g.type !== "Point") continue;
      const [lon, lat] = g.coordinates;
      const [x, y] = mcaPreviewProject(lon, lat, bbox, width, height, pad);
      shapes.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${strokeFor(id)}" stroke="#fff" stroke-width="1"/>`,
      );
    }
  };

  for (const [id, fc] of Object.entries(layers)) {
    if (!fc?.features?.length) continue;
    addPolygonFc(id, fc);
    if (options?.drawLines) addLineFc(id, fc);
    if (options?.drawPoints) addPointFc(id, fc);
  }
  if (perimeter?.features?.length) {
    addPolygonFc("perimeter", perimeter);
  }

  const bg =
    options?.background === "none"
      ? ""
      : `<rect width="100%" height="100%" fill="#f8fafc"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${bg}
  ${shapes.join("\n  ")}
</svg>`;
}
