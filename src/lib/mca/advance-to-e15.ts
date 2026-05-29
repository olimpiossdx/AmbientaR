import fs from "node:fs";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import type { FeatureCollection } from "geojson";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import { parseLayersImportPayload } from "./layer-import";
import { fitLayersToPerimeter } from "./layer-fit";
import { toFeatureCollection, isValidPerimeter } from "./perimeter";
import { loadMcaProject, runMcaPipeline } from "./orchestrator";
import {
  etapaChecksPass,
  verifyEtapaWithLayerAreas,
  type EtapaCheck,
} from "./debug";
import { fcAreaHa } from "./tables";
import type { McaEtapaStatus, McaProjectDoc } from "./types";

const PROJECTS = "mca_projects";

function loadDemoImportPayload(): Record<string, FeatureCollection> {
  const examplePath = path.join(
    process.cwd(),
    "public/mca/examples/layers-import-exemplo.json",
  );
  const raw = JSON.parse(fs.readFileSync(examplePath, "utf8"));
  return parseLayersImportPayload(raw);
}

async function importDemoLayersForProject(
  projectId: string,
  project: McaProjectDoc,
): Promise<string[]> {
  let layers = loadDemoImportPayload();
  const perim = toFeatureCollection(project.perimeterGeoJson);
  if (perim?.features?.length) {
    layers = fitLayersToPerimeter(layers, perim);
  }
  const keys = Object.keys(layers);
  if (!keys.length) return [];

  const batch = studyMapsAdminDb().batch();
  const projectRef = studyMapsAdminDb().collection(PROJECTS).doc(projectId);
  const importedKeys: string[] = [];

  for (const [layerKey, fc] of Object.entries(layers)) {
    if (!fc.features?.length) continue;
    batch.set(projectRef.collection("layers").doc(layerKey), {
      geojson: fc,
      layerKey,
      source: "import-demo",
      updatedAt: FieldValue.serverTimestamp(),
    });
    importedKeys.push(layerKey);
  }

  batch.update(projectRef, {
    "meta.importedLayerKeys": keys,
    "meta.lastImportAt": new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return importedKeys;
}

async function loadLayerAreas(projectId: string): Promise<Map<string, number>> {
  const snap = await studyMapsAdminDb()
    .collection(PROJECTS)
    .doc(projectId)
    .collection("layers")
    .get();
  const map = new Map<string, number>();
  for (const doc of snap.docs) {
    const geo = doc.data().geojson as FeatureCollection | undefined;
    if (geo?.features?.length) map.set(doc.id, fcAreaHa(geo));
    else map.set(doc.id, 0);
  }
  return map;
}

function buildEtapaStatusFromChecks(
  checksByEtapa: Record<number, EtapaCheck[]>,
): { etapaStatus: Record<string, McaEtapaStatus>; currentEtapa: number } {
  const etapaStatus: Record<string, McaEtapaStatus> = {};
  for (let e = 1; e <= 4; e++) {
    etapaStatus[String(e).padStart(2, "0")] = "pass";
  }
  let currentEtapa = 4;
  for (let e = 5; e <= 15; e++) {
    const key = String(e).padStart(2, "0");
    const checks = checksByEtapa[e] ?? [];
    const pass = etapaChecksPass(checks);
    etapaStatus[key] = pass ? "pass" : "locked";
    if (pass) currentEtapa = e;
    else break;
  }
  const next = Math.min(15, currentEtapa + 1);
  if (currentEtapa < 15 && etapaStatus[String(next).padStart(2, "0")] !== "pass") {
    etapaStatus[String(next).padStart(2, "0")] = "active";
  }
  return { etapaStatus, currentEtapa };
}

export type AdvanceToE15Result = {
  jobId: string;
  currentEtapa: number;
  etapaStatus: Record<string, McaEtapaStatus>;
  checksByEtapa: Record<number, EtapaCheck[]>;
  allPass: boolean;
  scores?: McaProjectDoc["scores"];
  importedDemoLayers: boolean;
};

/** Prepara projecto (E05–E06), executa pipeline E05–E15 e actualiza gates por etapa. */
export async function advanceMcaProjectToE15(opts: {
  projectId: string;
  uid: string;
  importDemoIfNeeded?: boolean;
}): Promise<AdvanceToE15Result> {
  let project = await loadMcaProject(opts.projectId, opts.uid);
  if (!project) throw new Error("Projeto MCA não encontrado.");
  if (!isValidPerimeter(project.perimeterGeoJson)) {
    throw new Error("Perímetro inválido — guarde um polígono válido (E05).");
  }

  const matriculas = project.meta.matriculas?.length
    ? project.meta.matriculas
    : ["M-única"];
  if (!project.meta.matriculas?.length) {
    await studyMapsAdminDb().collection(PROJECTS).doc(opts.projectId).update({
      "meta.matriculas": matriculas,
      updatedAt: FieldValue.serverTimestamp(),
    });
    project = { ...project, meta: { ...project.meta, matriculas } };
  }

  let importedDemoLayers = false;
  const needsImport =
    opts.importDemoIfNeeded !== false &&
    !project.dwgGcsPath &&
    !(project.meta.importedLayerKeys?.length ?? 0);

  if (needsImport) {
    await importDemoLayersForProject(opts.projectId, project);
    importedDemoLayers = true;
    project =
      (await loadMcaProject(opts.projectId, opts.uid)) ?? project;
  }

  const pipeline = await runMcaPipeline({
    projectId: opts.projectId,
    uid: opts.uid,
    maxEtapa: 15,
    minEtapa: 5,
  });

  project = (await loadMcaProject(opts.projectId, opts.uid))!;
  const layerAreas = await loadLayerAreas(opts.projectId);

  const checksByEtapa: Record<number, EtapaCheck[]> = {};
  for (let e = 5; e <= 15; e++) {
    checksByEtapa[e] = verifyEtapaWithLayerAreas(e, project, layerAreas);
  }

  const { etapaStatus, currentEtapa } = buildEtapaStatusFromChecks(checksByEtapa);
  const allPass = Object.values(checksByEtapa).every((c) => etapaChecksPass(c));

  if (allPass) {
    for (let e = 5; e <= 15; e++) {
      etapaStatus[String(e).padStart(2, "0")] = "pass";
    }
  }

  await studyMapsAdminDb()
    .collection(PROJECTS)
    .doc(opts.projectId)
    .update({
      etapaStatus,
      currentEtapa: allPass ? 15 : currentEtapa,
      updatedAt: FieldValue.serverTimestamp(),
    });

  return {
    jobId: pipeline.jobId,
    currentEtapa: allPass ? 15 : currentEtapa,
    etapaStatus,
    checksByEtapa,
    allPass,
    scores: pipeline.scores ?? project.scores,
    importedDemoLayers,
  };
}
