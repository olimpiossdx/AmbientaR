"use client";

import {
  buildWaveACartographicSheets,
  type CartographicBranding,
  type CartographicOverlayRing,
  type CartographicSheetBundle,
  type CartographicSheetMeta,
} from "@/lib/geospatial/cartographic-layout";
import { fetchThematicWfsOverlays } from "@/lib/geospatial/fetch-layer-wfs-for-export";
import { fetchEsriSatelliteSnapshot } from "@/lib/geospatial/satellite-snapshot-client";
import type { GeoInfluenceAreas, WaveAAnalysisResult } from "@/lib/types/geo-wave-a";

export type ResolveCartographicSheetsOptions = {
  propertyName?: string;
  projectAuthor?: string;
  branding?: CartographicBranding;
  meta?: CartographicSheetMeta;
  includeSatelliteBackground?: boolean;
  includeThematicWfs?: boolean;
  influenceAreas?: GeoInfluenceAreas;
};

async function resolveSatelliteHref(
  wave: WaveAAnalysisResult,
  include?: boolean,
): Promise<string | undefined> {
  if (!include) return undefined;
  const bbox =
    wave.influenceAreas?.aii?.bbox ??
    wave.influenceAreas?.aid?.bbox ??
    wave.perimeter.bbox;
  return (await fetchEsriSatelliteSnapshot(bbox)) ?? undefined;
}

async function resolveThematicOverlays(
  wave: WaveAAnalysisResult,
  include?: boolean,
): Promise<Record<string, CartographicOverlayRing[]>> {
  if (!include) return {};
  const out: Record<string, CartographicOverlayRing[]> = {};
  for (const layer of wave.layers) {
    if (layer.status === "unavailable") continue;
    try {
      const rings = await fetchThematicWfsOverlays(layer.layerId, wave.perimeter.bbox);
      if (rings.length) out[layer.layerId] = rings;
    } catch {
      /* camada indisponível no recorte */
    }
  }
  return out;
}

/** Folhas SVG com satélite, WFS temático e áreas de influência (export PDF/PNG/DOCX). */
export async function resolveWaveCartographicSheets(
  wave: WaveAAnalysisResult,
  options?: ResolveCartographicSheetsOptions,
): Promise<CartographicSheetBundle[]> {
  const satelliteHref = await resolveSatelliteHref(wave, options?.includeSatelliteBackground);
  const thematicOverlays = await resolveThematicOverlays(wave, options?.includeThematicWfs);

  return buildWaveACartographicSheets(wave, {
    propertyName: options?.propertyName,
    branding: options?.branding,
    meta: {
      ...options?.meta,
      projectAuthor: options?.projectAuthor ?? options?.meta?.projectAuthor,
    },
    satelliteBackgroundHref: satelliteHref,
    influenceAreas: options?.influenceAreas ?? wave.influenceAreas,
    thematicOverlaysByLayerId: thematicOverlays,
  });
}
