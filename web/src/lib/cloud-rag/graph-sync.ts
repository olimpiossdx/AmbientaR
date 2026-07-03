import {
  fetchDeltaPageForMode,
  getDriveItemByPathForMode,
  getGraphAuthMode,
  resolveDefaultDriveIdForMode,
} from "@/lib/onedrive/graph";
import {
  getLibraryRootPath,
  getMaxFilesPerSyncPages,
} from "@/lib/cloud-rag/config";
import { normalizeLibraryPath, fileDocId } from "@/lib/cloud-rag/path-utils";
import {
  createJob,
  getCloudRagFile,
  getJob,
  incrementLibraryCatalogVersion,
  updateJob,
  upsertCloudRagFileFromGraphItem,
  upsertLibraryState,
  getLibraryState,
} from "@/lib/cloud-rag/store";
import type { GraphDriveItem } from "@/lib/onedrive/types";

export type SyncLibraryResult = {
  jobId: string;
  itemsProcessed: number;
  pages: number;
  completed: boolean;
  deltaLink?: string;
  catalogVersion: number;
};

async function processDeltaBatch(
  driveId: string,
  items: GraphDriveItem[],
): Promise<number> {
  let count = 0;
  for (const item of items) {
    if (!item.id) continue;
    const existing = await getCloudRagFile(fileDocId(driveId, item.id));
    await upsertCloudRagFileFromGraphItem(driveId, item, existing);
    count += 1;
  }
  return count;
}

export async function syncLibrary(options?: {
  jobId?: string;
  maxPages?: number;
  continueDelta?: boolean;
}): Promise<SyncLibraryResult> {
  const authMode = getGraphAuthMode();
  const rootPath = normalizeLibraryPath(getLibraryRootPath());
  const { driveId, driveName } = await resolveDefaultDriveIdForMode(authMode);
  const rootItem = await getDriveItemByPathForMode(authMode, driveId, rootPath);
  if (!rootItem.id) {
    throw new Error(`Pasta raiz da biblioteca não encontrada: ${rootPath}`);
  }

  const libraryState = await getLibraryState();
  let job = options?.jobId ? await getJob(options.jobId) : null;

  if (options?.jobId && !job) {
    throw new Error("Job de sync não encontrado.");
  }

  if (!job) {
    job = await createJob({
      type: "sync",
      status: "running",
      progress: { processed: 0, pages: 0 },
      errors: [],
      driveId,
      rootItemId: rootItem.id,
      rootPath,
    });
  } else {
    await updateJob(job.id, { status: "running" });
  }

  const maxPages = options?.maxPages ?? getMaxFilesPerSyncPages();
  let deltaLink =
    options?.continueDelta && job.deltaLink
      ? job.deltaLink
      : options?.continueDelta
        ? libraryState?.lastDeltaLink
        : undefined;
  let nextUrl =
    options?.continueDelta && job.nextUrl ? job.nextUrl : undefined;
  let pages = 0;
  let itemsProcessed = job.progress?.processed || 0;

  try {
    do {
      const page = await fetchDeltaPageForMode(
        authMode,
        driveId,
        rootItem.id,
        nextUrl || deltaLink,
      );
      pages += 1;
      const batch = page.value || [];
      itemsProcessed += await processDeltaBatch(driveId, batch);

      nextUrl = page["@odata.nextLink"];
      if (page["@odata.deltaLink"]) {
        deltaLink = page["@odata.deltaLink"];
      }

      await updateJob(job.id, {
        progress: { processed: itemsProcessed, pages },
        deltaLink,
        nextUrl: nextUrl || "",
      });

      if (pages >= maxPages) break;
    } while (nextUrl);

    const completed = !nextUrl;
    const catalogVersion = await incrementLibraryCatalogVersion();

    if (completed && deltaLink) {
      await upsertLibraryState({
        driveId,
        driveName,
        rootItemId: rootItem.id,
        rootPath,
        lastDeltaLink: deltaLink,
        lastSyncAt: new Date().toISOString(),
        catalogVersion,
      });
    } else {
      await upsertLibraryState({
        driveId,
        driveName,
        rootItemId: rootItem.id,
        rootPath,
        catalogVersion,
      });
    }

    await updateJob(job.id, {
      status: completed ? "completed" : "running",
      progress: { processed: itemsProcessed, pages },
      deltaLink,
      nextUrl: completed ? "" : nextUrl,
      completedAt: completed ? new Date().toISOString() : undefined,
    });

    return {
      jobId: job.id,
      itemsProcessed,
      pages,
      completed,
      deltaLink,
      catalogVersion,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateJob(job.id, {
      status: "failed",
      errors: [...(job.errors || []), message],
      completedAt: new Date().toISOString(),
    });
    throw err;
  }
}
