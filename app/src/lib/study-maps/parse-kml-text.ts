import type { Feature, Polygon, Position } from "geojson";

/**
 * Parser KML/GeoJSON para o submenu Mapas (Estudos Técnicos).
 * Cópia autónoma — não importa src/lib/geospatial/* (Análise Geoespacial IA).
 */

function parseNum(s: string): number | undefined {
  const n = Number(String(s).replace(",", ".").trim());
  return Number.isFinite(n) ? n : undefined;
}

function closeRing(ring: Position[]): Position[] {
  if (ring.length < 3) return ring;
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function normalizeToFeaturePolygon(geometry: {
  type?: string;
  coordinates?: unknown;
}): Feature<Polygon> | null {
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    const coords = (geometry.coordinates as Position[][]).map((ring) => closeRing(ring));
    if (!coords[0] || coords[0].length < 4) return null;
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: coords } };
  }
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    const first = (geometry.coordinates as Position[][][])[0];
    if (!first?.[0] || first[0].length < 3) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [closeRing(first[0])] },
    };
  }
  return null;
}

function parseKmlCoordinatesFromText(text: string): Position[] {
  const coordBlocks = [...text.matchAll(/<coordinates[^>]*>([\s\S]*?)<\/coordinates>/gi)];
  const all: Position[] = [];
  for (const m of coordBlocks) {
    const pairs = m[1]!
      .trim()
      .split(/\s+/)
      .map((p) => p.split(",").map((x) => parseNum(x)))
      .filter((a) => a.length >= 2 && a[0] != null && a[1] != null) as number[][];
    for (const c of pairs) {
      all.push([c[0]!, c[1]!]);
    }
  }
  return all;
}

export function parseKmlTextToFeaturePolygon(text: string): Feature<Polygon> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const raw = JSON.parse(trimmed) as Record<string, unknown>;
      if (raw.type === "Feature") {
        const g = (raw as { geometry?: { type?: string; coordinates?: unknown } }).geometry;
        if (g) return normalizeToFeaturePolygon(g);
      }
      if (raw.type === "FeatureCollection") {
        const features = (
          raw as { features?: { geometry?: { type?: string; coordinates?: unknown } }[] }
        ).features;
        for (const f of features ?? []) {
          if (f.geometry) {
            const p = normalizeToFeaturePolygon(f.geometry);
            if (p) return p;
          }
        }
      }
      if (typeof raw.type === "string") {
        return normalizeToFeaturePolygon(raw as { type?: string; coordinates?: unknown });
      }
    } catch {
      /* fall through */
    }
  }

  const ring = parseKmlCoordinatesFromText(trimmed);
  if (ring.length >= 3) {
    const closed = closeRing(ring);
    if (closed.length < 4) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [closed] },
    };
  }

  return null;
}
