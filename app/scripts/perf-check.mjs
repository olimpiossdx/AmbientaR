/**
 * Verificação leve de performance / organização (F18).
 * Uso: npm run perf:check
 *
 * 1. typecheck
 * 2. audit:routes
 * 3. imports pesados (@turf/turf, run-wave-a-analysis) em módulos "use client"
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcDir = path.join(root, "src");

const CLIENT_HEAVY_IMPORTS = [
  { pattern: /@turf\/turf/, label: "@turf/turf" },
  {
    pattern: /run-wave-a-analysis/,
    label: "run-wave-a-analysis",
  },
];

const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");
function runStep(label, command, args) {
  console.log(`\n=== ${label} ===\n`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function walkTsFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walkTsFiles(full, files);
    } else if (/\.(ts|tsx|mts|cts)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function isClientModule(source) {
  const head = source.slice(0, 400);
  return /(^|\n)\s*["']use client["']\s*;?/.test(head);
}

function isServerModule(source) {
  const head = source.slice(0, 400);
  return /(^|\n)\s*["']use server["']\s*;?/.test(head);
}

function auditHeavyImportsInClient() {
  console.log("\n=== heavy imports in client modules ===\n");

  const violations = [];

  for (const file of walkTsFiles(srcDir)) {
    const rel = path.relative(root, file).replace(/\\/g, "/");
    const source = readFileSync(file, "utf8");

    if (isServerModule(source)) continue;
    if (!isClientModule(source)) continue;

    for (const { pattern, label } of CLIENT_HEAVY_IMPORTS) {
      if (pattern.test(source)) {
        violations.push({ file: rel, import: label });
      }
    }
  }

  const turfFiles = walkTsFiles(srcDir).filter((file) => {
    const source = readFileSync(file, "utf8");
    return /@turf\/turf/.test(source);
  });

  for (const file of turfFiles) {
    const rel = path.relative(root, file).replace(/\\/g, "/");
    const source = readFileSync(file, "utf8");
    if (isClientModule(source)) {
      violations.push({ file: rel, import: "@turf/turf" });
    }
  }

  const unique = new Map();
  for (const v of violations) {
    unique.set(`${v.file}:${v.import}`, v);
  }

  if (unique.size > 0) {
    console.error(
      "[perf:check] Imports pesados encontrados em módulos \"use client\":\n",
    );
    for (const v of unique.values()) {
      console.error(`  - ${v.file} (${v.import})`);
    }
    console.error(
      "\nMova a lógica para Server Action/API ou use import() dinâmico no handler.\n",
    );
    process.exit(1);
  }

  console.log(
    `[perf:check] OK — 0 imports pesados em "use client" (${turfFiles.length} ficheiro(s) com @turf/turf só servidor).\n`,
  );
}

runStep("typecheck", process.execPath, [tscBin, "--noEmit"]);
runStep("audit:routes", process.execPath, [
  path.join(root, "scripts", "menu-route-audit.mjs"),
]);
auditHeavyImportsInClient();

console.log("[perf:check] OK — typecheck + audit:routes + geo/turf audit passaram.\n");
