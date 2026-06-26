export type CloudRagIndexStatus =
  | "pending"
  | "indexed"
  | "skipped"
  | "failed";

export type CloudRagJobType = "sync" | "index";
export type CloudRagJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export const CLOUD_RAG_FILES = "cloud_rag_files";
export const CLOUD_RAG_CHUNKS = "cloud_rag_chunks";
export const CLOUD_RAG_JOBS = "cloud_rag_jobs";
export const CLOUD_RAG_LIBRARY_STATE = "cloud_rag_library_state";

export const LIBRARY_SYNC_SOURCE_ID = "library";

export type CloudRagFile = {
  id: string;
  driveId: string;
  itemId: string;
  path: string;
  name: string;
  isFolder: boolean;
  size?: number;
  mimeType?: string;
  eTag?: string;
  modifiedAt?: string;
  deleted: boolean;
  indexStatus: CloudRagIndexStatus;
  indexError?: string;
  rawText?: string;
  contentHash?: string;
  indexedAt?: string;
  extension?: string;
  clientHint?: string;
  syncSourceId: string;
  updatedAt?: string;
};

export type CloudRagChunk = {
  id: string;
  fileId: string;
  chunkIndex: number;
  chunkText: string;
  path: string;
  fileName: string;
  itemId: string;
  driveId: string;
  extension?: string;
  clientHint?: string;
  keywords: string[];
  updatedAt?: string;
};

export type CloudRagJob = {
  id: string;
  type: CloudRagJobType;
  status: CloudRagJobStatus;
  progress: {
    processed: number;
    pages?: number;
    totalEstimate?: number;
  };
  errors: string[];
  deltaLink?: string;
  nextUrl?: string;
  driveId?: string;
  rootItemId?: string;
  rootPath?: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type CloudRagLibraryState = {
  id: typeof LIBRARY_SYNC_SOURCE_ID;
  driveId: string;
  driveName?: string;
  rootItemId: string;
  rootPath: string;
  lastDeltaLink?: string;
  lastSyncAt?: string;
  catalogVersion?: number;
  updatedAt?: string;
};

export type CloudRagSearchHit = {
  chunkText: string;
  path: string;
  fileName: string;
  itemId: string;
  fileId: string;
  score: number;
};

export type CloudRagSearchOptions = {
  query?: string;
  pathPrefix?: string;
  cpfCnpj?: string;
  extensions?: string[];
  maxChunks?: number;
  modifiedAfter?: string;
};
