import { adminDb } from "@/lib/firebase-admin";
import { firebaseConfig } from "@/firebase/config";
import { adminStorage } from "@/lib/firebase-admin";
import { listChangeAnalyses } from "./change-analysis-service";
import { buildFadReportPdf } from "./fad-report-pdf";
import { listFiscalFindings } from "./fiscal-finding-service";
import { listMosaicsForWorkspace, uploadBufferToStorage } from "./mosaic-service";
import { REPORT_TYPE_LABELS } from "./report-labels";
import { fadReportStoragePrefix } from "./storage-paths";
import { listUnifiedTimeline } from "./timeline-service";
import { getFadWorkspace } from "./workspace-service";
import type { FadReportType, FadSmartReport } from "./types";

const SUB = "smart_reports";

function reportRef(workspaceId: string, reportId?: string) {
  const col = adminDb().collection("fad_workspaces").doc(workspaceId).collection(SUB);
  return reportId ? col.doc(reportId) : col.doc();
}

function docToReport(id: string, data: FirebaseFirestore.DocumentData): FadSmartReport {
  return { id, ...(data as Omit<FadSmartReport, "id">) };
}

function pdfPath(workspaceId: string, reportId: string): string {
  return `${fadReportStoragePrefix(workspaceId, reportId)}/report.pdf`;
}

async function signedUrl(storagePath: string): Promise<string | undefined> {
  const bucketName = firebaseConfig.storageBucket;
  if (!bucketName) return undefined;
  const [url] = await adminStorage()
    .bucket(bucketName)
    .file(storagePath)
    .getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });
  return url;
}

export async function listSmartReports(workspaceId: string): Promise<FadSmartReport[]> {
  const snap = await adminDb()
    .collection("fad_workspaces")
    .doc(workspaceId)
    .collection(SUB)
    .get();

  return snap.docs
    .map((d) => docToReport(d.id, d.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSmartReport(
  workspaceId: string,
  reportId: string,
): Promise<FadSmartReport | null> {
  const snap = await reportRef(workspaceId, reportId).get();
  if (!snap.exists) return null;
  return docToReport(snap.id, snap.data()!);
}

export async function attachReportDownloadUrl(
  report: FadSmartReport,
): Promise<FadSmartReport & { downloadUrl?: string }> {
  if (!report.storage?.pdfPath) return report;
  const downloadUrl = await signedUrl(report.storage.pdfPath);
  return { ...report, downloadUrl };
}

export async function generateSmartReport(params: {
  workspaceId: string;
  ownerId: string;
  type: FadReportType;
}): Promise<FadSmartReport & { downloadUrl?: string }> {
  const workspace = await getFadWorkspace(params.workspaceId);
  if (!workspace) {
    throw Object.assign(new Error("Workspace não encontrado."), { status: 404 });
  }

  const now = new Date().toISOString();
  const ref = reportRef(params.workspaceId);
  const title = REPORT_TYPE_LABELS[params.type];

  const base: Omit<FadSmartReport, "id"> = {
    workspaceId: params.workspaceId,
    ownerId: params.ownerId,
    type: params.type,
    title,
    status: "generating",
    createdAt: now,
    createdBy: params.ownerId,
    updatedAt: now,
  };

  await ref.set(base);

  try {
    const [mosaics, timeline, analyses, findings] = await Promise.all([
      listMosaicsForWorkspace(params.workspaceId),
      listUnifiedTimeline(params.workspaceId),
      listChangeAnalyses(params.workspaceId),
      listFiscalFindings(params.workspaceId),
    ]);

    const pdfBuffer = await buildFadReportPdf({
      workspace,
      type: params.type,
      mosaics,
      timeline,
      analyses,
      findings,
      generatedAt: now,
    });

    const path = pdfPath(params.workspaceId, ref.id);
    const bytes = await uploadBufferToStorage(path, pdfBuffer, "application/pdf");

    const completed: Omit<FadSmartReport, "id"> = {
      ...base,
      status: "ready",
      storage: { pdfPath: path, bytes },
      updatedAt: new Date().toISOString(),
    };

    await ref.update(completed as Record<string, unknown>);
    const report = docToReport(ref.id, completed);
    return attachReportDownloadUrl(report);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao gerar relatório.";
    await ref.update({
      status: "failed",
      errorMessage: msg,
      updatedAt: new Date().toISOString(),
    });
    throw e;
  }
}
