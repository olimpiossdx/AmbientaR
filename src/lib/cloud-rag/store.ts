import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import {
  chunkDocId,
  clientHintFromPath,
  extensionFromName,
  fileDocId,
} from "@/lib/cloud-rag/path-utils";
import type {
  CloudRagChunk,
  CloudRagFile,
  CloudRagJob,
  CloudRagLibraryState,
} from "@/lib/cloud-rag/types";
import {
  CLOUD_RAG_CHUNKS,
  CLOUD_RAG_FILES,
  CLOUD_RAG_JOBS,
  CLOUD_RAG_LIBRARY_STATE,
  LIBRARY_SYNC_SOURCE_ID,
} from "@/lib/cloud-rag/types";
import type { GraphDriveItem } from "@/lib/onedrive/types";
import { itemPathFromParentReference } from "@/lib/onedrive/catalog-store";
import {
  INDEXABLE_EXTENSIONS,
  SKIP_EXTENSIONS,
} from "@/lib/cloud-rag/config";

function isFolder(item: GraphDriveItem): boolean {
  return Boolean(item.folder);
}

function isDeletedItem(item: GraphDriveItem): boolean {
  return Boolean(item.deleted);
}

export function resolveIndexStatusForItem(
  item: GraphDriveItem,
  path: string,
): CloudRagFile["indexStatus"] {
  if (isDeletedItem(item) || isFolder(item)) return "skipped";
  const ext = extensionFromName(item.name || path);
  if (!ext || SKIP_EXTENSIONS.has(ext)) return "skipped";
  if (!INDEXABLE_EXTENSIONS.has(ext)) return "skipped";
  return "pending";
}

export async function upsertCloudRagFileFromGraphItem(
  driveId: string,
  item: GraphDriveItem,
  existing?: CloudRagFile | null,
): Promise<void> {
  if (!item.id) return;
  const path = itemPathFromParentReference(item);
  const name = item.name || path.split("/").pop() || "item";
  const ext = extensionFromName(name);
  const deleted = isDeletedItem(item);
  const nextStatus = deleted
    ? "skipped"
    : resolveIndexStatusForItem(item, path);

  let indexStatus = nextStatus;
  if (
    existing &&
    !deleted &&
    nextStatus === "pending" &&
    existing.eTag &&
    item.eTag &&
    existing.eTag === item.eTag &&
    existing.indexStatus === "indexed"
  ) {
    indexStatus = "indexed";
  } else if (
    existing &&
    !deleted &&
    nextStatus === "pending" &&
    existing.indexStatus === "indexed" &&
    existing.eTag !== item.eTag
  ) {
    indexStatus = "pending";
  }

  const id = fileDocId(driveId, item.id);
  const payload: CloudRagFile = {
    id,
    driveId,
    itemId: item.id,
    path,
    name,
    isFolder: isFolder(item),
    size: item.size,
    mimeType: item.file?.mimeType,
    eTag: item.eTag,
    modifiedAt: new Date().toISOString(),
    deleted,
    indexStatus,
    extension: ext || undefined,
    clientHint: clientHintFromPath(path),
    syncSourceId: LIBRARY_SYNC_SOURCE_ID,
    updatedAt: new Date().toISOString(),
  };

  await adminDb()
    .collection(CLOUD_RAG_FILES)
    .doc(id)
    .set(payload, { merge: true });
}

export async function getCloudRagFile(
  fileId: string,
): Promise<CloudRagFile | null> {
  const snap = await adminDb().collection(CLOUD_RAG_FILES).doc(fileId).get();
  if (!snap.exists) return null;
  return snap.data() as CloudRagFile;
}

export async function listPendingFiles(limit: number): Promise<CloudRagFile[]> {
  const snap = await adminDb()
    .collection(CLOUD_RAG_FILES)
    .where("indexStatus", "==", "pending")
    .where("deleted", "==", false)
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as CloudRagFile);
}

