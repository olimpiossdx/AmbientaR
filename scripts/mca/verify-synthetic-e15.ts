/**
 * Verifica E06–E15 com pipeline sintético (sem import demo E06).
 * Uso: npx tsx scripts/mca/verify-synthetic-e15.ts
 */
import {
  etapaChecksPass,
  layerAreasFromMap,
  verifyEtapa05,
  verifyEtapaWithLayerAreas,
} from "../../src/lib/mca/debug";
import { runOfflinePipelineSynthetic } from "../../src/lib/mca/pipeline-offline";

async function main() {
  console.log("=== MCA synthetic E05–E15 ===\n");
  const { project, layers } = await runOfflinePipelineSynthetic();
  const areas = layerAreasFromMap(layers);

  if (!etapaChecksPass(verifyEtapa05(project))) {
    console.error("FAIL E05");
    process.exit(1);
  }
  console.log("PASS E05");

  for (const etapa of [6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
    const checks = verifyEtapaWithLayerAreas(etapa, project, areas);
    const pass = etapaChecksPass(checks);
    for (const c of checks) {
      console.log(`${pass ? "PASS" : "FAIL"} E${String(etapa).padStart(2, "0")} · ${c.id}: ${c.detail}`);
    }
    if (!pass) process.exit(1);
  }
  console.log("\n=== Synthetic E06–E15 PASS ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
