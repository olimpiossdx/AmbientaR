/**
 * Gera public/mca/gold/{preset}/layers-import.json a partir do pipeline offline (E05–E15).
 * Sprint 1: geometria mínima no repo sem DWG Pimenta no disco.
 *
 * Uso: npm run mca:export-gold-layers
 *      npm run mca:export-gold-layers -- gold_catingueiro
 */
import type { FeatureCollection } from "geojson";
import type { McaGoldPresetId } from "../../src/lib/mca/gold-presets";
import { MCA_GOLD_PRESETS } from "../../src/lib/mca/gold-presets";
import { writeGoldLayersImport } from "../../src/lib/mca/gold-cad-import";
import { runOfflinePipeline } from "../../src/lib/mca/pipeline-offline";

const SKIP_KEYS = new Set(["BASE_PERIMETRO"]);

async function main() {
  const arg = process.argv[2]?.trim() as McaGoldPresetId | undefined;
  const presetId = arg ?? "gold_catingueiro";
  if (!MCA_GOLD_PRESETS.some((p) => p.id === presetId)) {
    console.error(`Preset inválido: ${presetId}`);
    process.exit(1);
  }

  if (presetId !== "gold_catingueiro") {
    console.warn("Pipeline offline usa perímetro Catingueiro; exportando layers para", presetId);
  }

  console.log("=== MCA export gold layers (pipeline offline) ===\n");

  const { layers, project } = await runOfflinePipeline();
  const record: Record<string, FeatureCollection> = {};
  for (const [key, fc] of layers) {
    if (SKIP_KEYS.has(key)) continue;
    if (fc.features?.length) record[key] = fc;
  }

  const out = writeGoldLayersImport(presetId, record, {
    source: "mca_gold_pipeline_offline",
    cadFile: project.meta.importedLayerKeys?.length
      ? `demo+pipeline:${project.meta.importedLayerKeys.join(",")}`
      : "pipeline",
  });

  console.log(`→ ${out}`);
  console.log(`  layers: ${Object.keys(record).length}`);
  for (const k of Object.keys(record).sort()) {
    console.log(`    ${k}: ${record[k].features?.length ?? 0} feições`);
  }
  console.log("\nTeste: npm run mca:verify-gold-catingueiro");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
