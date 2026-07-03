"use client";

import type { Feature, FeatureCollection } from "geojson";
import type { StudyAreaGeoJSON } from "@/components/maps/study-area-map";
import { captureMcaMapPreviewForPdf } from "./capture-map-preview-client";

export function polygonToFeatureCollection(
  polygon: StudyAreaGeoJSON | null,
): FeatureCollection | null {
  if (!polygon) return null;
  if (polygon.type === "FeatureCollection") {
    return polygon as unknown as FeatureCollection;
  }
  if (polygon.type === "Feature") {
    return { type: "FeatureCollection", features: [polygon as unknown as Feature] };
  }
  return null;
}

export async function buildMcaPdfMapImageFromState(opts: {
  polygon: StudyAreaGeoJSON | null;
  projectLayers: Record<string, FeatureCollection | null>;
  preferSatellite?: boolean;
}): Promise<{ dataUrl: string; mode: "satellite" | "vector" } | null> {
  const perimFc = polygonToFeatureCollection(opts.polygon);
  const layersClean: Record<string, FeatureCollection> = {};
  for (const [k, v] of Object.entries(opts.projectLayers)) {
    if (v?.features?.length) layersClean[k] = v;
  }
  if (!perimFc && !Object.keys(layersClean).length) return null;

  return captureMcaMapPreviewForPdf({
    perimeter: perimFc,
    layers: layersClean,
    width: 960,
    height: 672,
    preferSatellite: opts.preferSatellite,
  });
}
