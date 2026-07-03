import type { GeoJSON } from "geojson";
import { adminDb } from "@/lib/firebase-admin";
import { FAD_ANALYSIS_DISCLAIMER } from "./intelligence-labels";
import { callFiscalIntelligenceWorkerDetect } from "./intelligence-worker-client";
import { runInlineChangeDetection } from "./inline-change-detection";
import { attachSignedUrls, getMosaic } from "./mosaic-service";
import { fadAnalysisStoragePrefix } from "./storage-paths";
import { syncFindingsFromChangeAnalysis } from "./fiscal-finding-service";
import { recordChangeAnalysisEvent } from "./timeline-service";
import type {
  FadChangeAnalysis,
  FadChangeAnalysisType,
  FadChangePolygon,
  FadWorkspace,
} from "./types";

const SUB = "change_analyses";

function analysisRef(workspaceId: string, analysisId?: string) {
  const col = adminDb().collection("fad_workspaces").doc(workspaceId).collection(SUB);
  return analysisId ? col.doc(analysisId) : col.doc();
}

function docToAnalysis(id: string, data: FirebaseFirestore.DocumentData): FadChangeAnalysis {
  return { id, ...(data as Omit<FadChangeAnalysis, "id">) };
}

function mapWorkerPolygons(
  raw: Array<{ type: string; geometry: GeoJSON.Polygon; area_ha: number; confidence: number }>,
): FadChangePolygon[] {
  const allowed: FadChangeAnalysisType[] = [
    "vegetation_loss",
    "vegetation_gain",
    "bare_soil_exposure",
  ];
  return raw
    .filter((p) => allowed.includes(p.type as FadChangeAnalysisType))
    .map((p) => ({
      type: p.type as FadChangeAnalysisType,
      geometry: p.geometry,
      areaHa: p.area_ha,
      confidence: p.confidence,
    }));
}

