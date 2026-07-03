import { runAlmgOpenDataDiscover } from "@/lib/mcp-rag/almg-discover.server";
import {
  callLegislationPipeline,
  isLegislationPipelineEnabled,
  type PipelineIngestMode,
} from "@/lib/mcp-rag/pipeline-client.server";
import {
  createIngestionRun,
  getOfficialSource,
  touchOfficialSourceAfterRun,
  updateIngestionRun,
} from "@/lib/mcp-rag/store.server";
import type { McpRagIngestionRun } from "@/lib/mcp-rag/types";

export async function runPipelineIngestion(input: {
  sourceId: string;
  mode: PipelineIngestMode;
  limit?: number;
}): Promise<{ run: McpRagIngestionRun; pipelineUsed: boolean }> {
  if (input.mode === "discover" && input.sourceId === "almg-open-data") {
    const result = await runAlmgOpenDataDiscover();
    return { run: result.run, pipelineUsed: false };
  }

  if (!isLegislationPipelineEnabled()) {
    throw new Error(
      "Pipeline enterprise desligado. Defina LEGISLATION_PIPELINE_ENABLED=true e LEGISLATION_PIPELINE_URL.",
    );
  }

  const source = await getOfficialSource(input.sourceId);
  const sourceName = source?.name || input.sourceId;
  const startedAt = new Date().toISOString();

  let run = await createIngestionRun({
    sourceId: input.sourceId,
    sourceName,
    mode: input.mode,
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
    metadata: { delegatedTo: "legislation-pipeline" },
  });

  const pipeline = await callLegislationPipeline({
    sourceId: input.sourceId,
    mode: input.mode,
    limit: input.limit,
  });

  const finishedAt = new Date().toISOString();
  const status = pipeline.success ? "completed" : "failed";
  const errors = pipeline.success
    ? []
    : [pipeline.error || "Falha no worker Python"];

  await updateIngestionRun(run.id, {
    status,
    documentsSeen: pipeline.documentsSeen ?? 0,
    chunksCreated: pipeline.chunksCreated ?? 0,
    errorCount: errors.length,
    errors,
    finishedAt,
    metadata: {
      delegatedTo: "legislation-pipeline",
      pipelineMessage: pipeline.message,
      pipelineRunId: pipeline.runId,
    },
  });

  run = {
    ...run,
    status,
    documentsSeen: pipeline.documentsSeen ?? 0,
    chunksCreated: pipeline.chunksCreated ?? 0,
    errorCount: errors.length,
    errors,
    finishedAt,
  };

  if (pipeline.success) {
    await touchOfficialSourceAfterRun(input.sourceId, run);
  }

  if (!pipeline.success) {
    throw new Error(errors[0]);
  }

  return { run, pipelineUsed: true };
}
