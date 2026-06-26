import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import type {
  ClientFolderLink,
  OnedriveCatalogEntry,
  OnedriveCatalogNamespace,
  OnedriveSyncSource,
} from "@/lib/onedrive/types";

export const ONEDRIVE_SYNC_SOURCES = "onedrive_sync_sources";
export const CLIENT_FOLDER_LINKS = "client_folder_links";
export const ONEDRIVE_CATALOG_ENTRIES = "onedrive_catalog_entries";

export const DEFAULT_PROJECTS_SYNC_SOURCE_ID = "projects";

export async function getSyncSource(
  id = DEFAULT_PROJECTS_SYNC_SOURCE_ID,
): Promise<OnedriveSyncSource | null> {
  const snap = await adminDb().collection(ONEDRIVE_SYNC_SOURCES).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<OnedriveSyncSource, "id">) };
}

export async function upsertSyncSource(
  partial: Partial<OnedriveSyncSource> & { id: string },
): Promise<OnedriveSyncSource> {
  const ref = adminDb().collection(ONEDRIVE_SYNC_SOURCES).doc(partial.id);
  const now = new Date().toISOString();
  await ref.set(
    {
      kind: "projects",
      provider: "microsoft_graph",
      updatedAt: now,
      ...partial,
    },
    { merge: true },
  );
  const snap = await ref.get();
  return { id: snap.id, ...(snap.data() as Omit<OnedriveSyncSource, "id">) };
}

export async function listActiveFolderLinks(
  limit = 100,
): Promise<ClientFolderLink[]> {
  const snap = await adminDb()
    .collection(CLIENT_FOLDER_LINKS)
    .where("status", "==", "active")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ClientFolderLink, "id">),
  }));
}

export async function getActiveFolderLinkByClientId(
  clientId: string,
): Promise<ClientFolderLink | null> {
  const snap = await adminDb()
    .collection(CLIENT_FOLDER_LINKS)
    .where("clientId", "==", clientId)
    .where("status", "==", "active")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<ClientFolderLink, "id">) };
}

export async function upsertFolderLink(
  data: Omit<ClientFolderLink, "id"> & { id?: string },
): Promise<ClientFolderLink> {
  const ref = data.id
    ? adminDb().collection(CLIENT_FOLDER_LINKS).doc(data.id)
    : adminDb().collection(CLIENT_FOLDER_LINKS).doc();
  const now = new Date().toISOString();
  const payload = {
    ...data,
    updatedAt: now,
    createdAt: data.createdAt || now,
  };
  await ref.set(payload, { merge: true });
  const snap = await ref.get();
  return { id: snap.id, ...(snap.data() as Omit<ClientFolderLink, "id">) };
}

function catalogDocId(syncSourceId: string, itemId: string) {
  return `${syncSourceId}_${itemId}`;
}

export async function upsertCatalogEntry(
  entry: Omit<OnedriveCatalogEntry, "id"> & {
    syncSourceId: string;
    itemId: string;
  },
): Promise<void> {
  const id = catalogDocId(entry.syncSourceId, entry.itemId);
  await adminDb()
    .collection(ONEDRIVE_CATALOG_ENTRIES)
    .doc(id)
    .set(
      {
        ...entry,
        id,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

export async function listCatalogForClient(
  clientId: string,
  options?: { includeDeleted?: boolean; limit?: number },
): Promise<OnedriveCatalogEntry[]> {
  const snap = await adminDb()
    .collection(ONEDRIVE_CATALOG_ENTRIES)
    .where("clientId", "==", clientId)
    .limit(options?.limit ?? 500)
    .get();
  return snap.docs
    .map((d) => d.data() as OnedriveCatalogEntry)
    .filter((e) => options?.includeDeleted || !e.deleted);
}

export async function incrementCatalogVersion(syncSourceId: string): Promise<number> {
  const ref = adminDb().collection(ONEDRIVE_SYNC_SOURCES).doc(syncSourceId);
  await ref.update({
    catalogVersion: FieldValue.increment(1),
    updatedAt: new Date().toISOString(),
  });
  const snap = await ref.get();
  return Number(snap.data()?.catalogVersion || 0);
}

export function itemPathFromParentReference(item: {
  name: string;
  parentReference?: { path?: string };
}): string {
  const parentPath = item.parentReference?.path || "";
  const marker = "/root:";
  const idx = parentPath.indexOf(marker);
  const base =
    idx >= 0
      ? parentPath.slice(idx + marker.length).replace(/\/$/, "")
      : "";
  return base ? `${base}/${item.name}` : item.name;
}

export function namespaceForSyncSource(
  kind: OnedriveSyncSource["kind"],
): OnedriveCatalogNamespace {
  return kind === "financial" ? "financial" : "client_portal";
}
