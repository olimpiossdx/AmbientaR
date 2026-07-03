import area from "@turf/area";
import { featureCollection } from "@turf/helpers";
import type { Feature, FeatureCollection, Polygon } from "geojson";

export function toFeatureCollection(
  geo: FeatureCollection | Feature | Polygon | undefined,
): FeatureCollection | null {
  if (!geo) return null;
  if ((geo as FeatureCollection).type === "FeatureCollection") {
    return geo as FeatureCollection;
  }
  if ((geo as Feature).type === "Feature") {
    return featureCollection([geo as Feature]);
  }
  const g = geo as { type?: string };
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    return featureCollection([
      { type: "Feature", properties: {}, geometry: geo as Polygon },
    ]);
  }
  return null;
}

export function perimeterAreaHa(geo: FeatureCollection | Feature | Polygon | undefined): number {
  const fc = toFeatureCollection(geo);
  if (!fc?.features?.length) return 0;
  return area(fc) / 10_000;
}

export function isValidPerimeter(geo: FeatureCollection | Feature | Polygon | undefined): boolean {
  const fc = toFeatureCollection(geo);
  if (!fc?.features?.length) return false;
  try {
    const a = area(fc);
    return a > 100;
  } catch {
    return false;
  }
}

export function clipToPerimeter(
  fc: FeatureCollection,
  perimeter: FeatureCollection,
): FeatureCollection {
  return fc;
}

export function emptyFc(): FeatureCollection {
  return featureCollection([]);
}

export function perimeterAsPolygon(
  geo: FeatureCollection | Feature | Polygon | undefined,
): Feature<Polygon> | null {
  const fc = toFeatureCollection(geo);
  const f = fc?.features?.[0];
  if (!f?.geometry) return null;
  if (f.geometry.type === "Polygon") {
    return { type: "Feature", properties: f.properties ?? {}, geometry: f.geometry };
  }
  return null;
}
