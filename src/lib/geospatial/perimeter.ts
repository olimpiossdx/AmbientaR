import area from "@turf/area";
import bbox from "@turf/bbox";
import buffer from "@turf/buffer";
import { featureCollection } from "@turf/helpers";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  Position,
} from "geojson";

const MIN_COORDINATE_POLYGON_BUFFER_M = 80;

function ringLooksValid(ring: Position[]): boolean {
  return ring.length >= 4;
}

function closeRing(ring: Position[]): Position[] {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function normalizeToFeaturePolygon(geometry: Geometry): Feature<Polygon> | null {
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates.map((ring) => closeRing(ring));
    if (!coords[0] || !ringLooksValid(coords[0])) return null;
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: coords } };
  }
  if (geometry.type === "MultiPolygon") {
    const first = geometry.coordinates[0];
    if (!first?.[0] || !ringLooksValid(first[0])) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [closeRing(first[0])] },
    };
  }
  return null;
}

function parseGeoJsonObject(raw: unknown): Feature<Polygon> | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.type === "Feature") {
    const g = (obj as unknown as Feature).geometry;
    if (g) return normalizeToFeaturePolygon(g);
  }
  if (obj.type === "FeatureCollection") {
    const fc = obj as unknown as FeatureCollection;
    for (const f of fc.features ?? []) {
      if (f.geometry) {
        const p = normalizeToFeaturePolygon(f.geometry);
        if (p) return p;
      }
    }
  }
  if (typeof obj.type === "string") {
    return normalizeToFeaturePolygon(obj as unknown as Geometry);
  }
  return null;
}

function parseCoordinatePair(text: string): Feature<Polygon> | null {
  const cleaned = text.replace(/[;\n]/g, " ").trim();
  const parts = cleaned.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  let lat = Number(parts[0]);
  let lng = Number(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    const swap = lat;
    lat = lng;
    lng = swap;
  }
  const pointFeature: Feature = {
    type: "Feature",
    properties: {},
    geometry: { type: "Point", coordinates: [lng, lat] },
  };
  const buffered = buffer(pointFeature, MIN_COORDINATE_POLYGON_BUFFER_M, {
    units: "meters",
  });
  if (!buffered || buffered.type !== "Feature" || !buffered.geometry) return null;
  return normalizeToFeaturePolygon(buffered.geometry);
}

function parseWktPolygon(wkt: string): Feature<Polygon> | null {
  const match = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
  if (!match?.[1]) return null;
  const pairs = match[1].split(",").map((pair) => {
    const nums = pair.trim().split(/\s+/).map(Number);
    return [nums[0], nums[1]] as Position;
  });
  if (pairs.length < 3) return null;
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [closeRing(pairs)] },
  };
}

export type PerimeterParseInput = {
  dataType: "car" | "coordinates" | "polygon" | "kml" | "shp";
  data: string;
};

const MAX_SHP_ZIP_BYTES = 8 * 1024 * 1024;

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const clean = b64.replace(/^data:[^;]+;base64,/, "").trim();
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(clean, "base64");
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function parseShpZipBase64(b64: string): Promise<Feature<Polygon> | null> {
  const buffer = base64ToArrayBuffer(b64);
  if (buffer.byteLength > MAX_SHP_ZIP_BYTES) return null;
  const shp = (await import("shpjs")).default;
  const geojson = await shp(buffer);
  return parseGeoJsonObject(geojson);
}

export async function parsePerimeterPolygon(
  input: PerimeterParseInput,
): Promise<{
  polygon: Feature<Polygon>;
  areaHa: number;
  bbox: [number, number, number, number];
} | null> {
  const trimmed = input.data.trim();
  if (!trimmed) return null;

  let feature: Feature<Polygon> | null = null;

  if (input.dataType === "coordinates") {
    feature = parseCoordinatePair(trimmed);
  } else if (input.dataType === "shp") {
    try {
      feature = await parseShpZipBase64(trimmed);
    } catch {
      feature = null;
    }
  } else if (input.dataType === "polygon" || input.dataType === "car") {
    if (trimmed.toUpperCase().startsWith("POLYGON")) {
      feature = parseWktPolygon(trimmed);
    } else {
      try {
        feature = parseGeoJsonObject(JSON.parse(trimmed));
      } catch {
        feature = parseWktPolygon(trimmed);
      }
    }
  }

  if (!feature) return null;

  const areaM2 = area(feature);
  const areaHa = areaM2 / 10_000;
  if (areaHa <= 0) return null;

  const box = bbox(feature) as [number, number, number, number];
  return { polygon: feature, areaHa, bbox: box };
}

export function perimeterToGeoJson(feature: Feature<Polygon>): Record<string, unknown> {
  return feature as unknown as Record<string, unknown>;
}

export function expandBbox(
  box: [number, number, number, number],
  marginDegrees = 0.02,
): [number, number, number, number] {
  return [
    box[0] - marginDegrees,
    box[1] - marginDegrees,
    box[2] + marginDegrees,
    box[3] + marginDegrees,
  ];
}

/** Evita falha turf em geometrias inválidas ao agregar features externas. */
export function safeFeatureCollection(features: Feature[]): FeatureCollection {
  return featureCollection(features.filter((f) => f?.geometry));
}
