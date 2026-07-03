/**
 * Debug por fase do PERF-ROADMAP (F04–F18 + smoke estrutural).
 * Uso: npm run perf:phase-debug
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "src");

const results = [];

function pass(phase, msg) {
  results.push({ phase, ok: true, msg });
  console.log(`[${phase}] OK — ${msg}`);
}

function fail(phase, msg) {
  results.push({ phase, ok: false, msg });
  console.error(`[${phase}] FALHA — ${msg}`);
}

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

function mustExist(rel, phase, label) {
  if (!existsSync(path.join(root, rel))) {
    fail(phase, `${label}: ficheiro em falta (${rel})`);
    return false;
  }
  return true;
}

function mustInclude(rel, pattern, phase, label) {
  if (!mustExist(rel, phase, label)) return false;
  const text = read(rel);
  if (!pattern.test(text)) {
    fail(phase, `${label}: padrão não encontrado em ${rel}`);
    return false;
  }
  return true;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

// F04 — credenciais
const gitStatus = spawnSync("git", ["status", "--porcelain"], {
  cwd: root,
  encoding: "utf8",
});
const gitLines = (gitStatus.stdout || "").split("\n").filter(Boolean);
const credLeak = gitLines.filter(
  (l) =>
    /\.json/.test(l) &&
    /firebase|service.account|chave/i.test(l) &&
    !/package-lock/.test(l),
);
if (credLeak.length) {
  fail("F04", `JSON de credencial no git status: ${credLeak.join("; ")}`);
} else {
  pass("F04", "git status sem JSON de credencial");
}
if (existsSync(path.join(root, "config/firebase-service-account.json"))) {
  pass("F04", "config/firebase-service-account.json presente localmente");
} else {
  fail("F04", "config/firebase-service-account.json ausente (dev Admin)");
}

// F05 — legado SERVIDOR
const servidorSrc = walk(src).filter((f) => /SERVIDOR/i.test(f));
if (servidorSrc.length) {
  fail("F05", `Ficheiros *SERVIDOR* em src: ${servidorSrc.map((f) => path.relative(root, f)).join(", ")}`);
} else {
  pass("F05", "zero ficheiros *SERVIDOR* em src/");
}

// F06 — launchers
if (
  mustExist("scripts/launchers/README.md", "F06", "launchers") &&
  mustExist("start-dev.bat", "F06", "wrapper raiz")
) {
  pass("F06", "launchers em scripts/ + start-dev.bat na raiz");
}

// F07 — CRM recharts lazy
if (mustInclude("src/app/(app)/crm/page.tsx", /dynamic\(\s*\(\)\s*=>\s*import\(['"]\.\/crm-dashboard/, "F07", "CrmDashboard dynamic")) {
  pass("F07", "CRM dashboard lazy");
}

// F08 — financeiro lazy
const f08Files = [
  ["src/app/(app)/page.tsx", /FinancialDashboard\s*=\s*dynamic/],
  ["src/app/(app)/cash-flow/cash-flow-view.tsx", /CashFlowChart\s*=\s*dynamic/],
];
let f08ok = true;
for (const [rel, pat] of f08Files) {
  if (!mustInclude(rel, pat, "F08", "lazy financeiro")) f08ok = false;
}
if (f08ok) pass("F08", "financeiro / cash-flow lazy");

// F09 — monitoramento
if (
  mustInclude(
    "src/app/(app)/monitoring/manual/page.tsx",
    /dynamic.*manual-monitoring-charts|ManualMonitoringCharts/i,
    "F09",
    "monitoring charts lazy",
  )
) {
  pass("F09", "monitoramento manual lazy");
}

// F10 — turf cliente (rápido)
const turfViolations = [];
for (const file of walk(src)) {
  const text = readFileSync(file, "utf8");
  const head = text.slice(0, 400);
  if (!/(^|\n)\s*["']use client["']/.test(head)) continue;
  if (/@turf\/turf/.test(text)) {
    turfViolations.push(path.relative(root, file));
  }
}
if (turfViolations.length) {
  fail("F10", `@turf/turf em cliente: ${turfViolations.join(", ")}`);
} else {
  pass("F10", "zero @turf/turf em módulos use client");
}

// F11 — upload pipeline
if (
  mustInclude(
    "src/lib/upload-pipeline.ts",
    /await import\(["']browser-image-compression["']\)/,
    "F11",
    "image compression lazy",
  ) &&
  mustInclude("src/lib/upload-pipeline.ts", /await import\(["']pizzip["']\)/, "F11", "pizzip lazy")
) {
  pass("F11", "upload-pipeline com import() dinâmico");
}

// F12 — shell layout
const layoutChecks = [
  [/NotificationPushProvider.*dynamic|dynamic.*notification-push-provider/i, "NotificationPushProvider"],
  [/OfflineQueueBadge.*dynamic|dynamic.*offline-queue-badge/i, "OfflineQueueBadge"],
  [/navigation-labels/, "navigation-labels"],
];
let f12ok = true;
for (const [pat, label] of layoutChecks) {
  if (!mustInclude("src/app/(app)/layout.tsx", pat, "F12", label)) f12ok = false;
}
if (f12ok) pass("F12", "layout providers lazy + navigation-labels");

// F13–F15 — FormShells
const shells = [
  ["F13", "src/app/(app)/licenses/license-form-shell.tsx"],
  ["F14", "src/app/(app)/invoices/invoice-form-shell.tsx"],
  ["F14", "src/app/(app)/outorgas/outorga-form-shell.tsx"],
  ["F15", "src/app/(app)/technical-responsible/responsible-form-shell.tsx"],
  ["F15", "src/app/(app)/responsible-company/company-form-shell.tsx"],
];
for (const [phase, rel] of shells) {
  if (mustExist(rel, phase, "FormShell")) {
    pass(phase, path.basename(rel));
  }
}

// F16 — study shell + intercept count
if (mustExist("src/components/studies/study-form-shell.tsx", "F16", "StudyFormShell")) {
  pass("F16", "study-form-shell.tsx");
}
const interceptCount = walk(path.join(src, "app", "(app)")).filter((f) =>
  f.includes(`${path.sep}(.)`),
).length;
if (interceptCount === 24) {
  pass("F16", `24 rotas intercept (.)`);
} else {
  fail("F16", `esperadas 24 rotas (.), encontradas ${interceptCount}`);
}

// F18 — perf-check script
if (mustExist("scripts/perf-check.mjs", "F18", "perf-check")) {
  pass("F18", "scripts/perf-check.mjs");
}

const failed = results.filter((r) => !r.ok);
console.log(`\n--- Resumo: ${results.length - failed.length}/${results.length} checks OK ---\n`);
if (failed.length) {
  process.exit(1);
}
