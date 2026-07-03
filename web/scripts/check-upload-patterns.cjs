/**
 * Verificações rápidas de regressão para uploads (Storage no cliente vs API disco).
 * Executar: node scripts/check-upload-patterns.cjs
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(process.cwd(), "src");

function walkDir(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      walkDir(p, acc);
    } else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const fetchUploadRe =
  /fetch\s*\(\s*['"`]\s*\/api\/uploads|fetch\s*\(\s*[`'"]\/api\/uploads/g;

let exit = 0;
const files = walkDir(SRC);
const badFetch = [];
for (const f of files) {
  const c = fs.readFileSync(f, "utf8");
  if (fetchUploadRe.test(c)) badFetch.push(path.relative(process.cwd(), f));
}

if (badFetch.length) {
  console.error(
    "[check-upload-patterns] Uso de fetch para /api/uploads no src (evitar em fluxos principais):",
  );
  badFetch.forEach((x) => console.error("  -", x));
  exit = 1;
} else {
  console.log(
    "[check-upload-patterns] OK: nenhum fetch('/api/uploads…') em src.",
  );
}

const suspicious = [];
const typeFileRe = /type\s*=\s*["']file["']/g;
const hasStorageHelper =
  /uploadFileToStorage|from\s+['"]@\/lib\/storage-upload['"]|useUploadBrandingImage|use-branding-upload|useStorageFileUpload|usePreparedUpload|use-storage-file-upload|use-prepared-upload/;
const hasUploadBytesStorage =
  /uploadBytes\s*\(\s*storageRef|getStorage\s*\(/;
const allowListSubstrings = [
  "input.tsx", // shadcn base
  "licensing-locational-block", // GeoJSON só no browser
  "import-dialog", // XLSX → Firestore
  "usos-insignificantes/page.tsx", // input oculto; upload real no uso-insignificante-form
  "check-upload-patterns",
];

for (const f of files) {
  const rel = path.relative(process.cwd(), f).replace(/\\/g, "/");
  if (allowListSubstrings.some((s) => rel.includes(s))) continue;
  const c = fs.readFileSync(f, "utf8");
  if (!typeFileRe.test(c)) continue;
  typeFileRe.lastIndex = 0;
  if (
    hasStorageHelper.test(c) ||
    hasUploadBytesStorage.test(c) ||
    /\/api\/uploads\//.test(c)
  )
    continue;
  suspicious.push(rel);
}

if (suspicious.length) {
  console.warn(
    "[check-upload-patterns] Ficheiros com type=\"file\" sem import óbvio de storage-upload / getStorage+uploadBytes (rever manualmente):",
  );
  suspicious.forEach((x) => console.warn("  ?", x));
} else {
  console.log(
    "[check-upload-patterns] Nenhum ficheiro .tsx/.ts com type=file fora dos padrões conhecidos.",
  );
}

const maxSizeLiteralRe =
  /const\s+MAX_(?:FILE_SIZE|PROPOSAL_FILE_BYTES|ANEXO_\w+_BYTES)\s*=\s*\d+\s*\*\s*1024\s*\*\s*1024/g;
const allowedMaxSizeFiles = new Set([
  path.join(SRC, "lib", "upload-limits.ts").replace(/\\/g, "/"),
]);
const badMaxSize = [];
for (const f of files) {
  const rel = path.relative(process.cwd(), f).replace(/\\/g, "/");
  if (allowedMaxSizeFiles.has(rel.replace(/\\/g, "/"))) continue;
  const c = fs.readFileSync(f, "utf8");
  maxSizeLiteralRe.lastIndex = 0;
  if (maxSizeLiteralRe.test(c)) badMaxSize.push(rel);
}

if (badMaxSize.length) {
  console.error(
    "[check-upload-patterns] Constantes MAX_*_BYTES locais (use @/lib/upload-limits):",
  );
  badMaxSize.forEach((x) => console.error("  -", x));
  exit = 1;
} else {
  console.log(
    "[check-upload-patterns] OK: sem MAX_FILE_SIZE / MAX_*_BYTES duplicados fora de upload-limits.ts.",
  );
}

process.exit(exit);
