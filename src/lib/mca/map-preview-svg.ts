import type { FeatureCollection } from "geojson";

/** SVG esquemático multi-layer (cliente → PNG para POST /pdf). */
export function mcaLayersToPreviewSvg(
  perimeter: FeatureCollection | null,
  layers: Record<string, FeatureCollection>,
  width = 640,
  height = 480,
): string | null {
  const all: FeatureCollection[] = [];
  if (perimeter?.features?.length) all.push(perimeter);
  for (const fc of Object.values(layers)) {
    if (fc?.features?.length) all.push(fc);
  }
  if (!all.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const walk = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (coords.length >= 2 && typeof coords[0] === "number") {
      const [lon, lat] = coords as [number, number];
      minX = Math.min(minX, lon);
      minY = Math.min(minY, lat);
      maxX = Math.max(maxX, lon);
      maxY = Math.max(maxY, lat);
      return;
    }
    for (const c of coords) walk(c);
  };

  for (const fc of all) {
    for (const f of fc.features) {
      const g = f.geometry;
      if (!g || g.type === "GeometryCollection") continue;
      if ("coordinates" in g) walk(g.coordinates);
    }
  }
  if (!Number.isFinite(minX)) return null;

  const pad = 16;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;

  const proj = (lon: number, lat: number): string => {
    const x = pad + ((lon - minX) / spanX) * innerW;
    const y = pad + (1 - (lat - minY) / spanY) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const polys: string[] = [];
  const strokeFor = (id: string): string => {
    if (id.startsWith("USO_")) return "#16a34a";
    if (id.startsWith("HYD_")) return "#2563eb";
    if (id.startsWith("AMB_")) return "#7c3aed";
    if (id.startsWith("INFRA_")) return "#ea580c";
    if (id.startsWith("FUND_")) return "#0f172a";
    return "#94a3b8";
  };

  const addFc = (id: string, fc: FeatureCollection, fill: string | null) => {
    for (const f of fc.features) {
      const g = f.geometry;
      if (!g || g.type !== "Polygon") continue;
      const ring = g.coordinates[0];
      if (!ring?.length) continue;
      const pts = ring.map(([lon, lat]) => proj(lon, lat)).join(" ");
      polys.push(
        `<polygon points="${pts}" fill="${fill ?? "none"}" stroke="${strokeFor(id)}" stroke-width="1.5" fill-opacity="0.35"/>`,
      );
    }
  };

  for (const [id, fc] of Object.entries(layers)) {
    if (!fc?.features?.length) continue;
    const fill =
      id.startsWith("USO_") ? "#22c55e" : id.startsWith("AMB_") ? "#a78bfa" : id.startsWith("INFRA_") ? "#fb923c" : null;
    addFc(id, fc, fill);
  }
  if (perimeter?.features?.length) {
    addFc("perimeter", perimeter, "rgba(34,197,94,0.1)");
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  ${polys.join("\n  ")}
</svg>`;
}
