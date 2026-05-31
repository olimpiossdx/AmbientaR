/**
 * Testa o fluxo «Catingueiro completo» no servidor (sem browser).
 * Requer Firebase Admin: config/firebase-service-account.json ou GOOGLE_APPLICATION_CREDENTIALS.
 *
 * Uso:
 *   MCA_TEST_UID=<firebase-auth-uid> npm run mca:test-fluxo-catingueiro
 */
import fs from "node:fs";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdminApp } from "@/lib/firebase-admin";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import { defaultEtapaStatus } from "@/lib/mca/etapas";
import { loadGoldPerimeterFromRepo } from "@/lib/mca/gold-perimeters";
import { loadGoldLayersFromRepo } from "@/lib/mca/gold-cad-import";
import { parseLayersImportPayload } from "@/lib/mca/layer-import";
import { fitLayersToPerimeter } from "@/lib/mca/layer-fit";
import { toFeatureCollection } from "@/lib/mca/perimeter";
import { advanceMcaProjectToE15 } from "@/lib/mca/advance-to-e15";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { buildMcaLayoutPdf } from "@/lib/mca/layout-pdf";
import { loadMcaProjectLayers } from "@/lib/mca/load-project-layers";
import { MCA_GOLD_PRESETS } from "@/lib/mca/gold-presets";
import type { McaProjectDoc } from "@/lib/mca/types";

const COL = "mca_projects";
const PRESET = "gold_catingueiro";

async function importGoldLayers(projectId: string, project: McaProjectDoc): Promise<string[]> {
  let layers = loadGoldLayersFromRepo(PRESET);
  if (!layers || !Object.keys(layers).length) {
    const examplePath = path.join(
      process.cwd(),
      "public/mca/examples/layers-import-exemplo.json",
    );
    layers = parseLayersImportPayload(JSON.parse(fs.readFileSync(examplePath, "utf8")));
    console.warn("WARN: layers-import ouro ausente — fallback demo E06");
  }
  const perim = toFeatureCollection(project.perimeterGeoJson);
  if (perim?.features?.length) layers = fitLayersToPerimeter(layers, perim);

  const batch = studyMapsAdminDb().batch();
  const projectRef = studyMapsAdminDb().collection(COL).doc(projectId);
  const importedKeys: string[] = [];
  for (const [layerKey, fc] of Object.entries(layers)) {
    if (!fc.features?.length) continue;
    batch.set(projectRef.collection("layers").doc(layerKey), {
      geojson: fc,
      layerKey,
      source: "import-gold",
      updatedAt: FieldValue.serverTimestamp(),
    });
    importedKeys.push(layerKey);
  }
  batch.update(projectRef, {
    "meta.importedLayerKeys": importedKeys,
    "meta.goldPresetId": PRESET,
    "meta.lastImportAt": new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return importedKeys;
}

async function main() {
  const uid = process.env.MCA_TEST_UID?.trim();
  if (!uid) {
    console.error("Defina MCA_TEST_UID (uid Firebase Auth de um utilizador technical+).");
    process.exit(1);
  }

  getFirebaseAdminApp();
  const preset = MCA_GOLD_PRESETS.find((p) => p.id === PRESET)!;
  const perimeter = loadGoldPerimeterFromRepo(PRESET);
  if (!perimeter.features?.length) {
    console.error("Perímetro ouro Catingueiro não encontrado em public/mca/gold/");
    process.exit(1);
  }

  console.log("=== MCA test-fluxo-catingueiro ===\n");
  console.log(`uid: ${uid}`);
  console.log(`perímetro: ${perimeter.features.length} feature(s)\n`);

  const ref = studyMapsAdminDb().collection(COL).doc();
  const doc: McaProjectDoc = {
    uid,
    title: preset.title,
    meta: {
      propertyName: preset.propertyName,
      ownerName: preset.ownerName,
      municipality: preset.municipality,
      matriculas: preset.matriculas,
      car: preset.car,
      areaTotalHa: Number(preset.areaTotalHa.replace(",", ".")),
      scale: preset.scale,
      crs: "EPSG:31983",
      goldPresetId: PRESET,
    },
    perimeterGeoJson: perimeter,
    currentEtapa: 4,
    etapaStatus: defaultEtapaStatus(4),
    createdAt: new Date().toISOString(),
  };
  await ref.set({
    ...doc,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const projectId = ref.id;
  console.log(`→ projeto criado: ${projectId}`);

  const keys = await importGoldLayers(projectId, doc);
  console.log(`→ import E06: ${keys.length} layer(s)`);

  const result = await advanceMcaProjectToE15({
    projectId,
    uid,
    importDemoIfNeeded: false,
  });

  console.log(`→ pipeline job: ${result.jobId}`);
  console.log(`→ etapa: ${result.currentEtapa} · allPass: ${result.allPass}`);
  console.log(`→ score final: ${result.scores?.final?.toFixed(1) ?? "—"}`);

  const project = await loadMcaProject(projectId, uid);
  const layers = await loadMcaProjectLayers(projectId);
  if (project) {
    const pdf = buildMcaLayoutPdf({ ...project, id: projectId }, { layers });
    const outPdf = path.join(process.cwd(), "docs/mca/debug-reports", "fluxo-catingueiro-test.pdf");
    fs.writeFileSync(outPdf, pdf);
    console.log(`→ PDF E13: ${outPdf} (${pdf.length} bytes)`);
  }

  console.log("\n=== Fluxo servidor OK ===");
  console.log(`Abra no UI: http://localhost:9002/studies/mapas · projectId=${projectId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
