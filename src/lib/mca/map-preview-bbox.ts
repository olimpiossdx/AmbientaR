import type { FeatureCollection } from "geojson";

export type McaPreviewBbox = [number, number, number, number];

export function mcaPreviewBboxFromCollections(
  ...fcs: (FeatureCollection | null | undefined)[]
): McaPreviewBbox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const walk = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (coords.length >= 2 && typeof coords[0] === "number") {
      const [lon, lat] = coords as [number, number];
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
      minX = Math.min(minX, lon);
      minY = Math.min(minY, lat);
      maxX = Math.max(maxX, lon);
      maxY = Math.max(maxY, lat);
      return;
    }
    for (const c of coords) walk(c);
  };

  for (const fc of fcs) {
    if (!fc?.features?.length) continue;
    for (const f of fc.features) {
      const g = f.geometry;
      if (!g || g.type === "GeometryCollection") continue;
      if ("coordinates" in g) walk(g.coordinates);
    }
  }

  if (!Number.isFinite(minX)) return null;
  const padX = (maxX - minX) * 0.06 || 0.001;
  const padY = (maxY - minY) * 0.06 || 0.001;
  return [minX - padX, minY - padY, maxX + padX, maxY + padY];
}

export function mcaPreviewProject(
  lon: number,
  lat: number,
  bbox: McaPreviewBbox,
  width: number,
  height: number,
  pad: number,
): [number, number] {
  const [minX, minY, maxX, maxY] = bbox;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const x = pad + ((lon - minX) / (maxX - minX || 1e-9)) * innerW;
  const y = pad + (1 - (lat - minY) / (maxY - minY || 1e-9)) * innerH;
  return [x, y];
}
