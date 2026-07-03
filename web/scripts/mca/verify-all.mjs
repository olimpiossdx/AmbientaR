#!/usr/bin/env node
/**
 * Verifica ficheiros MCA E01–E03 (offline). Uso: npm run mca:verify-all
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const script = path.join(root, "scripts/mca/verify-etapa.mjs");

let failed = 0;
for (const etapa of [1, 2, 3, 4, 5]) {
  const r = spawnSync(process.execPath, [script, String(etapa)], {
    cwd: root,
    encoding: "utf8",
  });
  const line = (r.stdout || r.stderr || "").trim().split("\n").pop();
  if (r.status !== 0) {
    console.error(`E${String(etapa).padStart(2, "0")} FAIL`);
    if (line) console.error(line);
    failed++;
  } else if (line) {
    console.log(line);
  }
}

const checks = [
  ["dwg-convert", "src/lib/mca/dwg-convert.ts"],
  ["convert-dwg API", "src/app/api/mca/projects/[id]/convert-dwg/route.ts"],
  ["mca-workbench", "src/app/(app)/studies/mapas/mca-workbench.tsx"],
  ["debug agent API", "src/app/api/mca/debug/agent/route.ts"],
  ["agents API", "src/app/api/mca/agents/route.ts"],
  ["map-preview-pdf", "src/lib/mca/map-preview-pdf.ts"],
  ["layout-pdf", "src/lib/mca/layout-pdf.ts"],
];

const workerPy = path.join(root, "infra/geo-export-worker/server.py");
if (fs.existsSync(workerPy)) {
  const src = fs.readFileSync(workerPy, "utf8");
  if (!src.includes("/v1/cad/ingest")) {
    console.error("FAIL: geo-export-worker sem /v1/cad/ingest");
    failed++;
  }
}

for (const [label, rel] of checks) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error(`FAIL: falta ${label} (${rel})`);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} verificação(ões) falharam.`);
  process.exit(1);
}
console.log("\nMCA verify-all: E01–E05 + ficheiros v1 OK");
console.log("  (E06–E15: npm run mca:verify-all-etapas)");
process.exit(0);
