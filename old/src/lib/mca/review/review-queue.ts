import { FieldValue } from "firebase-admin/firestore";
import type { FeatureCollection } from "geojson";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import type { McaAgentRun, McaProjectDoc } from "../types";

export type McaReviewStatus = "pending" | "in_review" | "approved" | "rejected" | "promoted";

export type McaReviewDoc = {
  projectId: string;
  uid: string;
  layerKey?: string;
  agentId?: string;
  kind: "conflict" | "layer_critical" | "export_gate";
  status: McaReviewStatus;
  title: string;
  detail?: string;
  reviewerUid?: string;
  reviewedAt?: string;
  createdAt?: FirebaseFirestore.FieldValue;
  updatedAt?: FirebaseFirestore.FieldValue;
};

const CRITICAL_LAYERS = ["AMB_APP", "AMB_RL_GLEBA", "FUND_LIMITE"];

export function buildReviewItemsFromPipeline(opts: {
  layers: Map<string, FeatureCollection>;
  runs: McaAgentRun[];
}): Omit<McaReviewDoc, "projectId" | "uid" | "createdAt" | "updatedAt">[] {
  const items: Omit<McaReviewDoc, "projectId" | "uid" | "createdAt" | "updatedAt">[] = [];
  const hasConflict = opts.runs.some((r) => r.agentId === "MCA_Conflict_Merger" && r.status === "pass");

  for (const layerKey of CRITICAL_LAYERS) {
    const fc = opts.layers.get(layerKey);
    if (!fc?.features?.length) continue;
    items.push({
      layerKey,
      kind: "layer_critical",
      status: "pending",
      title: `Revisar layer ${layerKey}`,
      detail: "Camada crítica (APP/RL/limite) — aprovação humana antes de export legal.",
    });
  }

  if (hasConflict) {
    items.push({
      agentId: "MCA_Conflict_Merger",
      kind: "conflict",
      status: "pending",
      title: "Conflito APP vs uso",
      detail: "Revisar sobreposição APP vs uso detectada pelo pipeline.",
    });
  }

  return items;
}

export async function syncReviewQueueFromPipeline(opts: {
  projectId: string;
  uid: string;
  project: McaProjectDoc;
  layers: Map<string, FeatureCollection>;
  runs: McaAgentRun[];
}): Promise<number> {
  const col = studyMapsAdminDb().collection("mca_reviews");
  const batch = studyMapsAdminDb().batch();
  const items = buildReviewItemsFromPipeline({ layers: opts.layers, runs: opts.runs });
  let n = 0;

  for (const item of items) {
    const id =
      item.kind === "conflict"
        ? `${opts.projectId}_conflict`
        : `${opts.projectId}_${item.layerKey}`;
    batch.set(
      col.doc(id),
      {
        projectId: opts.projectId,
        uid: opts.uid,
        ...item,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      } satisfies McaReviewDoc,
      { merge: true },
    );
    n++;
  }

  if (n === 0) return 0;
  await batch.commit();
  return n;
}

export async function listProjectReviews(
  projectId: string,
  uid: string,
): Promise<(McaReviewDoc & { id: string })[]> {
  const snap = await studyMapsAdminDb()
    .collection("mca_reviews")
    .where("projectId", "==", projectId)
    .where("uid", "==", uid)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as McaReviewDoc) }));
}

export async function updateReviewStatus(opts: {
  reviewId: string;
  uid: string;
  status: McaReviewStatus;
  reviewerUid: string;
}): Promise<void> {
  const ref = studyMapsAdminDb().collection("mca_reviews").doc(opts.reviewId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Revisão não encontrada.");
  const data = snap.data() as McaReviewDoc;
  if (data.uid !== opts.uid) throw new Error("Sem permissão.");
  await ref.update({
    status: opts.status,
    reviewerUid: opts.reviewerUid,
    reviewedAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export function reviewsReadyForExport(reviews: McaReviewDoc[]): boolean {
  const critical = reviews.filter((r) => r.kind === "layer_critical" || r.kind === "export_gate");
  if (!critical.length) return true;
  return critical.every((r) => r.status === "promoted" || r.status === "approved");
}
