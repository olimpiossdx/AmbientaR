export type PipelineIngestMode = "discover" | "incremental" | "full" | "reprocess";

export type PipelineIngestRequest = {
  sourceId: string;
  mode: PipelineIngestMode;
  limit?: number;
};

export type PipelineIngestResponse = {
  success: boolean;
  runId?: string;
  status?: string;
  documentsSeen?: number;
  chunksCreated?: number;
  message?: string;
  error?: string;
};

export function isLegislationPipelineEnabled(): boolean {
  return (
    process.env.LEGISLATION_PIPELINE_ENABLED === "true" ||
    process.env.LEGISLATION_PIPELINE_ENABLED === "1"
  );
}

export function getLegislationPipelineUrl(): string | null {
  const url = process.env.LEGISLATION_PIPELINE_URL?.trim();
  return url || null;
}

export async function callLegislationPipeline(
  body: PipelineIngestRequest,
): Promise<PipelineIngestResponse> {
  const base = getLegislationPipelineUrl();
  if (!base) {
    return {
      success: false,
      error:
        "LEGISLATION_PIPELINE_URL não configurada. Veja infra/legislation-pipeline/README.md",
    };
  }

  const secret =
    process.env.LEGISLATION_PIPELINE_SECRET ||
    process.env.WORKER_SHARED_SECRET ||
    "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/v1/ingest/run`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "X-Worker-Secret": secret } : {}),
      },
      body: JSON.stringify(body),
    });
    clearTimeout(timeout);

    const data = (await res.json()) as PipelineIngestResponse;
    if (!res.ok) {
      return {
        success: false,
        error: data.error || data.message || `Pipeline HTTP ${res.status}`,
      };
    }
    return data;
  } catch (e) {
    clearTimeout(timeout);
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function probeLegislationPipelineHealth(): Promise<{
  ok: boolean;
  url?: string;
  detail?: Record<string, unknown>;
  error?: string;
}> {
  const base = getLegislationPipelineUrl();
  if (!base) {
    return { ok: false, error: "URL não configurada" };
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/health`, {
      headers: { Accept: "application/json" },
    });
    const detail = (await res.json()) as Record<string, unknown>;
    return { ok: res.ok, url: base, detail };
  } catch (e) {
    return {
      ok: false,
      url: base,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
