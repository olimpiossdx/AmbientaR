import fs from "node:fs";
import path from "node:path";
import buffer from "@turf/buffer";
import area from "@turf/area";
import centroid from "@turf/centroid";
import { point } from "@turf/helpers";
import transformScale from "@turf/transform-scale";
import type { FeatureCollection } from "geojson";
import type { McaGoldPresetId } from "./gold-presets";
import { getGoldPreset } from "./gold-presets";
import { goldManifestAreaHa } from "./gold-manifest";

const GOLD_PERIMETER_URL: Record<McaGoldPresetId, string> = {
  gold_palmeiras: "/mca/gold/gold_palmeiras/perimeter.geojson",
  gold_mangabeiras: "/mca/gold/gold_mangabeiras/perimeter.geojson",
  gold_catingueiro: "/mca/gold/gold_catingueiro/perimeter.geojson",
};

/** Centros aproximados (Unaí-MG) para perímetros de teste alinhados aos mapas ouro. */
const GOLD_CENTERS: Record<McaGoldPresetId, [number, number]> = {
  gold_palmeiras: [-46.098, -16.352],
  gold_mangabeiras: [-46.118, -16.378],
  gold_catingueiro: [-46.108, -16.368],
};

/** Escala uniforme em torno do centróide até bater a área-alvo (ha). */
export function scaleFeatureCollectionToAreaHa(
  fc: FeatureCollection,
  targetAreaHa: number,
): FeatureCollection {
  const currentHa = area(fc) / 10_000;
  if (currentHa <= 0 || targetAreaHa <= 0) return fc;
  const relErr = Math.abs(currentHa - targetAreaHa) / targetAreaHa;
  if (relErr < 0.005) return fc;
  const factor = Math.sqrt(targetAreaHa / currentHa);
  const origin = centroid(fc);
  const scaled = transformScale(fc, factor, { origin: origin.geometry.coordinates as [number, number] });
  const feat = scaled.features[0];
  if (feat?.properties) {
    feat.properties.scaledToAreaHa = targetAreaHa;
    feat.properties.areaBeforeScaleHa = currentHa;
  }
  return scaled;
}

/**
 * Perímetro circular sintético com área próxima do manifest ouro (testes E05/E15).
 * Substituir por `perimeter.geojson` real quando disponível no repo.
 */
export function buildGoldPerimeter(id: McaGoldPresetId): FeatureCollection {
  const preset = getGoldPreset(id);
  const areaHa =
    goldManifestAreaHa(id) ??
    (preset ? Number(preset.areaTotalHa.replace(",", ".")) : 1500);
  const [lon, lat] = GOLD_CENTERS[id];
  const rKm = Math.sqrt((areaHa * 10_000) / Math.PI) / 1000;
  const feat = buffer(point([lon, lat]), rKm, { units: "kilometers", steps: 64 });
  if (!feat) {
    return { type: "FeatureCollection", features: [] };
  }
  feat.properties = {
    goldPreset: id,
    source: "mca_gold_synthetic",
    targetAreaHa: areaHa,
  };
  let fc: FeatureCollection = { type: "FeatureCollection", features: [feat] };
  fc = scaleFeatureCollectionToAreaHa(fc, areaHa);
  const actualHa = area(fc) / 10_000;
  const main = fc.features[0];
  if (main?.properties && Math.abs(actualHa - areaHa) / areaHa > 0.01) {
    main.properties.areaNote = `área real ${actualHa.toFixed(2)} ha`;
  }
  return fc;
}

export function goldPerimeterAreaHa(id: McaGoldPresetId): number {
  return area(buildGoldPerimeter(id)) / 10_000;
}

export function loadGoldPerimeterFromRepo(id: McaGoldPresetId): FeatureCollection {
  const targetHa = goldManifestAreaHa(id);
  try {
    const filePath = path.join(process.cwd(), "public/mca/gold", id, "perimeter.geojson");
    if (fs.existsSync(filePath)) {
      const fc = JSON.parse(fs.readFileSync(filePath, "utf8")) as FeatureCollection;
      if (fc?.features?.length) {
        if (targetHa != null) {
          return scaleFeatureCollectionToAreaHa(fc, targetHa);
        }
        return fc;
      }
    }
  } catch {
    /* fallback sintético */
  }
  return buildGoldPerimeter(id);
}

/** Browser: use `gold-perimeters-fetch`. Servidor: repo ou sintético. */
export async function fetchGoldPerimeter(id: McaGoldPresetId): Promise<FeatureCollection> {
  if (typeof window !== "undefined") {
    const { fetchGoldPerimeter: fetchClient } = await import("./gold-perimeters-fetch");
    return fetchClient(id);
  }
  return loadGoldPerimeterFromRepo(id);
}
