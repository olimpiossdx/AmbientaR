import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { FeatureCollection } from "geojson";
import type { McaGoldPresetId } from "./gold-presets";
import {
  mapCadLayerToMcaKey,
  normalizeCadLayerName,
  parseLayersImportPayload,
} from "./layer-import";

export function mergeFeatureCollections(a: FeatureCollection, b: FeatureCollection): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [...(a.features ?? []), ...(b.features ?? [])],
  };
}

export const GOLD_PERIM_LAYER_NAMES = [
  "PERIMETRO",
  "PERÍMETRO",
  "FUND_LIMITE",
  "LIMITE",
  "LIMITE_PROPRIEDADE",
  "0",
];

const GOLD_CAD_ALIASES: Record<McaGoldPresetId, string[]> = {
  gold_catingueiro: ["gold_catingueiro", "catingueiro", "CATINGUEIRO", "celio_catingueiro"],
  gold_palmeiras: ["gold_palmeiras", "palmeiras", "PALMEIRAS"],
  gold_mangabeiras: ["gold_mangabeiras", "mangabeiras", "mangabeira", "MANGABEIRAS"],
};

const QGIS_OGR_CANDIDATES_WIN = [
  "C:\\Program Files\\QGIS 4.0.1\\bin\\ogr2ogr.exe",
  "C:\\Program Files\\QGIS 4.0.0\\bin\\ogr2ogr.exe",
  "C:\\Program Files\\QGIS 3.40.4\\bin\\ogr2ogr.exe",
  "C:\\Program Files\\QGISQT6 3.44.2\\bin\\ogr2ogr.exe",
  "C:\\OSGeo4W64\\bin\\ogr2ogr.exe",
  "C:\\OSGeo4W\\bin\\ogr2ogr.exe",
];

function resolveOgrBin(tool: "ogr2ogr" | "ogrinfo"): string {
  const envKey = tool === "ogr2ogr" ? "MCA_OGR2OGR" : "MCA_OGRINFO";
  const env = process.env[envKey]?.trim();
  if (env && fs.existsSync(env)) return env;

  if (spawnSync(tool, ["--version"], { encoding: "utf8" }).status === 0) return tool;

  for (const ogr of QGIS_OGR_CANDIDATES_WIN) {
    if (!fs.existsSync(ogr)) continue;
    const sibling = path.join(path.dirname(ogr), `${tool}.exe`);
    if (fs.existsSync(sibling)) return sibling;
  }

  return tool;
}

export function buildOgrEnv(): NodeJS.ProcessEnv {
  const qgisRoot =
    process.env.MCA_QGIS_ROOT?.trim() ||
    QGIS_OGR_CANDIDATES_WIN.map((p) => path.dirname(path.dirname(p))).find((p) =>
      fs.existsSync(path.join(p, "share", "gdal")),
    ) ||
    "";
  if (!qgisRoot) return { ...process.env };
  return {
    ...process.env,
    PATH: `${path.join(qgisRoot, "bin")};${process.env.PATH ?? ""}`,
    GDAL_DATA: path.join(qgisRoot, "share", "gdal"),
    PROJ_LIB: path.join(qgisRoot, "share", "proj"),
  };
}

export function runOgrTool(tool: "ogr2ogr" | "ogrinfo", args: string[]): ReturnType<typeof spawnSync> {
  const bin = resolveOgrBin(tool);
  return spawnSync(bin, args, { encoding: "utf8", env: buildOgrEnv() });
}

export function ogr2ogrAvailable(): boolean {
  const bin = resolveOgrBin("ogr2ogr");
  if (bin.endsWith(".exe")) return fs.existsSync(bin);
  return spawnSync(bin, ["--version"], { encoding: "utf8" }).status === 0;
}

function scoreGoldCadCandidate(filePath: string, id: McaGoldPresetId): number {
  const base = path.basename(filePath).toLowerCase();
  const full = filePath.toLowerCase();
  if (base.includes("recover")) return -1000;
  if (base.includes("reloca") || full.includes("reloca")) return -400;
  if (base.includes("reserva") && base.includes("averbad")) return -300;
  if (base.includes("proposta")) return -200;

  let score = 0;
  const aliases = GOLD_CAD_ALIASES[id] ?? [id];
  for (const alias of aliases) {
    if (base.includes(alias.toLowerCase())) score += 40;
  }
  if (base.startsWith("faz.")) score += 15;
  if (full.includes(`${path.sep}documentos${path.sep}`)) score += 10;
  if (full.includes(`${path.sep}licenciamento${path.sep}`)) score += 5;
  try {
    score += Math.min(20, Math.floor(fs.statSync(filePath).size / 500_000));
  } catch {
    /* ignore */
  }
  return score;
}

function walkCadFiles(root: string, depth = 0, maxDepth = 7): string[] {
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
    if (ent.isFile() && /\.(dwg|dxf)$/i.test(ent.name)) out.push(full);
    else if (ent.isDirectory()) out.push(...walkCadFiles(full, depth + 1, maxDepth));
  }
  return out;
}

