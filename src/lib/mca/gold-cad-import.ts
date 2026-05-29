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

function mergeFeatureCollections(a: FeatureCollection, b: FeatureCollection): FeatureCollection {
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

export function ogr2ogrAvailable(): boolean {
  return spawnSync("ogr2ogr", ["--version"], { encoding: "utf8" }).status === 0;
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
  return null;
}

function listGpkgLayers(gpkg: string): string[] {
  const info = spawnSync("ogrinfo", ["-json", gpkg], { encoding: "utf8" });
  try {
    return (JSON.parse(info.stdout).layers ?? []).map((l: { name: string }) => l.name);
  } catch {
    return [];
  }
}

function layerToGeoJson(gpkg: string, layerName: string, outPath: string): boolean {
  const r = spawnSync(
    "ogr2ogr",
    ["-f", "GeoJSON", outPath, gpkg, layerName, "-t_srs", "EPSG:4326"],
    { encoding: "utf8" },
  );
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
  const r = spawnSync(
    "ogr2ogr",
    ["-f", "GPKG", gpkgPath, cadPath, "-t_srs", "EPSG:4326", "-skipfailures"],
    { encoding: "utf8" },
  );
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
