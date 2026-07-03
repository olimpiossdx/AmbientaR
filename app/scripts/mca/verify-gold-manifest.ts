/**
 * Valida perímetros ouro vs manifest (área ±2%).
 * Uso: npm run mca:verify-gold-manifest
 */
import area from "@turf/area";
import { MCA_GOLD_PRESETS } from "../../src/lib/mca/gold-presets";
import { loadGoldPerimeterFromRepo } from "../../src/lib/mca/gold-perimeters";
import { loadGoldManifest } from "../../src/lib/mca/gold-manifest";

const AREA_TOLERANCE_PCT = 2;

async function main() {
  console.log("=== MCA gold manifest vs perimeter ===\n");
  let failed = false;

  for (const preset of MCA_GOLD_PRESETS) {
    const manifest = loadGoldManifest(preset.id);
    if (!manifest) {
      console.error(`FAIL ${preset.id} · manifest.json em falta`);
      failed = true;
      continue;
    }

    const fc = loadGoldPerimeterFromRepo(preset.id);
    const ha = area(fc) / 10_000;
    const deltaPct = (Math.abs(ha - manifest.areaTotalHa) / manifest.areaTotalHa) * 100;
    const source = String(fc.features[0]?.properties?.source ?? "unknown");
    const pass = deltaPct <= AREA_TOLERANCE_PCT;

    console.log(
      `${pass ? "PASS" : "FAIL"} ${preset.id} · ${ha.toFixed(2)} ha (alvo ${manifest.areaTotalHa}) · Δ ${deltaPct.toFixed(2)}% · ${source}`,
    );
    if (!pass) failed = true;
  }

  if (failed) process.exit(1);
  console.log("\n=== gold manifest PASS ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
