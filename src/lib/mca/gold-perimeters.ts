import buffer from "@turf/buffer";
import area from "@turf/area";
import { point } from "@turf/helpers";
import type { FeatureCollection } from "geojson";
import type { McaGoldPresetId } from "./gold-presets";
import { getGoldPreset } from "./gold-presets";

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

/**
 * Perímetro circular sintético com área próxima do manifest ouro (testes E05/E15).
 * Substituir por `perimeter.geojson` real quando disponível no repo.
 */
export function buildGoldPerimeter(id: McaGoldPresetId): FeatureCollection {
  const preset = getGoldPreset(id);
  const areaHa = preset
    ? Number(preset.areaTotalHa.replace(",", "."))
    : 1500;
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
  const fc: FeatureCollection = { type: "FeatureCollection", features: [feat] };
  const actualHa = area(fc) / 10_000;
  if (feat.properties && Math.abs(actualHa - areaHa) / areaHa > 0.02) {
    feat.properties.areaNote = `área real ${actualHa.toFixed(2)} ha`;
  }
  return fc;
}

export function goldPerimeterAreaHa(id: McaGoldPresetId): number {
  return area(buildGoldPerimeter(id)) / 10_000;
}

/** Carrega perímetro estático do repo (public/) ou fallback sintético. */
export async function fetchGoldPerimeter(id: McaGoldPresetId): Promise<FeatureCollection> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(GOLD_PERIMETER_URL[id], { cache: "no-store" });
      if (res.ok) {
        const fc = (await res.json()) as FeatureCollection;
        if (fc?.features?.length) return fc;
      }
    } catch {
      /* fallback */
    }
  }
  return buildGoldPerimeter(id);
}