export async function updateFileIndexResult(
  fileId: string,
  partial: Pick<
    CloudRagFile,
    "indexStatus" | "indexError" | "rawText" | "contentHash" | "indexedAt"
  >,
): Promise<void> {
  await adminDb()
    .collection(CLOUD_RAG_FILES)
    .doc(fileId)
    .set(
      {
        ...partial,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

export async function deleteChunksForFile(fileId: string): Promise<void> {
  const snap = await adminDb()
    .collection(CLOUD_RAG_CHUNKS)
    .where("fileId", "==", fileId)
    .limit(500)
    .get();
  if (snap.empty) return;
  const batch = adminDb().batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function saveChunks(chunks: CloudRagChunk[]): Promise<void> {
  if (chunks.length === 0) return;
  const batch = adminDb().batch();
  for (const chunk of chunks) {
    batch.set(
      adminDb().collection(CLOUD_RAG_CHUNKS).doc(chunk.id),
      chunk,
      { merge: true },
    );
  }
  await batch.commit();
}

export async function createJob(
  partial: Omit<CloudRagJob, "id" | "startedAt" | "updatedAt"> & {
    id?: string;
  },
): Promise<CloudRagJob> {
  const ref = partial.id
    ? adminDb().collection(CLOUD_RAG_JOBS).doc(partial.id)
    : adminDb().collection(CLOUD_RAG_JOBS).doc();
  const now = new Date().toISOString();
  const job: CloudRagJob = {
    id: ref.id,
    type: partial.type,
    status: partial.status,
    progress: partial.progress,
    errors: partial.errors || [],
    deltaLink: partial.deltaLink,
    driveId: partial.driveId,
    rootItemId: partial.rootItemId,
    rootPath: partial.rootPath,
    startedAt: now,
    updatedAt: now,
    completedAt: partial.completedAt,
  };
  await ref.set(job);
  return job;
}

export async function updateJob(
  jobId: string,
  partial: Partial<CloudRagJob>,
): Promise<void> {
  await adminDb()
    .collection(CLOUD_RAG_JOBS)
    .doc(jobId)
    .set(
      {
        ...partial,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

export async function getJob(jobId: string): Promise<CloudRagJob | null> {
  const snap = await adminDb().collection(CLOUD_RAG_JOBS).doc(jobId).get();
  if (!snap.exists) return null;
  return snap.data() as CloudRagJob;
}

export async function getLibraryState(): Promise<CloudRagLibraryState | null> {
  const snap = await adminDb()
    .collection(CLOUD_RAG_LIBRARY_STATE)
    .doc(LIBRARY_SYNC_SOURCE_ID)
    .get();
  if (!snap.exists) return null;
  return snap.data() as CloudRagLibraryState;
}

export async function upsertLibraryState(
  partial: Partial<CloudRagLibraryState>,
): Promise<CloudRagLibraryState> {
  const ref = adminDb()
    .collection(CLOUD_RAG_LIBRARY_STATE)
    .doc(LIBRARY_SYNC_SOURCE_ID);
  const now = new Date().toISOString();
  await ref.set(
    {
      id: LIBRARY_SYNC_SOURCE_ID,
      updatedAt: now,
      ...partial,
    },
    { merge: true },
  );
  const snap = await ref.get();
  return snap.data() as CloudRagLibraryState;
}

export async function incrementLibraryCatalogVersion(): Promise<number> {
  const ref = adminDb()
    .collection(CLOUD_RAG_LIBRARY_STATE)
    .doc(LIBRARY_SYNC_SOURCE_ID);
  await ref.set(
    {
      catalogVersion: FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
  const snap = await ref.get();
  return Number(snap.data()?.catalogVersion || 0);
}

export async function countFilesByIndexStatus(): Promise<
  Record<string, number>
> {
  const statuses: CloudRagFile["indexStatus"][] = [
    "pending",
    "indexed",
    "skipped",
    "failed",
  ];
  const out: Record<string, number> = {};
  await Promise.all(
    statuses.map(async (status) => {
      const snap = await adminDb()
        .collection(CLOUD_RAG_FILES)
        .where("indexStatus", "==", status)
        .count()
        .get();
      out[status] = snap.data().count;
    }),
  );
  return out;
}

export async function countAllFiles(): Promise<number> {
  const snap = await adminDb().collection(CLOUD_RAG_FILES).count().get();
  return snap.data().count;
}

export async function countChunks(): Promise<number> {
  const snap = await adminDb().collection(CLOUD_RAG_CHUNKS).count().get();
  return snap.data().count;
}
