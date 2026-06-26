import type { FeatureCollection } from "geojson";
import { mcaPreviewBboxFromCollections } from "./map-preview-bbox";
import { toFeatureCollection } from "./perimeter";
import type { McaProjectDoc } from "./types";

const ESRI_EXPORT =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export";

/** Snapshot Esri World Imagery (Node / API routes MCA). */
export async function fetchEsriSatelliteSnapshotServer(
  bbox: [number, number, number, number],
  width = 960,
  height = 672,
): Promise<{ dataUrl: string; buffer: Buffer; mime: string } | null> {
  const [minX, minY, maxX, maxY] = bbox;
  const params = new URLSearchParams({
    bbox: `${minX},${minY},${maxX},${maxY}`,
    bboxSR: "4326",
    imageSR: "4326",
    size: `${width},${height}`,
    format: "jpg",
    f: "image",
  });

  try {
    const res = await fetch(`${ESRI_EXPORT}?${params}`, {
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 500) return null;
    const mime = res.headers.get("content-type")?.includes("png") ? "image/png" : "image/jpeg";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    return { dataUrl, buffer, mime };
  } catch {
    return null;
  }
}

export type McaPdfMapImageResolve = {
  mapImageDataUrl: string | null;
  mode: "client" | "satellite-server" | "vector";
};

/** Prefer imagem do browser; senão satélite Esri no servidor quando pedido. */
export async function resolveMcaPdfMapImage(params: {
  project: McaProjectDoc;
  layers: Record<string, FeatureCollection>;
  clientMapImageDataUrl?: string | null;
  includeSatellite?: boolean;
  width?: number;
  height?: number;
}): Promise<McaPdfMapImageResolve> {
  const client = params.clientMapImageDataUrl?.trim();
  if (client?.startsWith("data:image")) {
    return { mapImageDataUrl: client, mode: "client" };
  }

  if (!params.includeSatellite) {
    return { mapImageDataUrl: null, mode: "vector" };
  }

  const perimeter = toFeatureCollection(params.project.perimeterGeoJson);
  const layerFcs = Object.values(params.layers).filter((fc) => fc?.features?.length);
  const bbox = mcaPreviewBboxFromCollections(perimeter, ...layerFcs);
  if (!bbox) {
    return { mapImageDataUrl: null, mode: "vector" };
  }

  const snap = await fetchEsriSatelliteSnapshotServer(
    bbox,
    params.width ?? 960,
    params.height ?? 672,
  );
  if (!snap) {
    return { mapImageDataUrl: null, mode: "vector" };
  }

  return { mapImageDataUrl: snap.dataUrl, mode: "satellite-server" };
}
