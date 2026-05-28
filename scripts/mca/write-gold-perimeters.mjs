#!/usr/bin/env node
/**
 * Gera public/mca/gold/.../perimeter.geojson
 * npm run mca:write-gold-perimeters
 * Com DWG Pimenta: MCA_GOLD_DWG_DIR=E:\refs\pimenta npm run mca:write-gold-perimeters
 * (ficheiros gold_palmeiras.dwg, gold_mangabeiras.dwg, gold_catingueiro.dxf na pasta)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const dwgDir = process.env.MCA_GOLD_DWG_DIR?.trim();

const presets = [
  { id: "gold_palmeiras", areaHa: 1747.9104, lon: -46.098, lat: -16.352 },
  { id: "gold_mangabeiras", areaHa: 1125.4836, lon: -46.118, lat: -16.378 },
  { id: "gold_catingueiro", areaHa: 2073.8318, lon: -46.108, lat: -16.368 },
];

const PERIM_LAYER_NAMES = [
  "PERIMETRO",
  "PERÍMETRO",
  "FUND_LIMITE",
  "LIMITE",
  "LIMITE_PROPRIEDADE",
  "0",
];

function ogrAvailable() {
  return spawnSync("ogr2ogr", ["--version"], { encoding: "utf8" }).status === 0;
}

function findCadFile(dir, id) {
  for (const ext of [".dwg", ".dxf", ".DWG", ".DXF"]) {
    const p = path.join(dir, `${id}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function extractPerimeterFromCad(cadPath, tmpDir) {
  const gpkg = path.join(tmpDir, "cad.gpkg");
  const r = spawnSync(
    "ogr2ogr",
    ["-f", "GPKG", gpkg, cadPath, "-t_srs", "EPSG:4326", "-skipfailures"],
    { encoding: "utf8" },
  );
  if (r.status !== 0 || !fs.existsSync(gpkg)) return null;

  const info = spawnSync("ogrinfo", ["-json", gpkg], { encoding: "utf8" });
  let layerNames = [];
  try {
    layerNames = (JSON.parse(info.stdout).layers ?? []).map((l) => l.name);
  } catch {
    return null;
  }

  const pick =
    layerNames.find((n) => PERIM_LAYER_NAMES.includes(n.toUpperCase().replace(/\s/g, "_"))) ??
    layerNames[0];
  if (!pick) return null;

  const geoPath = path.join(tmpDir, "perim.geojson");
  const r2 = spawnSync(
    "ogr2ogr",
    ["-f", "GeoJSON", geoPath, gpkg, pick, "-t_srs", "EPSG:4326"],
    { encoding: "utf8" },
  );
  if (r2.status !== 0 || !fs.existsSync(geoPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(geoPath, "utf8"));
  } catch {
    return null;
  }
}

function circlePolygon(lon, lat, areaHa, steps = 64) {
  const rDeg = Math.sqrt((areaHa * 10_000) / Math.PI) / 111_320;
  const ring = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    ring.push([lon + rDeg * Math.cos(a), lat + rDeg * Math.sin(a) * 1.2]);
  }
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { source: "mca_gold_synthetic", targetAreaHa: areaHa },
        geometry: { type: "Polygon", coordinates: [ring] },
      },
    ],
  };
}

const useOgr = dwgDir && ogrAvailable();
if (dwgDir && !ogrAvailable()) {
  console.warn("MCA_GOLD_DWG_DIR definido mas ogr2ogr ausente — círculos sintéticos.");
}

for (const p of presets) {
  const dir = path.join(root, "public/mca/gold", p.id);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "perimeter.geojson");
  let fc = null;

  if (useOgr) {
    const cad = findCadFile(dwgDir, p.id);
    if (cad) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mca-gold-"));
      fc = extractPerimeterFromCad(cad, tmp);
      try {
        fs.rmSync(tmp, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
      if (fc?.features?.length) {
        fc.features[0].properties = {
          ...(fc.features[0].properties ?? {}),
          source: "mca_gold_cad",
          cadFile: path.basename(cad),
        };
        console.log(`CAD ${path.basename(cad)} → ${out}`);
      } else {
        console.warn(`Sem perímetro em ${cad} — sintético.`);
      }
    }
  }

  if (!fc?.features?.length) {
    fc = circlePolygon(p.lon, p.lat, p.areaHa);
    console.log(`Sintético → ${out}`);
  }

  fs.writeFileSync(out, JSON.stringify(fc, null, 2));
}

console.log("Done. Perímetros em /mca/gold/{id}/perimeter.geojson");
