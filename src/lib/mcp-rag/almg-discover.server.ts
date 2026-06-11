import {
  createIngestionRun,
  getOfficialSource,
  seedOfficialSourcesIfEmpty,
  touchOfficialSourceAfterRun,
  updateIngestionRun,
} from "@/lib/mcp-rag/store.server";
import {
  ALMG_LEGISLATION_CSV_DOC,
  getAlmgOpenDataBaseUrl,
  probeAlmgApiV2,
} from "@/lib/mcp-rag/almg-client.server";
import type { McpRagIngestionRun } from "@/lib/mcp-rag/types";

export type AlmgDiscoverResult = {
  run: McpRagIngestionRun;
};

export async function runAlmgOpenDataDiscover(): Promise<AlmgDiscoverResult> {
  await seedOfficialSourcesIfEmpty();

  const sourceId = "almg-open-data";
  const source = await getOfficialSource(sourceId);
  const sourceName = source?.name || "ALMG Dados Abertos";
  const baseUrl = getAlmgOpenDataBaseUrl();

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
  let metadata: Record<string, unknown> = {
    baseUrl,
    legislationCsvDoc: ALMG_LEGISLATION_CSV_DOC,
  };

  const apiProbe = await probeAlmgApiV2();
  metadata = {
    ...metadata,
    apiV2: apiProbe,
  };

  if (!apiProbe.reachable) {
    errors.push(
      apiProbe.error ||
        "API v2 ALMG inacessível (/api/v2/pronunciamentos/tipos).",
    );
  } else {
    documentsSeen += 1;
  }

  let docPageOk = false;
  let docPageStatus = 0;
  try {
    await new Promise((r) => setTimeout(r, 1100));
    const docRes = await fetch(ALMG_LEGISLATION_CSV_DOC, {
      headers: { Accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });
    docPageStatus = docRes.status;
    docPageOk = docRes.ok;
  } catch {
    docPageOk = false;
  }

  if (docPageOk) {
    metadata = {
      ...metadata,
      legislationCatalogPage: { reachable: true, url: ALMG_LEGISLATION_CSV_DOC },
    };
    documentsSeen += 1;
  } else {
    metadata = {
      ...metadata,
      legislationCatalogPage: {
        reachable: false,
        url: ALMG_LEGISLATION_CSV_DOC,
        status: docPageStatus,
      },
    };
    if (apiProbe.reachable) {
      errors.push(
        "Página do catálogo CSV de Legislação Mineira não respondeu como esperado.",
      );
    }
  }

  metadata = {
    ...metadata,
    note:
      documentsSeen > 0
        ? `Descoberta OK: API v2 ativa; catálogo CSV documentado em ${ALMG_LEGISLATION_CSV_DOC}. Ingestão completa (texto + embeddings) via worker Python.`
        : "Falha na descoberta — verifique conectividade com dadosabertos.almg.gov.br.",
    pipelineNextStep: "POST /api/mcp-rag/ingestion/pipeline com mode=incremental",
  };

  const finishedAt = new Date().toISOString();
  const status = errors.length && !apiProbe.reachable ? "failed" : "completed";

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
