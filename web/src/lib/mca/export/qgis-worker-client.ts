import type { FeatureCollection } from "geojson";
import type { McaLayoutJson } from "../types-v2";

export type LayoutRenderPayload = {
  layoutJson: McaLayoutJson;
  layers: Record<string, FeatureCollection>;
  projectId?: string;
  mapImageDataUrl?: string | null;
};

export function getQgisWorkerBaseUrl(): string | null {
  const url =
    process.env.MCA_QGIS_WORKER_URL?.trim() ||
    process.env.MCA_ENGINE_URL?.trim() ||
    null;
  return url ? url.replace(/\/$/, "") : null;
}

export function isQgisWorkerConfigured(): boolean {
  return Boolean(getQgisWorkerBaseUrl());
}

export async function checkQgisWorkerHealth(): Promise<boolean> {
  const base = getQgisWorkerBaseUrl();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === "ok";
  } catch {
    return false;
  }
}

export async function renderLayoutPdfViaWorker(
  payload: LayoutRenderPayload,
): Promise<Buffer> {
  const base = getQgisWorkerBaseUrl();
  if (!base) {
    throw new Error(
      "Worker QGIS não configurado. Defina MCA_QGIS_WORKER_URL ou MCA_ENGINE_URL.",
    );
  }
  const secret = process.env.WORKER_SHARED_SECRET?.trim();
  const res = await fetch(`${base}/v1/layout/render-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-Worker-Secret": secret } : {}),
    },
    body: JSON.stringify({
      layoutJson: payload.layoutJson,
      layers: payload.layers,
      projectId: payload.projectId,
      mapImageDataUrl: payload.mapImageDataUrl ?? undefined,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(err || `Worker render falhou (${res.status})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) {
    throw new Error("PDF do worker demasiado pequeno.");
  }
  return buf;
}
