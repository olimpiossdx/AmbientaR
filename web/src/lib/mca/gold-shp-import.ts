import fs from "node:fs";
import path from "node:path";
import type { Feature, FeatureCollection } from "geojson";
import type { McaGoldPresetId } from "./gold-presets";
import { mergeFeatureCollections, ogr2ogrAvailable, runOgrTool } from "./gold-cad-import";

function shpToFc(shpPath: string, tmpDir: string): FeatureCollection | null {
  const out = path.join(tmpDir, `${path.basename(shpPath, ".shp")}.geojson`);
  const r = runOgrTool("ogr2ogr", [
    "-f",
    "GeoJSON",
    out,
    shpPath,
    "-t_srs",
    "EPSG:4326",
  ]);
  if (r.status !== 0 || !fs.existsSync(out)) return null;
  try {
    const fc = JSON.parse(fs.readFileSync(out, "utf8")) as FeatureCollection;
    return fc?.features?.length ? fc : null;
  } catch {
    return null;
  }
}

const SHP_FOLDER_HINTS: Record<McaGoldPresetId, string[]> = {
  gold_catingueiro: ["catingueiro"],
  gold_palmeiras: ["palmeiras"],
  gold_mangabeiras: ["mangabeira", "mangabeiras"],
};

const SHP_LAYER_MAP: Record<string, string> = {
  POL_PROP: "FUND_LIMITE",
  POL_RL: "AMB_RL_GLEBA",
  POL_RLC: "AMB_RL_GLEBA",
  POL_APP: "AMB_APP",
  POL_HIDRO: "HYD_CORREGO",
  POL_IA: "AMB_APP",
  PTO_SEDE: "INFRA_SEDE",
  PIVO: "USO_PIVO",
  PIVOT: "USO_PIVO",
  LAVOURA: "USO_LAVOURA",
  SILOS: "INFRA_SILOS",
};

function mapShpBaseName(base: string): string {
  const key = base.replace(/\s*\(.*\)$/i, "").trim().toUpperCase();
  return SHP_LAYER_MAP[key] ?? key;
}

function walkShpFiles(root: string, depth = 0, maxDepth = 8): string[] {
  if (depth > maxDepth) return [];
  const out: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(root, ent.name);
    if (ent.isFile() && ent.name.toLowerCase().endsWith(".shp")) out.push(full);
    else if (ent.isDirectory()) out.push(...walkShpFiles(full, depth + 1, maxDepth));
  }
  return out;
}

const PRIMARY_SHP_SUBPATHS: Record<McaGoldPresetId, string[]> = {
  gold_catingueiro: ["Faz. Catingueiro\\Documentos", "Faz. Catingueiro"],
  gold_palmeiras: ["Faz. Palmeiras"],
  gold_mangabeiras: [
    "Documentos arquivados\\Faz. Mangabeira\\Documentos",
    "Faz. Mangabeiras",
    "Faz. Mangabeira",
  ],
};

function scoreShpRoot(dir: string, id: McaGoldPresetId): number {
  const lower = dir.toLowerCase();
  const hints = SHP_FOLDER_HINTS[id] ?? [];
  let score = 0;
  for (const h of hints) {
    if (lower.includes(h)) score += 10;
  }
  if (lower.includes("documentos")) score += 3;
  if (lower.includes("arquivados")) score -= 8;
  if (lower.includes("reloca")) score -= 12;
  if (lower.includes("\\sei")) score -= 6;
  return score;
}

export function findGoldShpRoots(dataDir: string, id: McaGoldPresetId): string[] {
  const roots: { path: string; score: number }[] = [];

  for (const sub of PRIMARY_SHP_SUBPATHS[id] ?? []) {
    const p = path.join(dataDir, sub);
    if (fs.existsSync(p)) roots.push({ path: p, score: 100 });
  }

  const walk = (p: string, depth: number) => {
    if (depth > 6) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(p, { withFileTypes: true });
    } catch {
      return;
    }
    const s = scoreShpRoot(p, id);
    if (s >= 10) roots.push({ path: p, score: s });
    for (const ent of entries) {
      if (ent.isDirectory()) walk(path.join(p, ent.name), depth + 1);
    }
  };
  walk(dataDir, 0);

  const seen = new Set<string>();
  return roots
    .sort((a, b) => b.score - a.score)
    .map((r) => r.path)
    .filter((p) => {
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    });
}

export type GoldShpImportResult = {
  perimeter: FeatureCollection | null;
  layers: Record<string, FeatureCollection>;
  shpFiles: number;
};

export function importGoldFromShapefiles(
  dataDir: string,
  id: McaGoldPresetId,
  tmpDir: string,
): GoldShpImportResult | null {
  if (!ogr2ogrAvailable()) return null;

  const roots = findGoldShpRoots(dataDir, id);
  if (!roots.length) return null;

  const layers: Record<string, FeatureCollection> = {};
  let perimeter: FeatureCollection | null = null;
  let shpCount = 0;

  for (const root of roots.slice(0, 12)) {
    for (const shp of walkShpFiles(root)) {
      const fc = shpToFc(shp, tmpDir);
      if (!fc) continue;
      shpCount++;
      const base = path.basename(shp, ".shp");
      const mcaKey = mapShpBaseName(base);

      if (mcaKey === "FUND_LIMITE" || base.toUpperCase() === "POL_PROP") {
        perimeter = perimeter ? mergeFeatureCollections(perimeter, fc) : fc;
        layers.FUND_LIMITE = layers.FUND_LIMITE
          ? mergeFeatureCollections(layers.FUND_LIMITE, fc)
          : fc;
        continue;
      }

      layers[mcaKey] = layers[mcaKey] ? mergeFeatureCollections(layers[mcaKey], fc) : fc;
    }
  }

  if (!perimeter?.features?.length && !Object.keys(layers).length) return null;
  return { perimeter, layers, shpFiles: shpCount };
}

export function tagGoldFeatures(
  fc: FeatureCollection,
  meta: Record<string, unknown>,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: fc.features.map((f) => ({
      ...f,
      properties: { ...(f.properties ?? {}), ...meta },
    })) as Feature[],
  };
}