export async function listChangeAnalyses(workspaceId: string): Promise<FadChangeAnalysis[]> {
  const snap = await adminDb()
    .collection("fad_workspaces")
    .doc(workspaceId)
    .collection(SUB)
    .get();

  return snap.docs
    .map((d) => docToAnalysis(d.id, d.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getChangeAnalysis(
  workspaceId: string,
  analysisId: string,
): Promise<FadChangeAnalysis | null> {
  const snap = await analysisRef(workspaceId, analysisId).get();
  if (!snap.exists) return null;
  const analysis = docToAnalysis(snap.id, snap.data()!);
  if (analysis.storage?.previewPath) {
    const withUrls = await attachAnalysisUrls(analysis);
    return withUrls;
  }
  return analysis;
}

export async function attachAnalysisUrls(analysis: FadChangeAnalysis): Promise<FadChangeAnalysis> {
  if (!analysis.storage?.previewPath) return analysis;
  const mosaicStub = {
    id: analysis.id,
    workspaceId: analysis.workspaceId,
    ownerId: analysis.ownerId,
    status: "ready" as const,
    requestedDate: analysis.afterDate,
    year: Number(analysis.afterDate.slice(0, 4)),
    attribution: "CBERS/INPE" as const,
    createdAt: analysis.createdAt,
    createdBy: analysis.createdBy,
    storage: { previewPath: analysis.storage.previewPath },
  };
  const withUrl = await attachSignedUrls(mosaicStub);
  return { ...analysis, previewUrl: withUrl.previewUrl };
}

export async function runChangeDetection(params: {
  workspace: FadWorkspace;
  ownerId: string;
  beforeMosaicId: string;
  afterMosaicId: string;
}): Promise<FadChangeAnalysis> {
  const { workspace, ownerId, beforeMosaicId, afterMosaicId } = params;

  if (beforeMosaicId === afterMosaicId) {
    throw Object.assign(new Error("Escolha duas imagens diferentes."), { status: 400 });
  }

  const [before, after] = await Promise.all([
    getMosaic(workspace.id, beforeMosaicId),
    getMosaic(workspace.id, afterMosaicId),
  ]);

  if (!before?.storage?.previewPath || before.status !== "ready") {
    throw Object.assign(new Error("Imagem «antes» indisponível."), { status: 404 });
  }
  if (!after?.storage?.previewPath || after.status !== "ready") {
    throw Object.assign(new Error("Imagem «depois» indisponível."), { status: 404 });
  }

  const bbox = workspace.bbox;
  if (!bbox || !workspace.aoi) {
    throw Object.assign(new Error("AOI e bbox do imóvel são necessários."), { status: 400 });
  }

  const now = new Date().toISOString();
  const ref = analysisRef(workspace.id);
  const base: Omit<FadChangeAnalysis, "id"> = {
    workspaceId: workspace.id,
    ownerId,
    status: "processing",
    beforeMosaicId,
    afterMosaicId,
    beforeDate: before.requestedDate,
    afterDate: after.requestedDate,
    summary: { lossHa: 0, gainHa: 0, bareHa: 0, totalChangedHa: 0 },
    polygons: [],
    confidence: 0,
    disclaimer: FAD_ANALYSIS_DISCLAIMER,
    mode: "inline",
    createdAt: now,
    createdBy: ownerId,
    updatedAt: now,
  };

  await ref.set(base);

  try {
    let polygons: FadChangePolygon[] = [];
    let summary = base.summary;
    let confidence = 0.4;
    let mode: "worker" | "inline" = "inline";
    let storage: FadChangeAnalysis["storage"];

    const workerResult = await callFiscalIntelligenceWorkerDetect({
      workspaceId: workspace.id,
      analysisId: ref.id,
      aoi: workspace.aoi,
      bbox,
      beforePreviewPath: before.storage.previewPath,
      afterPreviewPath: after.storage.previewPath,
    });

    if (workerResult) {
      mode = "worker";
      polygons = mapWorkerPolygons(workerResult.polygons);
      summary = {
        lossHa: workerResult.summary.loss_ha,
        gainHa: workerResult.summary.gain_ha,
        bareHa: workerResult.summary.bare_ha,
        totalChangedHa: workerResult.summary.total_changed_ha,
      };
      confidence = workerResult.confidence;
      storage = {
        previewPath: workerResult.preview_path,
        maskPath: workerResult.mask_path,
      };
    } else {
      const [beforeUrls, afterUrls] = await Promise.all([
        attachSignedUrls(before),
        attachSignedUrls(after),
      ]);
      if (!beforeUrls.previewUrl || !afterUrls.previewUrl) {
        throw new Error("URLs de preview indisponíveis.");
      }
      const inline = await runInlineChangeDetection({
        beforeUrl: beforeUrls.previewUrl,
        afterUrl: afterUrls.previewUrl,
        aoi: workspace.aoi,
        bbox,
      });
      polygons = inline.polygons;
      summary = inline.summary;
      confidence = inline.confidence;
    }

    const completed: Omit<FadChangeAnalysis, "id"> = {
      ...base,
      status: "ready",
      polygons,
      summary,
      confidence,
      mode,
      storage,
      updatedAt: new Date().toISOString(),
    };

    await ref.update(completed as Record<string, unknown>);
    const saved = docToAnalysis(ref.id, completed);
    await recordChangeAnalysisEvent(saved).catch(() => undefined);
    await syncFindingsFromChangeAnalysis(saved).catch(() => undefined);
    return attachAnalysisUrls(saved);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha na análise.";
    await ref.update({
      status: "failed",
      errorMessage: msg,
      updatedAt: new Date().toISOString(),
    });
    throw e;
  }
}

export function analysisStoragePaths(workspaceId: string, analysisId: string) {
  const base = fadAnalysisStoragePrefix(workspaceId, analysisId);
  return {
    previewPath: `${base}/change_preview.webp`,
    maskPath: `${base}/change_mask.png`,
  };
}
