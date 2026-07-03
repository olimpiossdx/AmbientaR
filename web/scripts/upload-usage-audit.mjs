import { readdirSync, statSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    if (st.isFile() && /\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const rows = [];
for (const file of walk(path.join("src", "app"))) {
  const content = readFileSync(file, "utf8");
  if (!content.includes("uploadFile(") && !content.includes("useStorageFileUpload")) {
    continue;
  }
  rows.push({
    file: file.replaceAll("\\", "/"),
    uploadCalls: (content.match(/uploadFile\(/g) ?? []).length,
    hookUses: (content.match(/useStorageFileUpload/g) ?? []).length,
    hasPreview: content.includes("AttachmentPreviewSection"),
    hasPreparationDialog: content.includes("UploadPreparationDialog"),
    usesDownloadUrl: content.includes("downloadUrl"),
  });
}

const markdown = [
  "# Auditoria de Uploads",
  "",
  `Gerado em: ${new Date().toISOString()}`,
  "",
  "Padrão adotado: `downloadUrl` para retornos de upload.",
  "",
  "| Arquivo | Calls | Hook | Preview | Preparação | `downloadUrl` |",
  "|---------|-------|------|---------|------------|---------------|",
  ...rows.map(
    (r) =>
      `| \`${r.file}\` | ${r.uploadCalls} | ${r.hookUses} | ${r.hasPreview ? "sim" : "não"} | ${r.hasPreparationDialog ? "sim" : "não"} | ${r.usesDownloadUrl ? "sim" : "não"} |`,
  ),
  "",
].join("\n");

mkdirSync("docs", { recursive: true });
writeFileSync("docs/upload-usage-audit.md", markdown);
console.log(markdown);
console.log("\nRelatório escrito em docs/upload-usage-audit.md");
