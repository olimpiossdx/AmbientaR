/**
 * Verifica rotas intercept (.) do Bloco 3 — FormShell modal ou redirect legado.
 * Uso: npm run perf:form-shell-debug
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const appDir = path.join(root, "src", "app", "(app)");

const SHELL_MARKERS = [
  /FormShell/,
  /StudyFormShell/,
  /InterceptRedirect/,
  /router\.replace\(/,
];

function walkInterceptPages(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkInterceptPages(full, files);
    } else if (entry === "page.tsx" && full.includes(`${path.sep}(.)`)) {
      files.push(full);
    }
  }
  return files;
}

const pages = walkInterceptPages(appDir);
const failures = [];

for (const file of pages) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const source = readFileSync(file, "utf8");
  const hasShell = SHELL_MARKERS.some((re) => re.test(source));
  const hasModalVariant =
    /variant\s*=\s*["']modal["']/.test(source) ||
    /InterceptRedirect/.test(source) ||
    /router\.replace\(/.test(source);

  if (!hasShell) {
    failures.push(`${rel}: sem FormShell/StudyFormShell/redirect`);
  } else if (!hasModalVariant) {
    failures.push(`${rel}: shell sem variant="modal" nem redirect`);
  }
}

console.log(`\n=== PERF FormShell intercept (${pages.length} rotas) ===\n`);

if (failures.length) {
  console.error("[perf:form-shell-debug] FALHAS:\n");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

for (const file of pages) {
  console.log(`  OK ${path.relative(root, file).replace(/\\/g, "/")}`);
}

console.log(`\n[perf:form-shell-debug] OK — ${pages.length}/${pages.length} rotas (.) com padrão modal.\n`);
