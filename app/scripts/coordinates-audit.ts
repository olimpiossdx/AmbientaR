/**
 * Auditoria estática: procura entradas de coordenadas fora do padrão GMS/UTM.
 * Uso: npm run coordinates:audit
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(__dirname, "..", "src");

/** Caminhos relativos a src/ — fluxos cartográficos ou só leitura. */
const IGNORE_PREFIXES = [
  "app/(app)/studies/mapas/",
  "features/mca/",
  "hooks/use-imovel-localizador.ts",
  "components/geospatial/imovel-localizador-panel.tsx",
  "components/georeferenciamento/georef-vertices-import-panel.tsx",
  "lib/geospatial/",
  "lib/georeferenciamento/",
];

type Finding = { file: string; rule: string; detail: string };

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(full);
  }
  return out;
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function ignored(file: string): boolean {
  const r = rel(file);
  return IGNORE_PREFIXES.some((p) => r.startsWith(p) || r === p);
}

function auditFile(file: string): Finding[] {
  const findings: Finding[] = [];
  const content = fs.readFileSync(file, "utf8");
  const r = rel(file);

  if (/value=\{row\.lat1\}/.test(content) && /<Input/.test(content)) {
    findings.push({
      file: r,
      rule: "loose-lat-lon-inputs",
      detail: "Inputs soltos lat1/lon1/lat2/lon2 — use CoordinateStringField + helper inventário",
    });
  }

  if (/const\s+datums\s*=/.test(content) || /const\s+fusos\s*=/.test(content)) {
    findings.push({
      file: r,
      rule: "legacy-datum-fuso-arrays",
      detail: "Arrays locais datums/fusos — usar COORDINATE_*_OPTIONS e CoordinateInput",
    });
  }

  if (
    /name=["'][^"']*\.latitude["']/.test(content) &&
    !content.includes("CoordinateStringField")
  ) {
    findings.push({
      file: r,
      rule: "form-latitude-without-coordinate-field",
      detail: "FormField latitude sem CoordinateStringField",
    });
  }

  if (
    /name=["'][^"']*\.longitude["']/.test(content) &&
    !content.includes("CoordinateStringField")
  ) {
    findings.push({
      file: r,
      rule: "form-longitude-without-coordinate-field",
      detail: "FormField longitude sem CoordinateStringField",
    });
  }

  if (
    /placeholder=["'][^"']*\blat\b/i.test(content) &&
    /<Input/.test(content) &&
    !content.includes("CoordinateStringField") &&
    !content.includes("CoordinateInput")
  ) {
    findings.push({
      file: r,
      rule: "input-placeholder-lat",
      detail: "Input com placeholder de latitude sem componente de coordenadas",
    });
  }

  if (
    /`UTM X:/.test(content) ||
    (/geographicLocation\?\.latLong/.test(content) && /latText/.test(content))
  ) {
    findings.push({
      file: r,
      rule: "inline-geo-display-formatter",
      detail:
        "Formatação manual de geographicLocation — use formatProjectCoordinatesDisplay ou formatEmpreendimentoCoordinatesForReport",
    });
  }

  return findings;
}

function main() {
  console.log("=== coordinates audit (entradas GMS/UTM) ===\n");

  const files = walk(ROOT).filter((f) => !ignored(f));
  const all = files.flatMap(auditFile);

  if (all.length === 0) {
    console.log(`Verificados ${files.length} ficheiros em src/ (${IGNORE_PREFIXES.length} exceções cartográficas).`);
    console.log("\nNenhuma entrada solta encontrada.");
    return;
  }

  for (const f of all) {
    console.error(`FAIL · [${f.rule}] ${f.file}`);
    console.error(`       ${f.detail}`);
  }
  console.error(`\n${all.length} problema(s) encontrado(s).`);
  process.exit(1);
}

main();
