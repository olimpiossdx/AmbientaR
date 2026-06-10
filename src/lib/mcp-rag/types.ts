export const MCP_RAG_OFFICIAL_SOURCES = "mcp_rag_official_sources";
export const MCP_RAG_INGESTION_RUNS = "mcp_rag_ingestion_runs";

export type OfficialSourceType =
  | "open_data"
  | "api"
  | "html"
  | "pdf"
  | "manual_upload";

export type IngestionRunMode = "discover" | "full" | "incremental" | "reprocess";

export type IngestionRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type McpRagOfficialSource = {
  id: string;
  name: string;
  sourceType: OfficialSourceType;
  baseUrl?: string;
  official: boolean;
  enabled: boolean;
  issuingBody?: string;
  documentCount?: number;
  chunkCount?: number;
  lastRunAt?: string;
  lastRunStatus?: IngestionRunStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type McpRagIngestionRun = {
  id: string;
  sourceId: string;
  sourceName: string;
  mode: IngestionRunMode;
  status: IngestionRunStatus;
  documentsSeen: number;
  documentsNew: number;
  documentsChanged: number;
  documentsSkipped: number;
  chunksCreated: number;
  embeddingsCreated: number;
  embeddingsReused: number;
  ocrDocuments: number;
  estimatedCostUsd: number;
  errorCount: number;
  errors: string[];
  startedAt: string;
  finishedAt?: string;
  metadata?: Record<string, unknown>;
};

export type McpToolDefinition = {
  id: string;
  name: string;
  description: string;
  status: "available" | "planned" | "disabled";
  backend: "firestore_rag" | "cloud_rag" | "pipeline" | "cursor_mcp";
};

export type McpRagCostBreakdown = {
  cloudRagChunks: number;
  juridicaChunks: number;
  embeddingEstimateUsd: number;
  ocrEstimateUsd: number;
  totalEstimateUsd: number;
  periodLabel: string;
  notes: string[];
};

export type McpRagPermissionRow = {
  role: string;
  canSearchJuridica: boolean;
  canSearchCloud: boolean;
  canManageHub: boolean;
};

export type McpRagHubOverview = {
  juridica: { sources: number; chunks: number };
  cloudRag: {
    enabled: boolean;
    graphOk: boolean;
    files: number;
    chunks: number;
    pendingIndex: number;
  };
  onedrive: {
    enabled: boolean;
    graphOk: boolean;
    lastSyncAt?: string;
  };
  officialSources: McpRagOfficialSource[];
  recentIngestionRuns: McpRagIngestionRun[];
  recentCloudJobs: Array<{
    id: string;
    type: string;
    status: string;
    startedAt: string;
    errors: string[];
  }>;
  costs: McpRagCostBreakdown;
  mcpTools: McpToolDefinition[];
  permissions: McpRagPermissionRow[];
  pipeline: {
    legislationPipelineEnabled: boolean;
    legislationPipelineUrl?: string;
    almgOpenDataBaseUrl?: string;
    portalScraperFallback: boolean;
  };
};
