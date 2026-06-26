import { estimateMcpRagCosts } from "@/lib/mcp-rag/cost-estimate";
import { getMcpToolsRegistry } from "@/lib/mcp-rag/mcp-tools-registry";
import { MCP_RAG_PERMISSION_MATRIX } from "@/lib/mcp-rag/permissions";
import {
  countKnowledgeSources,
  countRagIndexChunks,
  listOfficialSources,
  listRecentCloudRagJobs,
  listRecentIngestionRuns,
  seedOfficialSourcesIfEmpty,
} from "@/lib/mcp-rag/store.server";
import type { McpRagHubOverview } from "@/lib/mcp-rag/types";
import {
  isCloudRagEnabled,
} from "@/lib/cloud-rag/deploy-flags";
import {
  countAllFiles,
  countChunks,
  countFilesByIndexStatus,
} from "@/lib/cloud-rag/store";
import { getSyncSource } from "@/lib/onedrive/catalog-store";
import {
  isMicrosoftGraphConfigured,
  isOnedriveSyncEnabled,
} from "@/lib/onedrive/deploy-flags";
import { getDelegatedTokenDoc } from "@/lib/onedrive/consumer-oauth";
import {
  getGraphAccessTokenForMode,
  getGraphAuthMode,
} from "@/lib/onedrive/graph";
import {
  isLegislationPipelineEnabled,
  probeLegislationPipelineHealth,
} from "@/lib/mcp-rag/pipeline-client.server";

export async function buildMcpRagHubOverview(): Promise<McpRagHubOverview> {
  await seedOfficialSourcesIfEmpty();

  const cloudEnabled = isCloudRagEnabled();
  const graphConfigured = isMicrosoftGraphConfigured();
  const graphAuthMode = getGraphAuthMode();

  let cloudGraphOk = false;
  if (cloudEnabled && graphConfigured) {
    try {
      await getGraphAccessTokenForMode(graphAuthMode);
      cloudGraphOk = true;
    } catch {
      cloudGraphOk = false;
    }
  }

  const onedriveEnabled = isOnedriveSyncEnabled();
  let onedriveGraphOk = false;
  if (graphConfigured) {
    try {
      await getGraphAccessTokenForMode(graphAuthMode);
      onedriveGraphOk = true;
    } catch {
      onedriveGraphOk = false;
    }
  }

  const [
    juridicaSources,
    juridicaChunks,
    cloudFiles,
    cloudChunks,
    indexStatus,
    officialSources,
    recentIngestionRuns,
    recentCloudJobs,
    syncSource,
    delegatedDoc,
    pipelineHealth,
  ] = await Promise.all([
    countKnowledgeSources().catch(() => 0),
    countRagIndexChunks().catch(() => 0),
    cloudEnabled ? countAllFiles().catch(() => 0) : Promise.resolve(0),
    cloudEnabled ? countChunks().catch(() => 0) : Promise.resolve(0),
    cloudEnabled
      ? countFilesByIndexStatus().catch(() => ({}))
      : Promise.resolve({}),
    listOfficialSources(),
    listRecentIngestionRuns(15),
    listRecentCloudRagJobs(10),
    onedriveEnabled ? getSyncSource().catch(() => null) : Promise.resolve(null),
    getDelegatedTokenDoc().catch(() => null),
    isLegislationPipelineEnabled()
      ? probeLegislationPipelineHealth().catch(() => ({
          ok: false,
          error: "probe failed",
        }))
      : Promise.resolve({ ok: false, error: "disabled" }),
  ]);

  const pendingIndex = Number(
    (indexStatus as Record<string, number>).pending || 0,
  );

  const costs = estimateMcpRagCosts({
    cloudRagChunks: cloudChunks,
    juridicaChunks,
  });

  return {
    juridica: { sources: juridicaSources, chunks: juridicaChunks },
    cloudRag: {
      enabled: cloudEnabled,
      graphOk: cloudGraphOk || Boolean(delegatedDoc?.accessToken),
      files: cloudFiles,
      chunks: cloudChunks,
      pendingIndex,
    },
    onedrive: {
      enabled: onedriveEnabled,
      graphOk: onedriveGraphOk || Boolean(delegatedDoc?.accessToken),
      lastSyncAt: syncSource?.lastSyncAt,
    },
    officialSources,
    recentIngestionRuns,
    recentCloudJobs,
    costs,
    mcpTools: getMcpToolsRegistry(),
    permissions: MCP_RAG_PERMISSION_MATRIX,
    pipeline: {
      legislationPipelineEnabled: isLegislationPipelineEnabled(),
      legislationPipelineUrl: process.env.LEGISLATION_PIPELINE_URL,
      legislationPipelineHealthy: pipelineHealth.ok,
      legislationPipelineDetail:
        "detail" in pipelineHealth ? pipelineHealth.detail : undefined,
      almgOpenDataBaseUrl:
        process.env.ALMG_OPEN_DATA_BASE_URL ||
        "https://dadosabertos.almg.gov.br",
      portalScraperFallback:
        process.env.ALMG_PORTAL_SCRAPER_FALLBACK === "true" ||
        process.env.ALMG_PORTAL_SCRAPER_FALLBACK === "1",
    },
  };
}
