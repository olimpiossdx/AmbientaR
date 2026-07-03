import type { StacPreviewItem } from "@/lib/study-maps/types";

type GeoJsonGeom = {
  type: string;
  coordinates?: unknown;
};

function walkCoords(coords: unknown, out: number[][]): void {
  if (!Array.isArray(coords)) return;
  if (coords.length >= 2 && typeof coords[0] === "number") {
    out.push([coords[0] as number, coords[1] as number]);
    return;
  }
  for (const c of coords) walkCoords(c, out);
}

function geometryFromPayload(payload: unknown): GeoJsonGeom | null {
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  if (o.type === "FeatureCollection" && Array.isArray(o.features)) {
    const f = o.features[0] as Record<string, unknown> | undefined;
    if (f?.geometry && typeof f.geometry === "object")
      return f.geometry as GeoJsonGeom;
  }
  if (o.type === "Feature" && o.geometry && typeof o.geometry === "object")
    return o.geometry as GeoJsonGeom;
  if (
    typeof o.type === "string" &&
    ["Polygon", "MultiPolygon", "Point"].includes(o.type)
  )
    return o as GeoJsonGeom;
  return null;
}

/** Geometria GeoJSON para o POST STAC (intersects). */
export function extractIntersectGeometry(
  geojson: unknown,
): GeoJsonGeom | null {
  return geometryFromPayload(geojson);
}

/**
 * Microsoft Planetary Computer — Sentinel-2 L2A, mais recente primeiro.
 * Não requer API key pública para pesquisa básica.
 */
export async function searchSentinel2Preview(
  geometry: GeoJsonGeom,
): Promise<StacPreviewItem[]> {
  const url =
    "https://planetarycomputer.microsoft.com/api/stac/v1/search";
  const body = {
    collections: ["sentinel-2-l2a"],
    intersects: geometry,
    limit: 5,
    sortby: [{ field: "datetime", direction: "desc" }],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`STAC search falhou: ${res.status} ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    features?: Array<{
      id: string;
      collection?: string;
      properties?: Record<string, unknown>;
      assets?: Record<string, { href?: string }>;
    }>;
  };
  const feats = json.features ?? [];
  return feats.map((f) => {
    const props = f.properties ?? {};
    const eo = (props["eo:cloud_cover"] as number | undefined) ?? null;
    const dt = (props.datetime as string | undefined) ?? null;
    const thumb =
      f.assets?.thumbnail?.href ??
      f.assets?.visual?.href ??
      f.assets?.rendered_preview?.href ??
      null;
    return {
      id: f.id,
      collection: f.collection ?? "sentinel-2-l2a",
      datetime: dt,
      cloudCover: eo,
      thumbnailHref: thumb,
    };
  });
}
