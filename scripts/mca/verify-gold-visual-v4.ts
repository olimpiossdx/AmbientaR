/**
 * Benchmark visual v4 — checklist manifest Catingueiro + PDF E13.
 * Uso: npm run mca:verify-gold-v4
 */
import fs from "node:fs";
import path from "node:path";
import { buildMcaLayoutPdf } from "../../src/lib/mca/layout-pdf";
import { loadGoldManifest } from "../../src/lib/mca/gold-manifest";
import {
  extractPdfText,
  goldVisualChecksPass,
  runGoldVisualChecks,
} from "../../src/lib/mca/gold-visual-checks";
import { runOfflinePipeline } from "../../src/lib/mca/pipeline-offline";

const DATE = new Date().toISOString().slice(0, 10);

async function main() {
  console.log("=== MCA benchmark visual v4 (Catingueiro) ===\n");

  const manifest = loadGoldManifest("gold_catingueiro");
  if (!manifest) {
    console.error("FAIL · manifest gold_catingueiro em falta");
    process.exit(1);
  }

  const { project, layers } = await runOfflinePipeline();
  const pdf = await buildMcaLayoutPdf(
    { ...project, id: "gold-catingueiro-v4" },
    { layers: Object.fromEntries(layers) },
  );
  const pdfText = await extractPdfText(pdf);

  const checks = runGoldVisualChecks({
    project,
    layers,
    pdf,
    manifest,
    pdfText,
  });

  let failed = false;
  for (const c of checks) {
    const tag = c.manual ? "MANUAL" : c.pass ? "PASS" : "FAIL";
    console.log(`${tag} · ${c.id}: ${c.detail}`);
    if (!c.manual && !c.pass) failed = true;
  }

  const autoPass = goldVisualChecksPass(checks);
  if (!autoPass) {
    console.error("\nFAIL · checks automáticos do visual v4");
    process.exit(1);
  }

  const manual = checks.filter((c) => c.manual);
  const reportPath = path.join(process.cwd(), "docs/mca/debug-reports/E15-visual-v4.md");
  const lines = [
    "# E15 — Benchmark visual v4 (Catingueiro)",
    "",
    `- Data: ${DATE}`,
    `- Comando: \`npm run mca:verify-gold-v4\` → **PASS** (automático)`,
    "",
    "## Checks automáticos",
    "",
    ...checks
      .filter((c) => !c.manual)
      .map((c) => `- [${c.pass ? "x" : " "}] \`${c.id}\`: ${c.detail}`),
    "",
    "## Revisão manual (PDF Pimenta)",
    "",
    ...manual.map((c) => `- [ ] \`${c.id}\` — ${c.label}: ${c.detail}`),
    "",
    "## PDF",
    "",
    `- Tamanho: ${pdf.length} bytes`,
    `- Texto extraído: ${pdfText.length} caracteres`,
    "",
  ];
  fs.writeFileSync(reportPath, lines.join("\n"));

  console.log(`\n=== Visual v4 PASS (${checks.filter((c) => !c.manual).length} auto · ${manual.length} manual) ===`);
  console.log(`Relatório: ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
