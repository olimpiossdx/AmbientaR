import { adminDb } from "@/lib/firebase-admin";
import { attachSignedUrls, getMosaic } from "./mosaic-service";
import type { CreateFadEvidenceInput, FadEvidenceItem } from "./types";

const SUB = "evidence_items";

function evidenceRef(workspaceId: string, evidenceId?: string) {
  const col = adminDb().collection("fad_workspaces").doc(workspaceId).collection(SUB);
  return evidenceId ? col.doc(evidenceId) : col.doc();
}

function docToEvidence(id: string, data: FirebaseFirestore.DocumentData): FadEvidenceItem {
  return { id, ...(data as Omit<FadEvidenceItem, "id">) };
}

export type FadEvidenceWithUrls = FadEvidenceItem & {
  beforePreviewUrl?: string;
  afterPreviewUrl?: string;
  framePreviewUrls?: string[];
};

export async function listEvidenceItems(workspaceId: string): Promise<FadEvidenceItem[]> {
  const snap = await adminDb()
    .collection("fad_workspaces")
    .doc(workspaceId)
    .collection(SUB)
    .get();

  return snap.docs
    .map((d) => docToEvidence(d.id, d.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getEvidenceItem(
  workspaceId: string,
  evidenceId: string,
): Promise<FadEvidenceItem | null> {
  const snap = await evidenceRef(workspaceId, evidenceId).get();
  if (!snap.exists) return null;
  return docToEvidence(snap.id, snap.data()!);
}

async function resolvePreviewUrls(item: FadEvidenceItem): Promise<FadEvidenceWithUrls> {
  const out: FadEvidenceWithUrls = { ...item };

  if (item.beforeMosaicId) {
    const m = await getMosaic(item.workspaceId, item.beforeMosaicId);
    if (m) out.beforePreviewUrl = (await attachSignedUrls(m)).previewUrl;
  }
  if (item.afterMosaicId) {
    const m = await getMosaic(item.workspaceId, item.afterMosaicId);
    if (m) out.afterPreviewUrl = (await attachSignedUrls(m)).previewUrl;
  }
  if (item.mosaicIds?.length) {
    const urls: string[] = [];
    for (const id of item.mosaicIds) {
      const m = await getMosaic(item.workspaceId, id);
      urls.push(m ? (await attachSignedUrls(m)).previewUrl ?? "" : "");
    }
    out.framePreviewUrls = urls;
  }

  return out;
}

export async function listEvidenceWithUrls(workspaceId: string): Promise<FadEvidenceWithUrls[]> {
  const items = await listEvidenceItems(workspaceId);
  return Promise.all(items.map(resolvePreviewUrls));
}

export async function createEvidenceItem(
  workspaceId: string,
  ownerId: string,
  input: CreateFadEvidenceInput,
): Promise<FadEvidenceWithUrls> {
  const now = new Date().toISOString();
  const ref = evidenceRef(workspaceId);

  let beforeDate: string | undefined;
  let afterDate: string | undefined;

  if (input.kind === "comparison") {
    if (!input.beforeMosaicId || !input.afterMosaicId) {
      throw Object.assign(new Error("beforeMosaicId e afterMosaicId são obrigatórios."), {
        status: 400,
      });
    }
    const before = await getMosaic(workspaceId, input.beforeMosaicId);
    const after = await getMosaic(workspaceId, input.afterMosaicId);
    if (!before || before.status !== "ready" || !after || after.status !== "ready") {
      throw Object.assign(new Error("Mosaics inválidos ou ainda não prontos."), { status: 400 });
    }
    beforeDate = before.requestedDate;
    afterDate = after.requestedDate;
  }

  if (input.kind === "timelapse") {
    if (!input.mosaicIds?.length) {
      throw Object.assign(new Error("mosaicIds é obrigatório para timelapse."), { status: 400 });
    }
  }

  if (input.kind === "change_analysis") {
    if (!input.changeAnalysisId) {
      throw Object.assign(new Error("changeAnalysisId é obrigatório."), { status: 400 });
    }
  }

  const payload: Omit<FadEvidenceItem, "id"> = {
    workspaceId,
    ownerId,
    kind: input.kind,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    beforeMosaicId: input.beforeMosaicId,
    afterMosaicId: input.afterMosaicId,
    mosaicIds: input.mosaicIds,
    changeAnalysisId: input.changeAnalysisId,
    beforeDate,
    afterDate,
    createdAt: now,
    createdBy: ownerId,
    updatedAt: now,
  };

  await ref.set(payload);
  return resolvePreviewUrls({ id: ref.id, ...payload });
}

export async function deleteEvidenceItem(workspaceId: string, evidenceId: string): Promise<boolean> {
  const ref = evidenceRef(workspaceId, evidenceId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}
