import type { GeoJSON } from "geojson";
import * as turf from "@turf/turf";
import { adminDb } from "@/lib/firebase-admin";
import { FAD_WORKSPACES_COLLECTION } from "./firestore-paths";
import type {
  CreateFadWorkspaceInput,
  FadWorkspace,
  UpdateFadWorkspaceInput,
} from "./types";

function docToWorkspace(id: string, data: FirebaseFirestore.DocumentData): FadWorkspace {
  return { id, ...(data as Omit<FadWorkspace, "id">) };
}

function computeBboxAndArea(
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): { bbox: [number, number, number, number]; areaHa: number } {
  const bbox = turf.bbox(aoi) as [number, number, number, number];
  const areaHa = turf.area(aoi) / 10_000;
  return { bbox, areaHa: Math.round(areaHa * 100) / 100 };
}

export async function listFadWorkspacesForOwner(ownerId: string): Promise<FadWorkspace[]> {
  const snap = await adminDb()
    .collection(FAD_WORKSPACES_COLLECTION)
    .where("ownerId", "==", ownerId)
    .get();

  return snap.docs
    .map((d) => docToWorkspace(d.id, d.data()))
    .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
}

export async function getFadWorkspace(workspaceId: string): Promise<FadWorkspace | null> {
  const snap = await adminDb().collection(FAD_WORKSPACES_COLLECTION).doc(workspaceId).get();
  if (!snap.exists) return null;
  return docToWorkspace(snap.id, snap.data()!);
}

export async function createFadWorkspace(
  ownerId: string,
  input: CreateFadWorkspaceInput,
): Promise<FadWorkspace> {
  const now = new Date().toISOString();
  const ref = adminDb().collection(FAD_WORKSPACES_COLLECTION).doc();

  const payload: Record<string, unknown> = {
    name: input.name,
    ownerId,
    status: input.aoi ? "ready" : "draft",
    createdAt: now,
    createdBy: ownerId,
    updatedAt: now,
    updatedBy: ownerId,
  };

  if (input.aoi) {
    const { bbox, areaHa } = computeBboxAndArea(input.aoi);
    payload.aoi = input.aoi;
    payload.bbox = bbox;
    payload.areaHa = areaHa;
  }
  if (input.aoiSource) payload.aoiSource = input.aoiSource;
  if (input.carCode) payload.carCode = input.carCode;

  await ref.set(payload);
  return docToWorkspace(ref.id, payload);
}

export async function updateFadWorkspace(
  workspaceId: string,
  userId: string,
  patch: UpdateFadWorkspaceInput,
): Promise<FadWorkspace | null> {
  const ref = adminDb().collection(FAD_WORKSPACES_COLLECTION).doc(workspaceId);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const update: Record<string, unknown> = {
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedBy: userId,
  };

  if (patch.aoi) {
    const { bbox, areaHa } = computeBboxAndArea(patch.aoi);
    update.bbox = bbox;
    update.areaHa = areaHa;
    if (!patch.status) {
      update.status = "ready";
    }
  }

  await ref.update(update);
  const merged = await ref.get();
  return docToWorkspace(merged.id, merged.data()!);
}

export async function deleteFadWorkspace(workspaceId: string): Promise<boolean> {
  const ref = adminDb().collection(FAD_WORKSPACES_COLLECTION).doc(workspaceId);
  const existing = await ref.get();
  if (!existing.exists) return false;
  await ref.delete();
  return true;
}

export async function assertFadWorkspaceAccess(
  workspace: FadWorkspace,
  uid: string,
  isAdmin: boolean,
): Promise<boolean> {
  return isAdmin || workspace.ownerId === uid;
}

/** Índice composto — criar no console se necessário: ownerId + updatedAt desc */
export const FAD_WORKSPACE_LIST_INDEX_NOTE =
  "fad_workspaces: ownerId ASC, updatedAt DESC";
