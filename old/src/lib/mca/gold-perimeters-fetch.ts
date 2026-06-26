/**
 * Perímetros ouro via HTTP (browser-safe — sem node:fs).
 */
import buffer from "@turf/buffer";
import area from "@turf/area";
import centroid from "@turf/centroid";
import { point } from "@turf/helpers";
import transformScale from "@turf/transform-scale";
import type { FeatureCollection } from "geojson";
import type { McaGoldPresetId } from "./gold-presets";
import { getGoldPreset } from "./gold-presets";

const GOLD_PERIMETER_URL: Record<McaGoldPresetId, string> = {
  gold_palmeiras: "/mca/gold/gold_palmeiras/perimeter.geojson",
  gold_mangabeiras: "/mca/gold/gold_mangabeiras/perimeter.geojson",
  gold_catingueiro: "/mca/gold/gold_catingueiro/perimeter.geojson",
};

const GOLD_CENTERS: Record<McaGoldPresetId, [number, number]> = {
  gold_palmeiras: [-46.098, -16.352],
  gold_mangabeiras: [-46.118, -16.378],
  gold_catingueiro: [-46.108, -16.368],
};

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
  const scaled = transformScale(fc, factor, {
    origin: origin.geometry.coordinates as [number, number],
  });
  const feat = scaled.features[0];
  if (feat?.properties) {
    feat.properties.scaledToAreaHa = targetAreaHa;
    feat.properties.areaBeforeScaleHa = currentHa;
  }
  return scaled;
}

function buildSyntheticGoldPerimeter(id: McaGoldPresetId): FeatureCollection {
  const preset = getGoldPreset(id);
  const areaHa = preset ? Number(preset.areaTotalHa.replace(",", ".")) : 1500;
  const [lon, lat] = GOLD_CENTERS[id];
  const rKm = Math.sqrt((areaHa * 10_000) / Math.PI) / 1000;
  const feat = buffer(point([lon, lat]), rKm, { units: "kilometers", steps: 64 });
  if (!feat) return { type: "FeatureCollection", features: [] };
  feat.properties = { goldPreset: id, source: "mca_gold_synthetic", targetAreaHa: areaHa };
  return scaleFeatureCollectionToAreaHa(
    { type: "FeatureCollection", features: [feat] },
    areaHa,
  );
}

/** Carrega perímetro estático (public/) ou fallback sintético — só para cliente. */
export async function fetchGoldPerimeter(id: McaGoldPresetId): Promise<FeatureCollection> {
  try {
    const res = await fetch(GOLD_PERIMETER_URL[id], { cache: "no-store" });
    if (res.ok) {
      let fc = (await res.json()) as FeatureCollection;
      if (fc?.features?.length) {
        const preset = getGoldPreset(id);
        const targetHa = preset ? Number(preset.areaTotalHa.replace(",", ".")) : null;
        if (targetHa) fc = scaleFeatureCollectionToAreaHa(fc, targetHa);
        return fc;
      }
    }
  } catch {
    /* fallback */
  }
  return buildSyntheticGoldPerimeter(id);
}
