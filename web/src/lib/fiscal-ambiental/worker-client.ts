import type { GeoJSON } from "geojson";

export type WorkerAssembleResult = {
  previewPath: string;
  geotiffPath?: string;
  bytes: number;
};

export async function callFiscalSatelliteWorkerAssemble(params: {
  workspaceId: string;
  mosaicId: string;
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  date: string;
  stacItemId: string;
  stacCollection: string;
}): Promise<WorkerAssembleResult | null> {
  const workerUrl = process.env.FISCAL_SATELLITE_WORKER_URL?.replace(/\/$/, "");
  const secret = process.env.WORKER_SHARED_SECRET;
  if (!workerUrl || !secret) return null;

  const res = await fetch(`${workerUrl}/v1/mosaic/assemble`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Worker-Secret": secret,
    },
    body: JSON.stringify({
      workspace_id: params.workspaceId,
      mosaic_id: params.mosaicId,
      aoi: params.aoi,
      date: params.date,
      stac_item_id: params.stacItemId,
      stac_collection: params.stacCollection,
    }),
    signal: AbortSignal.timeout(900_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Worker satelital: ${res.status} ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    preview_path: string;
    geotiff_path?: string;
    bytes?: number;
  };

  return {
    previewPath: json.preview_path,
    geotiffPath: json.geotiff_path,
    bytes: json.bytes ?? 0,
  };
}
