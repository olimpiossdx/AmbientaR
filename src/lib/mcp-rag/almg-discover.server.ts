import {
  createIngestionRun,
  getOfficialSource,
  touchOfficialSourceAfterRun,
  updateIngestionRun,
} from "@/lib/mcp-rag/store.server";
import type { McpRagIngestionRun } from "@/lib/mcp-rag/types";

const DEFAULT_ALMG_BASE = "https://dadosabertos.almg.gov.br";

export type AlmgDiscoverResult = {
  run: McpRagIngestionRun;
};

export async function runAlmgOpenDataDiscover(): Promise<AlmgDiscoverResult> {
  const sourceId = "almg-open-data";
  const source = await getOfficialSource(sourceId);
  const sourceName = source?.name || "ALMG Dados Abertos";
  const baseUrl =
    process.env.ALMG_OPEN_DATA_BASE_URL?.trim() || DEFAULT_ALMG_BASE;

  const startedAt = new Date().toISOString();
  let run = await createIngestionRun({
    sourceId,
    sourceName,
    mode: "discover",
    status: "running",
    documentsSeen: 0,
    documentsNew: 0,
    documentsChanged: 0,
    documentsSkipped: 0,
    chunksCreated: 0,
    embeddingsCreated: 0,
    embeddingsReused: 0,
    ocrDocuments: 0,
    estimatedCostUsd: 0,
    errorCount: 0,
    errors: [],
    startedAt,
    metadata: { baseUrl },
  });

  const errors: string[] = [];
  let documentsSeen = 0;
  let metadata: Record<string, unknown> = { baseUrl };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(baseUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "text/html,application/json" },
    });
    clearTimeout(timeout);

    metadata = {
      ...metadata,
      httpStatus: res.status,
      reachable: res.ok,
    };

    if (!res.ok) {
      errors.push(`HTTP ${res.status} ao aceder ${baseUrl}`);
    } else {
      const body = await res.text();
      const docHints = [
        /legislacao/i,
        /csv/i,
        /download/i,
        /arquivo/i,
      ].filter((re) => re.test(body)).length;
      documentsSeen = Math.max(1, docHints);
      metadata = {
        ...metadata,
        bodyLength: body.length,
        catalogHints: docHints,
        note:
          "Descoberta inicial — ingestão completa requer pipeline Python/Cloud Run (Fase enterprise).",
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Falha de rede: ${msg}`);
    metadata = { ...metadata, reachable: false };
  }

  const finishedAt = new Date().toISOString();
  const status = errors.length ? "failed" : "completed";

  await updateIngestionRun(run.id, {
    status,
    documentsSeen,
    errorCount: errors.length,
    errors,
    finishedAt,
    metadata,
  });

  run = {
    ...run,
    status,
    documentsSeen,
    errorCount: errors.length,
    errors,
    finishedAt,
    metadata,
  };

  await touchOfficialSourceAfterRun(sourceId, run);

  return { run };
}
