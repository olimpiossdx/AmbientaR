import { FieldValue } from "firebase-admin/firestore";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import { resolveAgentOrder } from "./dag";
import { runMcaAgent } from "./agents/run-agent";
import { loadMcaRegistry, listAgentsForEtapa } from "./registry";
import { buildAppTable, buildRlTable, buildUsoTable, extractRlRowsFromLayers } from "./tables";
import { persistAgentLayer } from "./persist-layer";
import { ensureProjectGeometry } from "./geometry-build";
import { buildLayoutJson } from "./layout/build-layout-json";
import { getInvalidatedLayerKeys } from "./behavior/invalidation";
import { loadBehaviorRegistry } from "./behavior/load-behavior-registry";
import { syncReviewQueueFromPipeline } from "./review/review-queue";
import { isValidPerimeter, perimeterAreaHa, toFeatureCollection } from "./perimeter";
import type { FeatureCollection } from "geojson";
import type { McaAgentContext, McaAgentRun, McaProjectDoc } from "./types";

const PROJECTS = "mca_projects";
const RUNS = "mca_agent_runs";
const LAYERS = "layers";

export async function loadMcaProject(
  projectId: string,
  uid: string,
): Promise<(McaProjectDoc & { id: string }) | null> {
  const snap = await studyMapsAdminDb().collection(PROJECTS).doc(projectId).get();
  if (!snap.exists) return null;
  const data = snap.data() as McaProjectDoc;
  if (data.uid !== uid) return null;
  return { id: snap.id, ...data };
}

export async function runMcaPipeline(opts: {
  projectId: string;
  uid: string;
  maxEtapa?: number;
  minEtapa?: number;
  agentIds?: string[];
  /** v2: layers alteradas upstream → invalidar downstream antes do run */
  changedLayerKeys?: string[];
}): Promise<{ jobId: string; runs: McaAgentRun[]; scores?: McaProjectDoc["scores"] }> {
  const project = await loadMcaProject(opts.projectId, opts.uid);
  if (!project) throw new Error("Projeto MCA não encontrado.");

  const registry = loadMcaRegistry();
  const maxEtapa = opts.maxEtapa ?? 15;
  const minEtapa = opts.minEtapa ?? 1;
  const requested =
    opts.agentIds?.length
      ? opts.agentIds
      : listAgentsForEtapa(maxEtapa, registry, minEtapa).filter(
          (id) => !["MCA_Orchestrator_Master", "MCA_DAG_Resolver"].includes(id),
        );

  const order = resolveAgentOrder(registry, requested);
  const jobId = crypto.randomUUID();
  const layers = new Map<string, FeatureCollection>();

  const layerSnap = await studyMapsAdminDb()
    .collection(PROJECTS)
    .doc(opts.projectId)
    .collection(LAYERS)
    .get();
  for (const doc of layerSnap.docs) {
    const d = doc.data();
    if (d.geojson) layers.set(doc.id, d.geojson as FeatureCollection);
  }

  if (opts.changedLayerKeys?.length) {
    const stale = getInvalidatedLayerKeys(opts.changedLayerKeys);
    for (const key of stale) {
      layers.delete(key);
      await studyMapsAdminDb()
        .collection(PROJECTS)
        .doc(opts.projectId)
        .collection(LAYERS)
        .doc(key)
        .delete()
        .catch(() => undefined);
    }
  }

  const ctx: McaAgentContext = { project, layers, logs: [] };
  const runs: McaAgentRun[] = [];

  if (isValidPerimeter(project.perimeterGeoJson)) {
    ensureProjectGeometry(ctx);
  }

  for (const agentId of order) {
    const started = Date.now();
    const result = await runMcaAgent(agentId, ctx);
    const durationMs = Date.now() - started;

    if (result.geojson && result.layerKey && result.geojson.features?.length) {
      ctx.layers.set(result.layerKey, result.geojson);
      await persistAgentLayer(opts.projectId, result);
    }

    if (agentId.startsWith("MCA_Layout_")) {
      ctx.project.layoutMeta = {
        ...(ctx.project.layoutMeta ?? {}),
        [agentId]: result.meta ?? true,
      };
    }

    const run: McaAgentRun = {
      agentId,
      status: result.status,
      message: result.message,
      durationMs,
      score: result.score,
    };
    runs.push(run);

    await studyMapsAdminDb().collection(RUNS).doc(`${jobId}_${agentId}`).set({
      jobId,
      projectId: opts.projectId,
      uid: opts.uid,
      agentId,
      status: result.status,
      message: result.message ?? null,
      durationMs,
      score: result.score ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  const perim = toFeatureCollection(project.perimeterGeoJson);
  const totalHa = project.meta.areaTotalHa ?? (perim ? perimeterAreaHa(perim) : 0);
  const tables = {
    uso: buildUsoTable(ctx.layers, totalHa),
    app: buildAppTable(ctx.layers),
    rl: project.tables?.rl ?? [],
  };

  let layoutMeta = { ...(ctx.project.layoutMeta ?? project.layoutMeta ?? {}) };
  for (const r of runs) {
    if (r.agentId.startsWith("MCA_Layout_")) {
      layoutMeta = { ...layoutMeta, [r.agentId]: layoutMeta[r.agentId] ?? true };
    }
  }

  let scores = project.scores;
  ctx.project.layoutMeta = layoutMeta;
  ctx.project.tables = {
    ...tables,
    rl: buildRlTable(extractRlRowsFromLayers(ctx.layers, project.meta.matriculas)),
  };
  if (order.includes("MCA_Score_Aggregator")) {
    const scoreResult = await runMcaAgent("MCA_Score_Aggregator", ctx);
    if (scoreResult.meta) {
      scores = {
        geometric: Number(scoreResult.meta.geometric) || 0,
        topological: Number(scoreResult.meta.topological) || 0,
        visual: Number(scoreResult.meta.visual) || 0,
        ia: Number(scoreResult.meta.ia) || 0,
        environmental: Number(scoreResult.meta.environmental) || 0,
        semantic: Number(scoreResult.meta.semantic) || 0,
        final: Number(scoreResult.meta.final) || 0,
      };
    }
  }

  const etapaStatus = { ...(project.etapaStatus ?? {}) };
  for (let e = 1; e <= maxEtapa; e++) {
    const key = String(e).padStart(2, "0");
    etapaStatus[key] = "pass";
  }

  const layoutJson = buildLayoutJson({ ...project, tables: { ...tables, rl: buildRlTable(extractRlRowsFromLayers(ctx.layers, project.meta.matriculas)) }, layoutMeta }, ctx.layers);

  await studyMapsAdminDb().collection(PROJECTS).doc(opts.projectId).update({
    tables: {
      ...tables,
      rl: buildRlTable(extractRlRowsFromLayers(ctx.layers, project.meta.matriculas)),
    },
    layoutMeta,
    layoutJson,
    scores: scores ?? project.scores,
    lastJobId: jobId,
    currentEtapa: maxEtapa,
    etapaStatus,
    "meta.behaviorRegistryCount": Object.keys(loadBehaviorRegistry()).length,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await syncReviewQueueFromPipeline({
    projectId: opts.projectId,
    uid: opts.uid,
    project: { ...project, layoutMeta, layoutJson, scores: scores ?? project.scores },
    layers: ctx.layers,
    runs,
  });

  return { jobId, runs, scores };
}