export function findGoldCadFile(dir: string, id: McaGoldPresetId): string | null {
  const names = GOLD_CAD_ALIASES[id] ?? [id];
  for (const base of names) {
    for (const ext of [".dwg", ".dxf", ".DWG", ".DXF"]) {
      const p = path.join(dir, `${base}${ext}`);
      if (fs.existsSync(p)) return p;
    }
  }
  for (const ext of [".dwg", ".dxf", ".DWG", ".DXF"]) {
    const p = path.join(dir, `${id}${ext}`);
    if (fs.existsSync(p)) return p;
  }

  const candidates = walkCadFiles(dir)
    .map((filePath) => ({ filePath, score: scoreGoldCadCandidate(filePath, id) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.filePath ?? null;
}

function listGpkgLayers(gpkg: string): string[] {
  const info = runOgrTool("ogrinfo", ["-json", gpkg]);
  try {
    const stdout = String(info.stdout ?? "");
    return (JSON.parse(stdout).layers ?? []).map((l: { name: string }) => l.name);
  } catch {
    return [];
  }
}

function layerToGeoJson(gpkg: string, layerName: string, outPath: string): boolean {
  const r = runOgrTool("ogr2ogr", [
    "-f",
    "GeoJSON",
    outPath,
    gpkg,
    layerName,
    "-t_srs",
    "EPSG:4326",
  ]);
  return r.status === 0 && fs.existsSync(outPath);
}

function readGeoJsonFile(filePath: string): FeatureCollection | null {
  try {
    const fc = JSON.parse(fs.readFileSync(filePath, "utf8")) as FeatureCollection;
    return fc?.features?.length ? fc : null;
  } catch {
    return null;
  }
}

export function cadToGpkg(cadPath: string, gpkgPath: string): boolean {
  const r = runOgrTool("ogr2ogr", [
    "-f",
    "GPKG",
    gpkgPath,
    cadPath,
    "-t_srs",
    "EPSG:4326",
    "-skipfailures",
  ]);
  return r.status === 0 && fs.existsSync(gpkgPath);
}

export function extractPerimeterFromGpkg(
  gpkg: string,
  tmpDir: string,
): FeatureCollection | null {
  const layerNames = listGpkgLayers(gpkg);
  const pick =
    layerNames.find((n) =>
      GOLD_PERIM_LAYER_NAMES.includes(normalizeCadLayerName(n)),
    ) ?? layerNames[0];
  if (!pick) return null;

  const geoPath = path.join(tmpDir, "perim.geojson");
  if (!layerToGeoJson(gpkg, pick, geoPath)) return null;
  return readGeoJsonFile(geoPath);
}

/** Todas as layers CAD → chaves MCA (merge por layerKey). */
export function extractMcaLayersFromGpkg(gpkg: string, tmpDir: string): Record<string, FeatureCollection> {
  const out: Record<string, FeatureCollection> = {};
  for (const layerName of listGpkgLayers(gpkg)) {
    if (GOLD_PERIM_LAYER_NAMES.includes(normalizeCadLayerName(layerName))) continue;

    const geoPath = path.join(tmpDir, `layer-${normalizeCadLayerName(layerName)}.geojson`);
    if (!layerToGeoJson(gpkg, layerName, geoPath)) continue;
    const fc = readGeoJsonFile(geoPath);
    if (!fc) continue;

    const key = mapCadLayerToMcaKey(layerName) ?? normalizeCadLayerName(layerName);
    out[key] = out[key] ? mergeFeatureCollections(out[key], fc) : fc;
  }
  return out;
}

export type GoldCadExtractResult = {
  cadFile: string;
  perimeter: FeatureCollection | null;
  layers: Record<string, FeatureCollection>;
};

export function extractGoldCadBundle(cadPath: string): GoldCadExtractResult | null {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mca-gold-cad-"));
  try {
    const gpkg = path.join(tmp, "cad.gpkg");
    if (!cadToGpkg(cadPath, gpkg)) return null;
    return {
      cadFile: path.basename(cadPath),
      perimeter: extractPerimeterFromGpkg(gpkg, tmp),
      layers: extractMcaLayersFromGpkg(gpkg, tmp),
    };
  } finally {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

export function loadGoldLayersFromRepo(id: McaGoldPresetId): Record<string, FeatureCollection> | null {
  const filePath = path.join(process.cwd(), "public/mca/gold", id, "layers-import.json");
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const layers = parseLayersImportPayload(raw);
    return Object.keys(layers).length ? layers : null;
  } catch {
    return null;
  }
}

export function writeGoldLayersImport(
  id: McaGoldPresetId,
  layers: Record<string, FeatureCollection>,
  meta?: { cadFile?: string; source?: string },
): string {
  const outDir = path.join(process.cwd(), "public/mca/gold", id);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "layers-import.json");
  const cadLayers: Record<string, FeatureCollection> = {};
  for (const [key, fc] of Object.entries(layers)) {
    if (fc?.features?.length) cadLayers[key] = fc;
  }
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        description: `Layers ouro ${id} importadas de CAD Pimenta`,
        source: meta?.source ?? "mca_gold_cad",
        cadFile: meta?.cadFile,
        layers: cadLayers,
      },
      null,
      2,
    ),
  );
  return out;
}
