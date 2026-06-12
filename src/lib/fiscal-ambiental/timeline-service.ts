import { adminDb } from "@/lib/firebase-admin";
import { listMosaicsForWorkspace } from "./mosaic-service";
import type {
  CreateFadTimelineEventInput,
  FadChangeAnalysis,
  FadMosaic,
  FadTimelineEvent,
  UpdateFadTimelineEventInput,
} from "./types";

const SUB = "environmental_timeline";

function timelineRef(workspaceId: string, eventId?: string) {
  const col = adminDb().collection("fad_workspaces").doc(workspaceId).collection(SUB);
  return eventId ? col.doc(eventId) : col.doc();
}

function docToEvent(id: string, data: FirebaseFirestore.DocumentData): FadTimelineEvent {
  return { id, ...(data as Omit<FadTimelineEvent, "id">) };
}

function mosaicToSyntheticEvent(mosaic: FadMosaic): FadTimelineEvent {
  const date = mosaic.sceneDate?.slice(0, 10) ?? mosaic.requestedDate;
  return {
    id: `mosaic_${mosaic.id}`,
    workspaceId: mosaic.workspaceId,
    ownerId: mosaic.ownerId,
    kind: "satellite_mosaic_created",
    title: `Imagem satélite · ${date}`,
    body: mosaic.resolutionM ? `Resolução ~${mosaic.resolutionM} m · ${mosaic.attribution}` : mosaic.attribution,
    occurredAt: `${date}T12:00:00.000Z`,
    mosaicId: mosaic.id,
    createdAt: mosaic.createdAt,
    createdBy: mosaic.createdBy,
  };
}

export async function listTimelineEvents(workspaceId: string): Promise<FadTimelineEvent[]> {
  const snap = await adminDb()
    .collection("fad_workspaces")
    .doc(workspaceId)
    .collection(SUB)
    .get();

  return snap.docs
    .map((d) => docToEvent(d.id, d.data()))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export async function listUnifiedTimeline(workspaceId: string): Promise<FadTimelineEvent[]> {
  const [events, mosaics] = await Promise.all([
    listTimelineEvents(workspaceId),
    listMosaicsForWorkspace(workspaceId),
  ]);

  const mosaicIdsWithEvent = new Set(
    events.filter((e) => e.mosaicId).map((e) => e.mosaicId!),
  );

  const synthetic = mosaics
    .filter((m) => m.status === "ready" && !mosaicIdsWithEvent.has(m.id))
    .map(mosaicToSyntheticEvent);

  return [...events, ...synthetic].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export async function getTimelineEvent(
  workspaceId: string,
  eventId: string,
): Promise<FadTimelineEvent | null> {
  const snap = await timelineRef(workspaceId, eventId).get();
  if (!snap.exists) return null;
  return docToEvent(snap.id, snap.data()!);
}

export async function createTimelineEvent(
  workspaceId: string,
  ownerId: string,
  input: CreateFadTimelineEventInput,
): Promise<FadTimelineEvent> {
  const now = new Date().toISOString();
  const ref = timelineRef(workspaceId);
  const occurredAt = input.occurredAt ?? now;

  const payload: Omit<FadTimelineEvent, "id"> = {
    workspaceId,
    ownerId,
    kind: input.kind,
    title: input.title.trim(),
    body: input.body?.trim() || undefined,
    occurredAt,
    createdAt: now,
    createdBy: ownerId,
    updatedAt: now,
  };

  await ref.set(payload);
  return { id: ref.id, ...payload };
}

export async function updateTimelineEvent(
  workspaceId: string,
  eventId: string,
  patch: UpdateFadTimelineEventInput,
): Promise<FadTimelineEvent | null> {
  const ref = timelineRef(workspaceId, eventId);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const data = existing.data() as FadTimelineEvent;
  if (data.kind !== "manual_note") {
    throw Object.assign(new Error("Só notas manuais podem ser editadas."), { status: 400 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.body !== undefined) update.body = patch.body.trim() || null;
  if (patch.occurredAt !== undefined) update.occurredAt = patch.occurredAt;

  await ref.update(update);
  const snap = await ref.get();
  return docToEvent(snap.id, snap.data()!);
}

export async function deleteTimelineEvent(workspaceId: string, eventId: string): Promise<boolean> {
  const ref = timelineRef(workspaceId, eventId);
  const existing = await ref.get();
  if (!existing.exists) return false;

  const data = existing.data() as FadTimelineEvent;
  if (data.kind !== "manual_note") {
    throw Object.assign(new Error("Só notas manuais podem ser removidas."), { status: 400 });
  }

  await ref.delete();
  return true;
}

export async function recordFiscalCheckEvent(
  workspaceId: string,
  ownerId: string,
  findingCount: number,
): Promise<void> {
  const ref = timelineRef(workspaceId);
  const now = new Date().toISOString();

  const payload: Omit<FadTimelineEvent, "id"> = {
    workspaceId,
    ownerId,
    kind: "fiscal_check_completed",
    title: `Verificação preventiva · ${findingCount} achado(s)`,
    body: "Achados gerados a partir de análises de mudanças (caráter auxiliar).",
    occurredAt: now,
    createdAt: now,
    createdBy: ownerId,
    updatedAt: now,
  };

  await ref.set(payload);
}

export async function recordChangeAnalysisEvent(analysis: FadChangeAnalysis): Promise<void> {
  const ref = timelineRef(analysis.workspaceId);
  const now = new Date().toISOString();
  const changed = analysis.summary.totalChangedHa;

  const payload: Omit<FadTimelineEvent, "id"> = {
    workspaceId: analysis.workspaceId,
    ownerId: analysis.ownerId,
    kind: "change_analysis_completed",
    title: `Análise de mudanças · ${analysis.beforeDate} → ${analysis.afterDate}`,
    body:
      changed > 0
        ? `Área com indícios de alteração: ~${changed} ha (análise auxiliar).`
        : "Nenhuma alteração significativa detectada nas previews.",
    occurredAt: now,
    createdAt: now,
    createdBy: analysis.createdBy,
    updatedAt: now,
  };

  await ref.set(payload);
}

export async function recordMosaicCreatedEvent(mosaic: FadMosaic): Promise<void> {
  const snap = await adminDb()
    .collection("fad_workspaces")
    .doc(mosaic.workspaceId)
    .collection(SUB)
    .where("mosaicId", "==", mosaic.id)
    .limit(1)
    .get();

  if (!snap.empty) return;

  const ref = timelineRef(mosaic.workspaceId);
  const date = mosaic.sceneDate?.slice(0, 10) ?? mosaic.requestedDate;
  const now = new Date().toISOString();

  const payload: Omit<FadTimelineEvent, "id"> = {
    workspaceId: mosaic.workspaceId,
    ownerId: mosaic.ownerId,
    kind: "satellite_mosaic_created",
    title: `Imagem satélite · ${date}`,
    body: mosaic.resolutionM
      ? `Resolução ~${mosaic.resolutionM} m · ${mosaic.attribution}`
      : mosaic.attribution,
    occurredAt: mosaic.sceneDate ?? `${date}T12:00:00.000Z`,
    mosaicId: mosaic.id,
    createdAt: now,
    createdBy: mosaic.createdBy,
    updatedAt: now,
  };

  await ref.set(payload);
}
