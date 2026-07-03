import area from "@turf/area";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import proj4 from "proj4";
import type { Fuso } from "@/lib/types";
import {
  DEFAULT_UTM_FUSO,
  EPSG_SIRGAS2000_GEOGRAPHIC,
  epsgSirgas2000UtmS,
} from "@/lib/coordinates/constants";
import "@/lib/coordinates/proj-setup";
import { azimutePlanarUtm, distanciaPlanarUtm } from "./azimute";
import type {
  MemorialComputation,
  MemorialGeoRing,
  MemorialSegment,
  MemorialUtmPoint,
} from "./types";

function geoCrs(): string {
  return `EPSG:${EPSG_SIRGAS2000_GEOGRAPHIC}`;
}

function utmCrs(fuso: Fuso): string {
  return `EPSG:${epsgSirgas2000UtmS(fuso)}`;
}

/** Decimal geográfico → UTM SIRGAS 2000 com precisão float (memorial cartorial). */
export function decimalToUtmSirgas2000Float(
  lat: number,
  lng: number,
  fuso: Fuso = DEFAULT_UTM_FUSO,
): MemorialUtmPoint {
  const [easting, northing] = proj4(geoCrs(), utmCrs(fuso), [lng, lat]);
  return { easting, northing };
}

function closeRing(ring: Position[]): Position[] {
  if (ring.length < 3) return ring;
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function ringLooksValid(ring: Position[]): boolean {
  return ring.length >= 4;
}

/** Extrai anel externo do polígono; MultiPolygon → maior por área geodésica. */
export function extractExteriorRing(
  feature: Feature<Polygon | MultiPolygon>,
): MemorialGeoRing | null {
  const geom = feature.geometry;
  if (geom.type === "Polygon") {
    const ring = geom.coordinates[0];
    if (!ring || !ringLooksValid(ring)) return null;
    return closeRing(ring);
  }
  if (geom.type === "MultiPolygon") {
    let best: MemorialGeoRing | null = null;
    let bestArea = -1;
    for (const poly of geom.coordinates) {
      const ring = poly[0];
      if (!ring || !ringLooksValid(ring)) continue;
      const closed = closeRing(ring);
      const partial: Feature<Polygon> = {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [closed] },
      };
      const a = area(partial);
      if (a > bestArea) {
        bestArea = a;
        best = closed;
      }
    }
    return best;
  }
  return null;
}

export function ringToUtmPoints(
  ring: MemorialGeoRing,
  fuso: Fuso,
): MemorialUtmPoint[] {
  return ring.map(([lng, lat]) =>
    decimalToUtmSirgas2000Float(lat!, lng!, fuso),
  );
}

/** Área planar (shoelace) em m² a partir de coordenadas UTM. */
export function shoelaceAreaM2(points: MemorialUtmPoint[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    sum += p1.easting * p2.northing - p2.easting * p1.northing;
  }
  return Math.abs(sum) / 2;
}

export function perimeterLengthM(points: MemorialUtmPoint[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    total += distanciaPlanarUtm(
      p1.easting,
      p1.northing,
      p2.easting,
      p2.northing,
    );
  }
  return total;
}

export function buildMemorialSegments(
  utmRing: MemorialUtmPoint[],
  confrontantes: string[] = [],
): MemorialSegment[] {
  const segments: MemorialSegment[] = [];
  const n = utmRing.length;
  if (n < 2) return segments;

  for (let i = 0; i < n - 1; i++) {
    const p1 = utmRing[i]!;
    const p2 = utmRing[i + 1]!;
    segments.push({
      fromVertex: `P-${i + 1}`,
      toVertex: i + 2 < n ? `P-${i + 2}` : "P-1",
      easting1: p1.easting,
      northing1: p1.northing,
      easting2: p2.easting,
      northing2: p2.northing,
      distancia: distanciaPlanarUtm(
        p1.easting,
        p1.northing,
        p2.easting,
        p2.northing,
      ),
      azimute: azimutePlanarUtm(
        p1.easting,
        p1.northing,
        p2.easting,
        p2.northing,
      ),
      confrontante: confrontantes[i]?.trim() ?? "",
    });
  }
  return segments;
}

export function computeMemorialFromPolygon(
  feature: Feature<Polygon | MultiPolygon>,
  fuso: Fuso,
  confrontantes: string[] = [],
): MemorialComputation | null {
  const ring = extractExteriorRing(feature);
  if (!ring) return null;

  const utmRing = ringToUtmPoints(ring, fuso);
  const areaM2 = shoelaceAreaM2(utmRing);
  const perimetroM = perimeterLengthM(utmRing);
  const segments = buildMemorialSegments(utmRing, confrontantes);

  return {
    segments,
    utmRing,
    metrics: {
      areaHa: areaM2 / 10_000,
      perimetroM,
      vertexCount: Math.max(0, utmRing.length - 1),
      fuso,
    },
  };
}

/** Normaliza Feature de upload (Polygon ou MultiPolygon). */
export function normalizePolygonFeature(
  geo: Feature<Polygon | MultiPolygon> | Feature | Polygon | MultiPolygon,
): Feature<Polygon | MultiPolygon> | null {
  if ((geo as Feature).type === "Feature") {
    const f = geo as Feature;
    if (!f.geometry) return null;
    if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
      return f as Feature<Polygon | MultiPolygon>;
    }
    return null;
  }
  const g = geo as Polygon | MultiPolygon;
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    return { type: "Feature", properties: {}, geometry: g };
  }
  return null;
}
