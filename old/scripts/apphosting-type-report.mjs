import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const AREAS = [
  ["Financeiro", /src[\\/](app)[\\/]\(app\)[\\/]financial|src[\\/]lib[\\/]financial/i],
  ["Propostas e Contratos", /src[\\/](app)[\\/]\(app\)[\\/](proposals|commercial-proposals|contracts|contracts-suppliers)/i],
  ["Uploads e Storage", /upload|storage|attachment-preview|use-storage-file-upload|upload-preparation/i],
  ["Georreferenciamento", /georeferenciamento|geospatial|study-maps|mapas/i],
  ["IA e Genkit", /ai-lab|genkit|deepseek|src[\\/]ai/i],
  ["Cadastro, Clientes e Fornecedores", /clients|empreendedores|projects|suppliers|fornecedores|responsible-company|technical-responsible/i],
  ["Estudos e Processos", /studies|requests|licenses|outorgas|inventarios|intervencoes|fauna|car/i],
];

const result = spawnSync("npx", ["tsc", "--noEmit", "--pretty", "false"], {
  encoding: "utf8",
  shell: process.platform === "win32",
  maxBuffer: 80 * 1024 * 1024,
});

const lines = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
  .split(/\r?\n/)
  .filter(Boolean);

const buckets = new Map(AREAS.map(([name]) => [name, []]));
buckets.set("Outros", []);

for (const line of lines) {
  const area = AREAS.find(([, pattern]) => pattern.test(line))?.[0] ?? "Outros";
  buckets.get(area).push(line);
}

const totalErrors = lines.filter((line) => /error TS\d+/.test(line)).length;
const sections = [];

for (const [area, entries] of buckets) {
  if (entries.length === 0) continue;
  sections.push(`## ${area}\n`);
  sections.push(`Total de linhas: ${entries.length}\n`);
  sections.push("```text");
  sections.push(entries.slice(0, 80).join("\n"));
  if (entries.length > 80) {
    sections.push(`... (${entries.length - 80} linhas adicionais)`);
  }
  sections.push("```\n");
}

const markdown = [
  "# Auditoria App Hosting / TypeScript",
  "",
  `Gerado em: ${new Date().toISOString()}`,
  `Status do tsc: ${result.status}`,
  `Total aproximado de erros TypeScript: ${totalErrors}`,
  "",
  "Este relatório agrupa os erros por área para orientar a limpeza menu por menu.",
  "",
  ...sections,
].join("\n");

mkdirSync("docs", { recursive: true });
writeFileSync("docs/apphosting-build-audit.md", markdown);
console.log(markdown);
console.log("\nRelatório escrito em docs/apphosting-build-audit.md");

process.exit(result.status ?? 0);
