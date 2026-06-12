import type { GeoJSON } from "geojson";
import type { CreateFadWorkspaceInput, FadAoiSource } from "./types";

const AOI_SOURCES: FadAoiSource[] = ["car", "drawn", "shp", "kml", "coords"];

export function isGeoPolygon(
  value: unknown,
): value is GeoJSON.Polygon | GeoJSON.MultiPolygon {
  if (!value || typeof value !== "object") return false;
  const t = (value as GeoJSON.Geometry).type;
  return t === "Polygon" || t === "MultiPolygon";
}

export function parseCreateWorkspaceBody(body: unknown): CreateFadWorkspaceInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name || name.length > 200) return null;

  const input: CreateFadWorkspaceInput = { name };

  if (b.aoi != null) {
    if (!isGeoPolygon(b.aoi)) return null;
    input.aoi = b.aoi;
  }

  if (b.aoiSource != null) {
    if (!AOI_SOURCES.includes(b.aoiSource as FadAoiSource)) return null;
    input.aoiSource = b.aoiSource as FadAoiSource;
  }

  if (typeof b.carCode === "string" && b.carCode.trim()) {
    input.carCode = b.carCode.trim().slice(0, 80);
  }

  return input;
}
