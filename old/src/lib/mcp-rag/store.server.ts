import { adminDb } from "@/lib/firebase-admin";
import {
  buildSeedOfficialSource,
  DEFAULT_OFFICIAL_SOURCES,
} from "@/lib/mcp-rag/official-sources-catalog";
import type {
  McpRagIngestionRun,
  McpRagOfficialSource,
} from "@/lib/mcp-rag/types";
import {
  MCP_RAG_INGESTION_RUNS,
  MCP_RAG_OFFICIAL_SOURCES,
} from "@/lib/mcp-rag/types";

export async function listOfficialSources(): Promise<McpRagOfficialSource[]> {
  const snap = await adminDb()
    .collection(MCP_RAG_OFFICIAL_SOURCES)
    .orderBy("name")
    .get();
  if (snap.empty) return [];
  return snap.docs.map((d) => d.data() as McpRagOfficialSource);
}

export async function getOfficialSource(
  id: string,
): Promise<McpRagOfficialSource | null> {
  const snap = await adminDb()
    .collection(MCP_RAG_OFFICIAL_SOURCES)
    .doc(id)
    .get();
  if (!snap.exists) return null;
  return snap.data() as McpRagOfficialSource;
}

export async function seedOfficialSourcesIfEmpty(): Promise<{
  seeded: number;
  existing: number;
}> {
  const col = adminDb().collection(MCP_RAG_OFFICIAL_SOURCES);
  const existing = await col.limit(1).get();
  if (!existing.empty) {
    const countSnap = await col.count().get();
    return { seeded: 0, existing: countSnap.data().count };
  }

  const now = new Date().toISOString();
  const batch = adminDb().batch();
  for (const seed of DEFAULT_OFFICIAL_SOURCES) {
    const doc = buildSeedOfficialSource(seed, now);
    batch.set(col.doc(doc.id), doc);
  }
  await batch.commit();
  return { seeded: DEFAULT_OFFICIAL_SOURCES.length, existing: 0 };
}

export async function updateOfficialSource(
  id: string,
  partial: Partial<McpRagOfficialSource>,
): Promise<McpRagOfficialSource | null> {
  const ref = adminDb().collection(MCP_RAG_OFFICIAL_SOURCES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const now = new Date().toISOString();
  await ref.set({ ...partial, updatedAt: now }, { merge: true });
  const updated = await ref.get();
  return updated.data() as McpRagOfficialSource;
}

export async function createIngestionRun(
  partial: Omit<McpRagIngestionRun, "id"> & { id?: string },
): Promise<McpRagIngestionRun> {
  const ref = partial.id
    ? adminDb().collection(MCP_RAG_INGESTION_RUNS).doc(partial.id)
    : adminDb().collection(MCP_RAG_INGESTION_RUNS).doc();
  const run: McpRagIngestionRun = { ...partial, id: ref.id };
  await ref.set(run);
  return run;
}

export async function updateIngestionRun(
  id: string,
  partial: Partial<McpRagIngestionRun>,
): Promise<void> {
  await adminDb()
    .collection(MCP_RAG_INGESTION_RUNS)
    .doc(id)
    .set(partial, { merge: true });
}

export async function listRecentIngestionRuns(
  limit = 20,
): Promise<McpRagIngestionRun[]> {
  const snap = await adminDb()
    .collection(MCP_RAG_INGESTION_RUNS)
    .orderBy("startedAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as McpRagIngestionRun);
}

export async function countKnowledgeSources(): Promise<number> {
  const snap = await adminDb().collection("knowledge_sources").count().get();
  return snap.data().count;
}

export async function countRagIndexChunks(): Promise<number> {
  const snap = await adminDb().collection("rag_index").count().get();
  return snap.data().count;
}

export async function listRecentCloudRagJobs(limit = 10): Promise<
  Array<{
    id: string;
    type: string;
    status: string;
    startedAt: string;
    errors: string[];
  }>
> {
  const snap = await adminDb()
    .collection("cloud_rag_jobs")
    .orderBy("startedAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: String(data.type || "unknown"),
      status: String(data.status || "unknown"),
      startedAt: String(data.startedAt || ""),
      errors: Array.isArray(data.errors) ? data.errors.slice(0, 3) : [],
    };
  });
}

export async function touchOfficialSourceAfterRun(
  sourceId: string,
  run: Pick<
    McpRagIngestionRun,
    "status" | "documentsSeen" | "chunksCreated" | "startedAt"
  >,
): Promise<void> {
  const ref = adminDb().collection(MCP_RAG_OFFICIAL_SOURCES).doc(sourceId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const prev = snap.data() as McpRagOfficialSource;
  await ref.set(
    {
      lastRunAt: run.startedAt,
      lastRunStatus: run.status,
      documentCount: run.documentsSeen,
      chunkCount: (prev.chunkCount || 0) + run.chunksCreated,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
