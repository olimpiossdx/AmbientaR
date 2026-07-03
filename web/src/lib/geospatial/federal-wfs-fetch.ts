import type { Feature } from "geojson";
import {
  FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
  FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID,
  FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
  MAPBIOMAS_ALERTA_WFS,
} from "@/lib/geospatial/wave-federal-catalog";
import type { WaveACatalogEntry } from "@/lib/geospatial/wave-a-catalog";
import {
  fetchWfsFeaturesInBbox,
  type WfsFetchResult,
} from "@/lib/geospatial/wfs-client";

/** Bbox aproximado da Amazônia Legal (graus WGS84). */
const LEGAL_AMAZON_BBOX: [number, number, number, number] = [
  -73.5, -20.5, -43.5, 6.5,
];

function bboxIntersects(
  a: [number, number, number, number],
  b: [number, number, number, number],
): boolean {
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

export function bboxMayIntersectLegalAmazon(
  bbox: [number, number, number, number],
): boolean {
  // Ao sul de ~15°S o bioma Amazônia Legal não alcança MG / Sudeste.
  if (bbox[3] < -15) return false;
  return bboxIntersects(bbox, LEGAL_AMAZON_BBOX);
}

function mapBiomaProperty(feature: Feature): string {
  const p = feature.properties as Record<string, unknown> | null;
  if (!p) return "";
  return String(p.Bioma ?? p.bioma ?? "");
}

function filterMapBiomasMataAtlanticaAlerts(features: Feature[]): Feature[] {
  return features.filter((f) => /mata\s*atl/i.test(mapBiomaProperty(f)));
}

async function fetchMapBiomasMataAtlanticaProxy(
  bbox: [number, number, number, number],
  maxFeatures?: number,
): Promise<WfsFetchResult> {
  const raw = await fetchWfsFeaturesInBbox({
    baseUrls: [MAPBIOMAS_ALERTA_WFS],
    typeNames: ["mapbiomas-alertas:dashboard_alerts-shapefile"],
    bbox,
    maxFeatures: maxFeatures ?? 20,
  });

  if (!raw.ok) return raw;

  const filtered = filterMapBiomasMataAtlanticaAlerts(raw.features);
  if (!filtered.length) {
    return {
      ok: false,
      features: [],
      baseUrl: MAPBIOMAS_ALERTA_WFS,
      typeName: "mapbiomas-alertas:dashboard_alerts-shapefile",
      noFeaturesInExtent: true,
      error: "Sem alertas MapBiomas no bioma Mata Atlântica no recorte.",
    };
  }

  return {
    ok: true,
    features: filtered,
    baseUrl: MAPBIOMAS_ALERTA_WFS,
    typeName: "mapbiomas-alertas:dashboard_alerts-shapefile",
    proxiedFromMapBiomasAlerta: true,
  };
}

/**
 * Consulta WFS federal com atalhos: ignora Amazônia Legal fora do recorte e
 * usa MapBiomas Alerta (Mata Atlântica) quando o PRODES MA está degradado.
 */
export async function fetchFederalWfsForEntry(
  entry: WaveACatalogEntry,
  expandedBbox: [number, number, number, number],
): Promise<WfsFetchResult> {
  if (
    entry.layerId === FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID &&
    !bboxMayIntersectLegalAmazon(expandedBbox)
  ) {
    return {
      ok: false,
      features: [],
      noFeaturesInExtent: true,
      skippedOutsideExtent: true,
      error: "Perímetro fora da Amazônia Legal — camada omitida.",
    };
  }

  const wfs = await fetchWfsFeaturesInBbox({
    baseUrls: entry.wfsBaseUrls,
    typeNames: entry.typeNames,
    bbox: expandedBbox,
    maxFeatures: entry.maxWfsFeatures,
  });

  if (
    entry.layerId === FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID &&
    wfs.upstreamWfsDegraded
  ) {
    return fetchMapBiomasMataAtlanticaProxy(expandedBbox, entry.maxWfsFeatures);
  }

  return wfs;
}

export function isMapBiomasMataAtlanticaProxyResult(
  layerId: string,
  wfs: WfsFetchResult,
): boolean {
  return (
    layerId === FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID &&
    Boolean(wfs.proxiedFromMapBiomasAlerta)
  );
}

export function federalMapBiomasAlertaLabelFields(): string[] {
  return [
    "CodeAlerta",
    "Bioma",
    "Estado",
    "Municipio",
    "AreaHa",
    "AnoDetec",
    "DataDetec",
    "Fonte",
    "VPressao",
  ];
}

export function isFederalWfsEntry(entry: WaveACatalogEntry): boolean {
  return (
    entry.wfsBaseUrls.length > 0 &&
    !entry.arcgisLayerUrl &&
    entry.layerId !== FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID
  );
}
