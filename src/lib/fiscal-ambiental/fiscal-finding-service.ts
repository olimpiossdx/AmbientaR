import { adminDb } from "@/lib/firebase-admin";
import {
  changeTypeToFindingType,
  FINDING_TYPE_LABELS,
  severityFromAreaHa,
} from "./fiscal-finding-labels";
import type {
  CreateFadManualFindingInput,
  FadChangeAnalysis,
  FadChangeAnalysisType,
  FadChangePolygon,
  FadFiscalFinding,
  FadFiscalSeverity,
  UpdateFadFiscalFindingInput,
} from "./types";

const SUB = "fiscal_findings";

function findingsCol(workspaceId: string) {
  return adminDb().collection("fad_workspaces").doc(workspaceId).collection(SUB);
}

function docToFinding(id: string, data: FirebaseFirestore.DocumentData): FadFiscalFinding {
  return { id, ...(data as Omit<FadFiscalFinding, "id">) };
}

export async function listFiscalFindings(workspaceId: string): Promise<FadFiscalFinding[]> {
  const snap = await findingsCol(workspaceId).get();
  return snap.docs
    .map((d) => docToFinding(d.id, d.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFiscalFinding(
  workspaceId: string,
  findingId: string,
): Promise<FadFiscalFinding | null> {
  const snap = await findingsCol(workspaceId).doc(findingId).get();
  if (!snap.exists) return null;
  return docToFinding(snap.id, snap.data()!);
}

async function deleteOpenFindingsForAnalysis(workspaceId: string, analysisId: string) {
  const snap = await findingsCol(workspaceId)
    .where("changeAnalysisId", "==", analysisId)
    .where("status", "==", "open")
    .get();
  const batch = adminDb().batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (!snap.empty) await batch.commit();
}

function groupPolygonsByType(polygons: FadChangePolygon[]) {
  const map = new Map<FadChangeAnalysisType, FadChangePolygon[]>();
  for (const p of polygons) {
    const list = map.get(p.type) ?? [];
    list.push(p);
    map.set(p.type, list);
  }
  return map;
}

export async function syncFindingsFromChangeAnalysis(
  analysis: FadChangeAnalysis,
): Promise<FadFiscalFinding[]> {
  if (analysis.status !== "ready" || !analysis.polygons.length) {
    return [];
  }

  await deleteOpenFindingsForAnalysis(analysis.workspaceId, analysis.id);

  const created: FadFiscalFinding[] = [];
  const grouped = groupPolygonsByType(analysis.polygons);

  for (const [changeType, polys] of grouped) {
    const totalHa = polys.reduce((sum, p) => sum + p.areaHa, 0);
    if (totalHa < 0.01) continue;

    const findingType = changeTypeToFindingType(changeType);
    const severity = severityFromAreaHa(totalHa);
    const avgConfidence = polys.reduce((s, p) => s + p.confidence, 0) / polys.length;
    const largest = [...polys].sort((a, b) => b.areaHa - a.areaHa)[0]!;
    const now = new Date().toISOString();
    const ref = findingsCol(analysis.workspaceId).doc();

    const base: Omit<FadFiscalFinding, "id"> = {
      workspaceId: analysis.workspaceId,
      ownerId: analysis.ownerId,
      type: findingType,
      severity,
      status: "open",
      title: FINDING_TYPE_LABELS[findingType],
      description:
        `Indício visual entre ${analysis.beforeDate} e ${analysis.afterDate}. ` +
        `Área aproximada: ${totalHa.toFixed(2)} ha.`,
      areaHa: totalHa,
      confidence: avgConfidence,
      changeAnalysisId: analysis.id,
      geometry: largest.geometry,
      source: "change_analysis",
      createdAt: now,
      createdBy: analysis.createdBy,
      updatedAt: now,
      updatedBy: analysis.createdBy,
    };

    await ref.set(base);
    created.push({ id: ref.id, ...base });
  }

  return created;
}

export async function createManualFinding(params: {
  workspaceId: string;
  ownerId: string;
  input: CreateFadManualFindingInput;
}): Promise<FadFiscalFinding> {
  const now = new Date().toISOString();
  const ref = findingsCol(params.workspaceId).doc();
  const severity: FadFiscalSeverity = params.input.severity ?? "low";
  const type = params.input.type ?? "manual_observation";

  const finding: Omit<FadFiscalFinding, "id"> = {
    workspaceId: params.workspaceId,
    ownerId: params.ownerId,
    type,
    severity,
    status: "open",
    title: params.input.title.trim(),
    description: params.input.description.trim(),
    source: "manual",
    createdAt: now,
    createdBy: params.ownerId,
    updatedAt: now,
    updatedBy: params.ownerId,
  };

  await ref.set(finding);
  return { id: ref.id, ...finding };
}

export async function updateFiscalFinding(params: {
  workspaceId: string;
  findingId: string;
  userId: string;
  input: UpdateFadFiscalFindingInput;
}): Promise<FadFiscalFinding> {
  const ref = findingsCol(params.workspaceId).doc(params.findingId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw Object.assign(new Error("Achado não encontrado."), { status: 404 });
  }

  const patch: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
    updatedBy: params.userId,
  };

  if (params.input.status) {
    patch.status = params.input.status;
    if (params.input.status === "dismissed" && params.input.dismissedReason) {
      patch.dismissedReason = params.input.dismissedReason.trim();
    }
    if (params.input.status !== "dismissed") {
      patch.dismissedReason = null;
    }
  }

  await ref.update(patch);
  const updated = await ref.get();
  return docToFinding(updated.id, updated.data()!);
}

function analysisFromDoc(id: string, data: FirebaseFirestore.DocumentData): FadChangeAnalysis {
  return { id, ...(data as Omit<FadChangeAnalysis, "id">) };
}

export async function runFiscalChecks(params: {
  workspaceId: string;
  ownerId: string;
}): Promise<{ created: number; findings: FadFiscalFinding[] }> {
  const snap = await adminDb()
    .collection("fad_workspaces")
    .doc(params.workspaceId)
    .collection("change_analyses")
    .get();

  const ready = snap.docs
    .map((d) => analysisFromDoc(d.id, d.data()))
    .filter((a) => a.status === "ready" && a.polygons.length > 0);
  const all: FadFiscalFinding[] = [];
  let created = 0;

  for (const analysis of ready) {
    const batch = await syncFindingsFromChangeAnalysis(analysis);
    created += batch.length;
    all.push(...batch);
  }

  return { created, findings: all };
}

export function summarizeFindings(findings: FadFiscalFinding[]) {
  const open = findings.filter((f) => f.status === "open" || f.status === "under_review");
  return {
    total: findings.length,
    open: open.length,
    bySeverity: {
      low: open.filter((f) => f.severity === "low").length,
      medium: open.filter((f) => f.severity === "medium").length,
      high: open.filter((f) => f.severity === "high").length,
      critical: open.filter((f) => f.severity === "critical").length,
    },
  };
}
