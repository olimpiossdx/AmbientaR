import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { firebaseConfig } from "@/firebase/config";
import { fadArchiveStoragePrefix } from "./storage-paths";
import type { FadMosaic, FadMosaicWithUrls } from "./types";

const MOSAICS_SUB = "mosaics";

function mosaicRef(workspaceId: string, mosaicId: string) {
  return adminDb()
    .collection("fad_workspaces")
    .doc(workspaceId)
    .collection(MOSAICS_SUB)
    .doc(mosaicId);
}

function docToMosaic(id: string, data: FirebaseFirestore.DocumentData): FadMosaic {
  return { id, ...(data as Omit<FadMosaic, "id">) };
}

export async function findCachedMosaic(
  workspaceId: string,
  requestedDate: string,
): Promise<FadMosaic | null> {
  const snap = await adminDb()
    .collection("fad_workspaces")
    .doc(workspaceId)
    .collection(MOSAICS_SUB)
    .where("requestedDate", "==", requestedDate)
    .where("status", "==", "ready")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const d = snap.docs[0]!;
  return docToMosaic(d.id, d.data());
}

export async function listMosaicsForWorkspace(workspaceId: string): Promise<FadMosaic[]> {
  const snap = await adminDb()
    .collection("fad_workspaces")
    .doc(workspaceId)
    .collection(MOSAICS_SUB)
    .get();

  return snap.docs
    .map((d) => docToMosaic(d.id, d.data()))
    .sort((a, b) => b.requestedDate.localeCompare(a.requestedDate));
}

export async function getMosaic(
  workspaceId: string,
  mosaicId: string,
): Promise<FadMosaic | null> {
  const snap = await mosaicRef(workspaceId, mosaicId).get();
  if (!snap.exists) return null;
  return docToMosaic(snap.id, snap.data()!);
}

export async function createMosaicProcessing(params: {
  workspaceId: string;
  ownerId: string;
  requestedDate: string;
}): Promise<FadMosaic> {
  const now = new Date().toISOString();
  const ref = adminDb()
    .collection("fad_workspaces")
    .doc(params.workspaceId)
    .collection(MOSAICS_SUB)
    .doc();

  const payload: Omit<FadMosaic, "id"> = {
    workspaceId: params.workspaceId,
    ownerId: params.ownerId,
    status: "processing",
    requestedDate: params.requestedDate,
    year: Number(params.requestedDate.slice(0, 4)),
    attribution: "CBERS/INPE",
    createdAt: now,
    createdBy: params.ownerId,
    updatedAt: now,
  };

  await ref.set(payload);
  return { id: ref.id, ...payload };
}

export async function completeMosaic(
  workspaceId: string,
  mosaicId: string,
  patch: Partial<FadMosaic>,
): Promise<FadMosaic> {
  const ref = mosaicRef(workspaceId, mosaicId);
  await ref.update({
    ...patch,
    updatedAt: new Date().toISOString(),
  });
  const snap = await ref.get();
  return docToMosaic(snap.id, snap.data()!);
}

export async function failMosaic(
  workspaceId: string,
  mosaicId: string,
  errorMessage: string,
): Promise<void> {
  await mosaicRef(workspaceId, mosaicId).update({
    status: "failed",
    errorMessage,
    updatedAt: new Date().toISOString(),
  });
}

export async function bumpWorkspaceArchiveSummary(workspaceId: string): Promise<void> {
  const mosaics = await listMosaicsForWorkspace(workspaceId);
  const ready = mosaics.filter((m) => m.status === "ready");
  const years = ready.map((m) => m.year);
  await adminDb()
    .collection("fad_workspaces")
    .doc(workspaceId)
    .update({
      archiveSummary: {
        mosaicCount: ready.length,
        yearMin: years.length ? Math.min(...years) : undefined,
        yearMax: years.length ? Math.max(...years) : undefined,
        lastBuiltAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
}

async function signedUrlForPath(storagePath: string): Promise<string | undefined> {
  const bucketName = firebaseConfig.storageBucket;
  if (!bucketName) return undefined;
  const [url] = await adminStorage()
    .bucket(bucketName)
    .file(storagePath)
    .getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });
  return url;
}

export async function attachSignedUrls(mosaic: FadMosaic): Promise<FadMosaicWithUrls> {
  const previewUrl = mosaic.storage?.previewPath
    ? await signedUrlForPath(mosaic.storage.previewPath)
    : undefined;
  const geotiffUrl = mosaic.storage?.geotiffPath
    ? await signedUrlForPath(mosaic.storage.geotiffPath)
    : undefined;
  return { ...mosaic, previewUrl, geotiffUrl };
}

export function mosaicStoragePaths(workspaceId: string, mosaicId: string) {
  const base = fadArchiveStoragePrefix(workspaceId, mosaicId);
  return {
    previewPath: `${base}/preview.webp`,
    geotiffPath: `${base}/mosaic_rgb.tif`,
    manifestPath: `${base}/manifest.json`,
  };
}

export async function uploadBufferToStorage(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<number> {
  const bucketName = firebaseConfig.storageBucket!;
  const file = adminStorage().bucket(bucketName).file(storagePath);
  await file.save(buffer, { resumable: false, contentType });
  return buffer.length;
}
