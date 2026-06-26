import type { GeoJSON } from "geojson";

export type WorkerChangeDetectResult = {
  polygons: Array<{
    type: string;
    geometry: GeoJSON.Polygon;
    area_ha: number;
    confidence: number;
  }>;
  summary: {
    loss_ha: number;
    gain_ha: number;
    bare_ha: number;
    total_changed_ha: number;
  };
  preview_path?: string;
  mask_path?: string;
  confidence: number;
};

export async function callFiscalIntelligenceWorkerDetect(params: {
  workspaceId: string;
  analysisId: string;
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  bbox: [number, number, number, number];
  beforePreviewPath: string;
  afterPreviewPath: string;
}): Promise<WorkerChangeDetectResult | null> {
  const workerUrl = process.env.FISCAL_INTELLIGENCE_WORKER_URL?.replace(/\/$/, "");
  const secret = process.env.WORKER_SHARED_SECRET;
  if (!workerUrl || !secret) return null;

  const res = await fetch(`${workerUrl}/v1/change/detect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Worker-Secret": secret,
    },
    body: JSON.stringify({
      workspace_id: params.workspaceId,
      analysis_id: params.analysisId,
      aoi: params.aoi,
      bbox: params.bbox,
      before_preview_path: params.beforePreviewPath,
      after_preview_path: params.afterPreviewPath,
    }),
    signal: AbortSignal.timeout(600_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Worker inteligência: ${res.status} ${text.slice(0, 200)}`);
  }

  return (await res.json()) as WorkerChangeDetectResult;
}
