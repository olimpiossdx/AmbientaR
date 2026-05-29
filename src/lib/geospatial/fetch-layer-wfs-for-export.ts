import type { Feature, Geometry } from "geojson";
import { expandBbox } from "@/lib/geospatial/perimeter";
import { fetchArcGisFeaturesInBbox } from "@/lib/geospatial/arcgis-feature-client";
import { fetchWfsFeaturesInBbox } from "@/lib/geospatial/wfs-client";import type { CartographicOverlayRing } from "@/lib/geospatial/cartographic-layout";
import { resolveFederalLayersForBbox } from "@/lib/geospatial/wave-federal-catalog";
import { isEmbargosLayer, isProdesLayer } from "@/lib/geospatial/ibama-embargos";
import {
  FEDERAL_TI_LAYER_ID,
  FEDERAL_UC_LAYER_ID,
} from "@/lib/geospatial/wave-federal-catalog";
import { SIG_MG_ALL_LAYERS, type WaveACatalogEntry } from "@/lib/geospatial/wave-a-catalog";

const ALL_WAVE_CATALOG: WaveACatalogEntry[] = [
  ...SIG_MG_ALL_LAYERS,
  ...resolveFederalLayersForBbox([-51.13, -22.92, -36.03, -14.23]),
];

const THEMATIC_PALETTE = [
  "#86efac",
  "#7dd3fc",
  "#f59e0b",
  "#c41e3a",
  "#1e3a8a",
  "#a78bfa",
  "#94a3b8",
];

export function findWaveCatalogEntry(layerId: string): WaveACatalogEntry | undefined {
  return ALL_WAVE_CATALOG.find((e) => e.layerId === layerId);
}

function ringFromGeometry(geometry: Geometry): [number, number][] | null {
  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates[0];
    return ring?.length ? (ring as [number, number][]) : null;
  }
  if (geometry.type === "MultiPolygon") {
    const ring = geometry.coordinates[0]?.[0];
    return ring?.length ? (ring as [number, number][]) : null;
  }
  if (geometry.type === "LineString") {
    return geometry.coordinates as [number, number][];
  }
  if (geometry.type === "MultiLineString") {
    return geometry.coordinates[0] as [number, number][] | undefined ?? null;
  }
  if (geometry.type === "Point") {
    const [x, y] = geometry.coordinates;
    const d = 0.0008;
    return [
      [x - d, y - d],
      [x + d, y - d],
      [x + d, y + d],
      [x - d, y + d],
      [x - d, y - d],
    ];
  }
  return null;
}

function colorForFeature(index: number, geometryKind: WaveACatalogEntry["geometryKind"]): {
  stroke: string;
  fill: string;
  fillOpacity: number;
  strokeWidth: number;
  dashArray?: string;
} {
  const stroke = THEMATIC_PALETTE[index % THEMATIC_PALETTE.length]!;
  if (geometryKind === "line") {
    return { stroke, fill: "none", fillOpacity: 0, strokeWidth: 2, dashArray: "4 3" };
  }
  if (geometryKind === "point") {
    return { stroke: "#0f172a", fill: stroke, fillOpacity: 0.85, strokeWidth: 1.2 };
  }
  return { stroke, fill: stroke, fillOpacity: 0.28, strokeWidth: 1.2 };
}

function featuresToOverlayRings(
  features: Feature[],
  entry: WaveACatalogEntry,
): CartographicOverlayRing[] {
  const rings: CartographicOverlayRing[] = [];
  const limit = Math.min(features.length, 48);
  for (let i = 0; i < limit; i++) {
    const f = features[i]!;
    if (!f.geometry) continue;
    const ring = ringFromGeometry(f.geometry);
    if (!ring?.length) continue;
    const style = isEmbargosLayer(entry.layerId)
      ? { stroke: "#b91c1c", fill: "#ef4444", fillOpacity: 0.35, strokeWidth: 1.4 }
      : entry.layerId === FEDERAL_UC_LAYER_ID
        ? { stroke: "#15803d", fill: "#22c55e", fillOpacity: 0.28, strokeWidth: 1.2 }
        : entry.layerId === FEDERAL_TI_LAYER_ID
          ? { stroke: "#7c3aed", fill: "#a78bfa", fillOpacity: 0.22, strokeWidth: 1.2 }
          : isProdesLayer(entry.layerId)
            ? { stroke: "#c2410c", fill: "#fb923c", fillOpacity: 0.3, strokeWidth: 1.2 }
            : colorForFeature(i, entry.geometryKind);
    rings.push({ ring, ...style });
  }
  return rings;
}

/** Reconsulta WFS da camada SIG para desenho temático no mapa principal. */
export async function fetchThematicWfsOverlays(
  layerId: string,
  perimeterBbox: [number, number, number, number],
): Promise<CartographicOverlayRing[]> {
  const entry = findWaveCatalogEntry(layerId);
  if (!entry) return [];

  const margin = entry.bboxMarginDegrees ?? (entry.geometryKind === "point" ? 0.05 : 0.02);
  const expanded = expandBbox(perimeterBbox, margin);

  const wfs = entry.arcgisLayerUrl
    ? await fetchArcGisFeaturesInBbox({
        layerUrl: entry.arcgisLayerUrl,
        bbox: expanded,
        maxFeatures: entry.maxWfsFeatures ?? 120,
      })
    : await fetchWfsFeaturesInBbox({
        baseUrls: entry.wfsBaseUrls,
        typeNames: entry.typeNames,
        bbox: expanded,
        maxFeatures: entry.maxWfsFeatures ?? 120,
      });
  if (!wfs.ok || !wfs.features.length) return [];
  return featuresToOverlayRings(wfs.features, entry);
}
