/**
 * Regenera public/mca/gold/{id}/perimeter.geojson e layers-import.json a partir de CAD Pimenta.
 * MCA_GOLD_DWG_DIR=E:\refs\pimenta npm run mca:regenerate-gold-perimeters
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import area from "@turf/area";
import { MCA_GOLD_PRESETS, type McaGoldPresetId } from "../../src/lib/mca/gold-presets";
import {
  extractGoldCadBundle,
  findGoldCadFile,
  ogr2ogrAvailable,
  writeGoldLayersImport,
} from "../../src/lib/mca/gold-cad-import";
import { importGoldFromShapefiles, tagGoldFeatures } from "../../src/lib/mca/gold-shp-import";
import {
  buildGoldPerimeter,
  scaleFeatureCollectionToAreaHa,
} from "../../src/lib/mca/gold-perimeters";
import { goldManifestAreaHa } from "../../src/lib/mca/gold-manifest";

function writePerimeter(id: McaGoldPresetId, fc: ReturnType<typeof buildGoldPerimeter>) {
  const outDir = path.join(process.cwd(), "public/mca/gold", id);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "perimeter.geojson");
  fs.writeFileSync(out, JSON.stringify(fc, null, 2));
  const ha = area(fc) / 10_000;
  const target = goldManifestAreaHa(id);
  const delta =
    target != null ? `${(((ha - target) / target) * 100).toFixed(2)}% vs manifest` : "—";
  console.log(`→ ${out} · ${ha.toFixed(2)} ha (${delta})`);
}

function summarizeLayers(layers: Record<string, unknown>): void {
  const keys = Object.keys(layers);
  if (!keys.length) return;
  const counts = keys
    .map((k) => {
      const fc = layers[k] as { features?: unknown[] };
      return `${k}:${fc?.features?.length ?? 0}`;
    })
    .join(", ");
  console.log(`  layers: ${counts}`);
}

function main() {
  const dataDir = (process.env.MCA_GOLD_DATA_DIR ?? process.env.MCA_GOLD_DWG_DIR)?.trim();
  const useOgr = Boolean(dataDir && ogr2ogrAvailable());
  if (dataDir && !ogr2ogrAvailable()) {
    console.warn("MCA_GOLD_DATA_DIR definido mas ogr2ogr ausente — sintético escalado.");
  }

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mca-gold-import-"));

  for (const preset of MCA_GOLD_PRESETS) {
    const id = preset.id;
    const targetHa = goldManifestAreaHa(id) ?? Number(preset.areaTotalHa.replace(",", "."));
    let fc = null;
    let cadLayers: Record<string, import("geojson").FeatureCollection> | null = null;
    let source = "mca_gold_synthetic";

    if (useOgr && dataDir) {
      const cad = findGoldCadFile(dataDir, id);
      if (cad) {
        const bundle = extractGoldCadBundle(cad);
        if (bundle?.perimeter?.features?.length) {
          fc = bundle.perimeter;
          source = "mca_gold_cad";
          console.log(`CAD ${bundle.cadFile} · perímetro`);
        } else {
          console.warn(`CAD sem perímetro (${path.basename(cad)}) — tentando shapefiles…`);
        }
        if (bundle?.layers && Object.keys(bundle.layers).length) {
          cadLayers = bundle.layers;
        }
      }

      if (!fc?.features?.length || !cadLayers || !Object.keys(cadLayers).length) {
        const shp = importGoldFromShapefiles(dataDir, id, tmpRoot);
        if (shp?.perimeter?.features?.length) {
          fc = shp.perimeter;
          source = "mca_gold_shp";
          console.log(`SHP ${shp.shpFiles} ficheiro(s) · perímetro`);
        }
        if (shp?.layers && Object.keys(shp.layers).length) {
          cadLayers = { ...(cadLayers ?? {}), ...shp.layers };
          console.log(`SHP layers: ${Object.keys(shp.layers).join(", ")}`);
        }
      }

      if (fc?.features?.length) {
        fc = tagGoldFeatures(fc, { source, goldPreset: id });
        fc = scaleFeatureCollectionToAreaHa(fc, targetHa);
      }

      if (cadLayers && Object.keys(cadLayers).length) {
        const out = writeGoldLayersImport(id, cadLayers, { source });
        console.log(`→ ${out}`);
        summarizeLayers(cadLayers);
      }
    }

    if (!fc?.features?.length) {
      fc = buildGoldPerimeter(id);
      console.log(`Sintético ${id}`);
    }

    writePerimeter(id, fc);
  }

  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  console.log("\nDone. Teste: npm run mca:verify-gold-catingueiro");
}

main();
