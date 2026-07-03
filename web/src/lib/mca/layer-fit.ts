import bbox from "@turf/bbox";
import type { FeatureCollection, Geometry, Position } from "geojson";

function walkCoords(geom: Geometry, fn: (c: Position) => Position): Geometry {
  if (geom.type === "GeometryCollection") {
    return {
      ...geom,
      geometries: geom.geometries.map((g) => walkCoords(g, fn)),
    };
  }
  if ("coordinates" in geom) {
    const mapRing = (ring: Position[]): Position[] =>
      ring.map((c) => fn(c));
    if (geom.type === "Point") {
      return { ...geom, coordinates: fn(geom.coordinates) };
    }
    if (geom.type === "LineString" || geom.type === "MultiPoint") {
      return { ...geom, coordinates: geom.coordinates.map((c) => fn(c as Position)) };
    }
    if (geom.type === "Polygon" || geom.type === "MultiLineString") {
      return {
        ...geom,
        coordinates: (geom.coordinates as Position[][]).map((ring) => mapRing(ring)),
      };
    }
    if (geom.type === "MultiPolygon") {
      return {
        ...geom,
        coordinates: (geom.coordinates as Position[][][]).map((poly) =>
          poly.map((ring) => mapRing(ring)),
        ),
      };
    }
  }
  return geom;
}

function fcBbox(fc: FeatureCollection): [number, number, number, number] | null {
  try {
    const b = bbox(fc);
    return b.every(Number.isFinite) ? (b as [number, number, number, number]) : null;
  } catch {
    return null;
  }
}

/** Reprojeta layers importadas para o bbox do perímetro (demo/CAD desalinhado). */
export function fitLayersToPerimeter(
  layers: Record<string, FeatureCollection>,
  perimeter: FeatureCollection,
): Record<string, FeatureCollection> {
  const srcParts = Object.values(layers).filter((fc) => fc.features?.length);
  if (!srcParts.length || !perimeter.features?.length) return layers;

  const srcBbox = fcBbox({ type: "FeatureCollection", features: srcParts.flatMap((f) => f.features) });
  const dstBbox = fcBbox(perimeter);
  if (!srcBbox || !dstBbox) return layers;

  const [sMinX, sMinY, sMaxX, sMaxY] = srcBbox;
  const [dMinX, dMinY, dMaxX, dMaxY] = dstBbox;
  const sW = sMaxX - sMinX || 1e-9;
  const sH = sMaxY - sMinY || 1e-9;
  const dW = dMaxX - dMinX || 1e-9;
  const dH = dMaxY - dMinY || 1e-9;
  const pad = 0.08;

  const mapCoord = (c: Position): Position => {
    const nx = (c[0] - sMinX) / sW;
    const ny = (c[1] - sMinY) / sH;
    return [
      dMinX + pad * dW + nx * (1 - 2 * pad) * dW,
      dMinY + pad * dH + ny * (1 - 2 * pad) * dH,
      ...(c.length > 2 ? c.slice(2) : []),
    ];
  };

  const out: Record<string, FeatureCollection> = {};
  for (const [key, fc] of Object.entries(layers)) {
    out[key] = {
      type: "FeatureCollection",
      features: fc.features.map((f) => ({
        ...f,
        geometry: f.geometry ? walkCoords(f.geometry, mapCoord) : f.geometry,
      })),
    };
  }
  return out;
}
