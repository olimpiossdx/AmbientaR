/**
 * Resolvedor unificado de camadas SIG (MG + federal + ICMBio + MMA).
 */

import { SIG_MG_ALL_LAYERS } from "@/lib/geospatial/wave-a-catalog";
import { resolveFederalLayersForBbox } from "@/lib/geospatial/wave-federal-catalog";
import { ICMBIO_LAYERS } from "@/lib/geospatial/wave-icmbio-catalog";
import { MMA_LAYERS } from "@/lib/geospatial/wave-mma-catalog";
import { resolveMapcarAppTypeNamesForBbox } from "@/lib/geospatial/mapcar-app-layers";
import { resolveSocioambientalLayersForBbox } from "@/lib/geospatial/wave-socioambiental-catalog";
import type { WaveACatalogEntry } from "@/lib/geospatial/wave-a-catalog";

function patchLayerTypeNamesForBbox(
  entry: WaveACatalogEntry,
  bbox: [number, number, number, number],
): WaveACatalogEntry {
  if (entry.layerId === "mg_app_hidrica_mapcar") {
    return {
      ...entry,
      typeNames: resolveMapcarAppTypeNamesForBbox(bbox),
    };
  }
  return entry;
}

export function resolveAllLayersForBbox(
  bbox: [number, number, number, number],
): WaveACatalogEntry[] {
  const federal = resolveFederalLayersForBbox(bbox);
  const seen = new Set<string>();
  const out: WaveACatalogEntry[] = [];

  const socioambiental = resolveSocioambientalLayersForBbox(bbox);

  for (const entry of [
    ...SIG_MG_ALL_LAYERS,
    ...federal,
    ...ICMBIO_LAYERS,
    ...MMA_LAYERS,
    ...socioambiental,
  ]) {
    if (seen.has(entry.layerId)) continue;
    seen.add(entry.layerId);
    out.push(patchLayerTypeNamesForBbox(entry, bbox));
  }

  return out;
}

/** Contagem dinâmica (SICAR por UF + camadas estáticas + MG + ICMBio + MMA). */
export function countAllLayersForBbox(
  bbox: [number, number, number, number],
): number {
  return resolveAllLayersForBbox(bbox).length;
}

/** Bbox MG continental — contagem de referência na UI. */
export const GEO_ALL_LAYER_COUNT = countAllLayersForBbox([
  -51.13, -22.92, -36.03, -14.23,
]);
