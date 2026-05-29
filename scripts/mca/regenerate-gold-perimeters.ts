/**
 * Regenera public/mca/gold/{id}/perimeter.geojson e layers-import.json a partir de CAD Pimenta.
 * MCA_GOLD_DWG_DIR=E:\refs\pimenta npm run mca:regenerate-gold-perimeters
 */
import fs from "node:fs";
import path from "node:path";
import area from "@turf/area";
import { MCA_GOLD_PRESETS, type McaGoldPresetId } from "../../src/lib/mca/gold-presets";
import {
  extractGoldCadBundle,
  findGoldCadFile,
  ogr2ogrAvailable,
  writeGoldLayersImport,
} from "../../src/lib/mca/gold-cad-import";
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
  const dwgDir = process.env.MCA_GOLD_DWG_DIR?.trim();
  const useOgr = Boolean(dwgDir && ogr2ogrAvailable());
  if (dwgDir && !ogr2ogrAvailable()) {
    console.warn("MCA_GOLD_DWG_DIR definido mas ogr2ogr ausente — sintético escalado.");
  }

  for (const preset of MCA_GOLD_PRESETS) {
    const id = preset.id;
    const targetHa = goldManifestAreaHa(id) ?? Number(preset.areaTotalHa.replace(",", "."));
    let fc = null;
    let cadLayers: Record<string, import("geojson").FeatureCollection> | null = null;

    if (useOgr && dwgDir) {
      const cad = findGoldCadFile(dwgDir, id);
      if (cad) {
        const bundle = extractGoldCadBundle(cad);
        if (bundle?.perimeter?.features?.length) {
          fc = bundle.perimeter;
          fc.features[0].properties = {
            ...(fc.features[0].properties ?? {}),
            source: "mca_gold_cad",
            cadFile: bundle.cadFile,
            goldPreset: id,
          };
          fc = scaleFeatureCollectionToAreaHa(fc, targetHa);
          console.log(`CAD ${bundle.cadFile} · perímetro`);
        } else {
          console.warn(`Sem perímetro em ${cad}`);
        }

        if (bundle?.layers && Object.keys(bundle.layers).length) {
          cadLayers = bundle.layers;
          const out = writeGoldLayersImport(id, cadLayers, {
            cadFile: bundle.cadFile,
            source: "mca_gold_cad",
          });
          console.log(`→ ${out}`);
          summarizeLayers(cadLayers);
        }
      } else {
        console.warn(`CAD não encontrado para ${id} em ${dwgDir}`);
      }
    }

    if (!fc?.features?.length) {
      fc = buildGoldPerimeter(id);
      console.log(`Sintético ${id}`);
    }

    writePerimeter(id, fc);
  }

  console.log("\nDone. Teste: npm run mca:verify-gold-catingueiro");
}

main();
