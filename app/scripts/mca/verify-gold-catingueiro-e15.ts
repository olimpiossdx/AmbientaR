/**
 * Benchmark ouro Catingueiro — perímetro public/mca/gold + pipeline offline E05–E15.
 * Uso: npm run mca:verify-gold-catingueiro
 */
import fs from "node:fs";
import path from "node:path";
import area from "@turf/area";
import { buildMcaLayoutPdf } from "../../src/lib/mca/layout-pdf";
import {
  etapaChecksPass,
  layerAreasFromMap,
  verifyEtapa05,
  verifyEtapaWithLayerAreas,
} from "../../src/lib/mca/debug";
import { loadGoldManifest } from "../../src/lib/mca/gold-manifest";
import { loadGoldPerimeterFromRepo } from "../../src/lib/mca/gold-perimeters";
import {
  extractPdfText,
  goldVisualChecksPass,
  runGoldVisualChecks,
} from "../../src/lib/mca/gold-visual-checks";
import { runOfflinePipeline } from "../../src/lib/mca/pipeline-offline";

const DATE = new Date().toISOString().slice(0, 10);
const AREA_TOLERANCE_PCT = 2;

async function main() {
  console.log("=== MCA benchmark Catingueiro (ouro) ===\n");

  const manifest = loadGoldManifest("gold_catingueiro");
  const targetAreaHa = manifest?.areaTotalHa ?? 2073.8318;

  const perimeter = loadGoldPerimeterFromRepo("gold_catingueiro");
  const areaHa = area(perimeter) / 10_000;
  const deltaPct = (Math.abs(areaHa - targetAreaHa) / targetAreaHa) * 100;
  const source = String(perimeter.features[0]?.properties?.source ?? "unknown");
  const cadFile = perimeter.features[0]?.properties?.cadFile as string | undefined;

  console.log(`Perímetro: ${perimeter.features.length} feature(s) · fonte ${source}`);
  if (cadFile) console.log(`CAD: ${cadFile}`);
  console.log(`Área: ${areaHa.toFixed(4)} ha (manifest ${targetAreaHa} ha, Δ ${deltaPct.toFixed(2)}%)`);

  if (deltaPct > AREA_TOLERANCE_PCT) {
    console.error(
      `FAIL · área fora de ±${AREA_TOLERANCE_PCT}% do manifest — correr npm run mca:regenerate-gold-perimeters`,
    );
    process.exit(1);
  }
  console.log("PASS · área vs manifest");

  const { project, layers, jobId } = await runOfflinePipeline();
  const areas = layerAreasFromMap(layers);

  if (!etapaChecksPass(verifyEtapa05(project))) {
    console.error("FAIL E05");
    process.exit(1);
  }
  console.log("PASS E05");

  for (const etapa of [6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
    const checks = verifyEtapaWithLayerAreas(etapa, project, areas);
    if (!etapaChecksPass(checks)) {
      for (const c of checks) {
        console.log(`FAIL E${String(etapa).padStart(2, "0")} · ${c.id}: ${c.detail}`);
      }
      process.exit(1);
    }
    console.log(`PASS E${String(etapa).padStart(2, "0")}`);
  }

  const pdf = buildMcaLayoutPdf(
    { ...project, id: "gold-catingueiro" },
    { layers: Object.fromEntries(layers) },
  );
  if (pdf.length < 500) {
    console.error("FAIL · PDF E13 buffer demasiado pequeno");
    process.exit(1);
  }
  console.log(`PASS E13 · pdf ${pdf.length} bytes`);

  const pdfText = await extractPdfText(pdf);
  const visualChecks = manifest
    ? runGoldVisualChecks({ project, layers, pdf, manifest, pdfText })
    : [];
  const visualAutoPass = goldVisualChecksPass(visualChecks);
  for (const c of visualChecks.filter((x) => !x.manual)) {
    console.log(`${c.pass ? "PASS" : "FAIL"} · visual/${c.id}: ${c.detail}`);
  }
  if (manifest && !visualAutoPass) {
    console.error("FAIL · benchmark visual v4 (checks automáticos)");
    process.exit(1);
  }
  if (manifest) {
    console.log(
      `PASS visual v4 · ${visualChecks.filter((x) => !x.manual && x.pass).length}/${visualChecks.filter((x) => !x.manual).length} auto`,
    );
  }

  const pivoCount = layers.get("USO_PIVO")?.features?.length ?? 0;
  const manifestNotes: string[] = [];
  if (manifest?.expected?.pivoCountMin && pivoCount < manifest.expected.pivoCountMin) {
    manifestNotes.push(
      `demo layers: PIVO ${pivoCount} < ${manifest.expected.pivoCountMin} (import real DWG para regressão plena)`,
    );
  }

  const notes = [
    `perimeter_source: ${source}${cadFile ? ` (${cadFile})` : ""}`,
    `perimeter_file: public/mca/gold/gold_catingueiro/perimeter.geojson`,
    `area_ha: ${areaHa.toFixed(4)} (manifest ${targetAreaHa})`,
    `score_final: ${project.scores?.final?.toFixed(1) ?? "—"}`,
    `pipeline_job: ${jobId}`,
    `layers: ${layers.size}`,
    `pdf_bytes: ${pdf.length}`,
    ...manifestNotes,
  ];

  const report = [
    "# E15 — CAD + release v1",
    "",
    `- Data: ${DATE}`,
    `- Debugger: \`npm run mca:verify-gold-catingueiro\` → **PASS**`,
    "",
    "## Checks",
    "",
    `- [x] \`score_final\`: nota ${project.scores?.final?.toFixed(1) ?? "—"}`,
    `- [x] \`pipeline_ran\`: ${jobId}`,
    `- [x] \`release_etapa\`: etapa actual ${project.currentEtapa ?? 15}`,
    `- [x] \`cad_layers\`: ${layers.size} layers no projecto`,
    `- [x] \`catingueiro_benchmark\`: área ${areaHa.toFixed(2)} ha (±${AREA_TOLERANCE_PCT}%) · PDF ${pdf.length} B`,
    `- [x] \`perimeter_source\`: ${source}`,
    `- [x] \`visual_v4_auto\`: ${visualAutoPass ? "PASS" : "FAIL"} (${visualChecks.filter((x) => !x.manual).length} checks)`,
    "",
    "## Visual v4 (automático)",
    "",
    ...visualChecks
      .filter((c) => !c.manual)
      .map((c) => `- [${c.pass ? "x" : " "}] \`${c.id}\`: ${c.detail}`),
    "",
    "## Visual v4 (manual — PDF Pimenta)",
    "",
    ...visualChecks
      .filter((c) => c.manual)
      .map((c) => `- [ ] \`${c.id}\`: ${c.detail}`),
    "",
    "## Benchmark Catingueiro (ouro)",
    "",
    ...notes.map((n) => `- ${n}`),
    "",
    "## Perímetro real (CAD Pimenta)",
    "",
    "Defina `MCA_GOLD_DWG_DIR` com `gold_catingueiro.dwg` e execute `npm run mca:regenerate-gold-perimeters`.",
    "",
    "## Limitações v1",
    "",
    "- Comparação visual pixel-a-pixel com PDF Pimenta ainda manual (`visualChecklist` no manifest).",
    "- QGIS worker v3: bridge ReportLab activo; PyQGIS via `MCA_PYQGIS=1` (stub até imagem QGIS).",
    "- Benchmark visual v4: `npm run mca:verify-gold-v4` ou API `POST /api/mca/gold/visual-verify`.",
    "",
  ].join("\n");

  const out = path.join(process.cwd(), "docs/mca/debug-reports/E15-pass.md");
  fs.writeFileSync(out, report);
  console.log(`\n=== Catingueiro benchmark PASS ===\nRelatório: ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
