import type { Feature, Polygon, Position } from 'geojson';

export type MinimapSvgOptions = {
  title?: string;
  subtitle?: string;
  layerId?: string;
  width?: number;
  height?: number;
};

function ringToPoints(ring: Position[], bbox: [number, number, number, number], w: number, h: number): string {
  const [minX, minY, maxX, maxY] = bbox;
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;
  const pad = 12;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2 - 28;
  return ring
    .map(([lon, lat]) => {
      const x = pad + ((lon - minX) / spanX) * innerW;
      const y = pad + 22 + (1 - (lat - minY) / spanY) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function bboxFromPolygon(geojson: Record<string, unknown>): [number, number, number, number] | null {
  const geom = geojson as { type?: string; coordinates?: Position[][] };
  if (geom.type !== 'Polygon' || !geom.coordinates?.[0]?.length) return null;
  const ring = geom.coordinates[0];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (!Number.isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}

/**
 * SVG esquemático do perímetro (cliente converte para PNG).
 * Não substitui mapa SIG — apenas referência visual no PDF factual.
 */
export function perimeterToMinimapSvg(
  geojson: Record<string, unknown>,
  options?: MinimapSvgOptions,
): string | null {
  const bbox = bboxFromPolygon(geojson);
  if (!bbox) return null;

  const w = options?.width ?? 320;
  const h = options?.height ?? 220;
  const geom = geojson as unknown as Polygon;
  const ring = geom.coordinates[0];
  if (!ring?.length) return null;

  const points = ringToPoints(ring, bbox, w, h);
  const title = (options?.title ?? 'Perímetro').replace(/[<>&"]/g, '');
  const subtitle = (options?.subtitle ?? '').replace(/[<>&"]/g, '');
  const layerHint = options?.layerId
    ? `<text x="12" y="${h - 6}" font-size="9" fill="#64748b">${options.layerId}</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="12" y="16" font-size="11" font-weight="600" fill="#0f172a">${title}</text>
  ${subtitle ? `<text x="12" y="30" font-size="9" fill="#475569">${subtitle}</text>` : ''}
  <polygon points="${points}" fill="rgba(34,197,94,0.25)" stroke="#15803d" stroke-width="2"/>
  ${layerHint}
</svg>`;
}

/** Aceita Feature ou geometria GeoJSON. */
export function featureToMinimapSvg(
  feature: Feature<Polygon> | Polygon,
  options?: MinimapSvgOptions,
): string | null {
  const geom =
    'type' in feature && feature.type === 'Feature'
      ? (feature.geometry as Polygon)
      : (feature as Polygon);
  return perimeterToMinimapSvg(geom as unknown as Record<string, unknown>, options);
}
