import {
  fetchDeltaPage,
  getDriveItemByPath,
  resolveDefaultDriveId,
} from "@/lib/onedrive/graph";
import {
  DEFAULT_PROJECTS_SYNC_SOURCE_ID,
  getActiveFolderLinkByClientId,
  getSyncSource,
  incrementCatalogVersion,
  itemPathFromParentReference,
  namespaceForSyncSource,
  upsertCatalogEntry,
  upsertSyncSource,
} from "@/lib/onedrive/catalog-store";
import type { GraphDriveItem } from "@/lib/onedrive/types";
import { normalizeOnedriveFolderPath } from "@/lib/onedrive/path-utils";

const MAX_DELTA_PAGES = 50;

export type SyncFolderResult = {
  syncSourceId: string;
  clientId?: string;
  itemsProcessed: number;
  pages: number;
  catalogVersion: number;
};

function isDeletedItem(item: GraphDriveItem): boolean {
  return Boolean(item.deleted);
}

function isFolder(item: GraphDriveItem): boolean {
  return Boolean(item.folder);
}

async function applyDeltaItems(
  syncSourceId: string,
  driveId: string,
  clientId: string | undefined,
  namespace: ReturnType<typeof namespaceForSyncSource>,
  items: GraphDriveItem[],
): Promise<number> {
  let count = 0;
  for (const item of items) {
    if (!item.id) continue;
    const path = itemPathFromParentReference(item);
    await upsertCatalogEntry({
      syncSourceId,
      clientId,
      itemId: item.id,
      parentItemId: item.parentReference?.id,
      path,
      name: item.name || path.split("/").pop() || "item",
      isFolder: isFolder(item),
      size: item.size,
      mimeType: item.file?.mimeType,
      modifiedAt: new Date().toISOString(),
      deleted: isDeletedItem(item),
      eTag: item.eTag,
      namespace,
      indexStatus: isFolder(item) ? "skipped" : "pending",
    });
    count += 1;
  }
  return count;
}

async function runDeltaLoop(
  syncSourceId: string,
  driveId: string,
  folderItemId: string,
  clientId: string | undefined,
  startDeltaLink: string | undefined,
  namespace: ReturnType<typeof namespaceForSyncSource>,
): Promise<{ itemsProcessed: number; pages: number; deltaLink?: string }> {
  let deltaLink: string | undefined = startDeltaLink;
  let pages = 0;
  let itemsProcessed = 0;
  let nextUrl: string | undefined;

  do {
    const page = await fetchDeltaPage(
      driveId,
      folderItemId,
      nextUrl || deltaLink,
    );
    pages += 1;
    const batch = page.value || [];
    itemsProcessed += await applyDeltaItems(
      syncSourceId,
      driveId,
      clientId,
      namespace,
      batch,
    );

    nextUrl = page["@odata.nextLink"];
    if (page["@odata.deltaLink"]) {
      deltaLink = page["@odata.deltaLink"];
    }

    if (pages >= MAX_DELTA_PAGES) break;
  } while (nextUrl);

  return { itemsProcessed, pages, deltaLink };
}

/** Garante documento `onedrive_sync_sources/projects` com driveId resolvido. */
export async function ensureProjectsSyncSource(): Promise<{
  source: Awaited<ReturnType<typeof getSyncSource>>;
  created: boolean;
}> {
  const id = DEFAULT_PROJECTS_SYNC_SOURCE_ID;
  let source = await getSyncSource(id);
  if (source?.driveId) {
    return { source, created: false };
  }

  const { driveId, driveName } = await resolveDefaultDriveId();
  source = await upsertSyncSource({
    id,
    kind: "projects",
    provider: "microsoft_graph",
    driveId,
    driveName,
    lastSyncStatus: "idle",
  });
  return { source, created: true };
}

/** Vincula pasta por caminho e grava `client_folder_links`. */
export async function linkClientFolder(params: {
  clientId: string;
  folderPath: string;
  syncSourceId?: string;
}): Promise<{
  link: import("@/lib/onedrive/types").ClientFolderLink;
  folderItem: GraphDriveItem;
  folderPath: string;
}> {
  const { source } = await ensureProjectsSyncSource();
  if (!source?.driveId) {
    throw new Error("Fonte de sync sem driveId.");
  }

  const folderPath = normalizeOnedriveFolderPath(params.folderPath);
  const folderItem = await getDriveItemByPath(source.driveId, folderPath);
  if (!folderItem.id || !isFolder(folderItem)) {
    throw new Error(
      `Caminho não é uma pasta no OneDrive: ${folderPath}`,
    );
  }

  const { upsertFolderLink } = await import("@/lib/onedrive/catalog-store");
  const link = await upsertFolderLink({
    clientId: params.clientId,
    syncSourceId: source.id,
    oneDriveItemId: folderItem.id,
    oneDrivePath: folderPath,
    linkMethod: "admin_manual",
    status: "active",
    portalAccess: "readonly",
    syncEnabled: true,
    billingStatus: "none",
  });

  return { link, folderItem, folderPath };
}

/** Executa delta sync da pasta vinculada ao cliente. */
export async function syncClientFolder(
  clientId: string,
): Promise<SyncFolderResult> {
  const link = await getActiveFolderLinkByClientId(clientId);
  if (!link) {
    throw new Error("Cliente sem pasta OneDrive vinculada (status active).");
  }

  const source = await getSyncSource(link.syncSourceId);
  if (!source?.driveId) {
    throw new Error("Fonte de sync não configurada.");
  }

  const namespace = namespaceForSyncSource(source.kind);

  await upsertSyncSource({
    id: source.id,
    lastSyncStatus: "running",
    lastSyncError: "",
  });

  try {
    const { itemsProcessed, pages, deltaLink } = await runDeltaLoop(
      source.id,
      source.driveId,
      link.oneDriveItemId,
      clientId,
      link.syncEnabled ? link.lastDeltaLink : undefined,
      namespace,
    );

    const now = new Date().toISOString();
    const { upsertFolderLink } = await import("@/lib/onedrive/catalog-store");
    await upsertFolderLink({
      ...link,
      lastDeltaLink: deltaLink,
      lastSyncAt: now,
    });

    await upsertSyncSource({
      id: source.id,
      lastSyncAt: now,
      lastSyncStatus: "ok",
      lastSyncError: "",
    });

    const catalogVersion = await incrementCatalogVersion(source.id);

    return {
      syncSourceId: source.id,
      clientId,
      itemsProcessed,
      pages,
      catalogVersion,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await upsertSyncSource({
      id: source.id,
      lastSyncStatus: "error",
      lastSyncError: message,
    });
    throw err;
  }
}
