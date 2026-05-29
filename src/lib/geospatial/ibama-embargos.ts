import type { GeoLayerStat } from "@/lib/types/geo-wave-a";
import {
  FEDERAL_PRODES_CERRADO_LAYER_ID,
  FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
  FEDERAL_TI_LAYER_ID,
  FEDERAL_UC_LAYER_ID,
  IBAMA_EMBARGOS_LAYER_ID,
} from "@/lib/geospatial/wave-federal-catalog";

export function enrichEmbargosLayerSummary(
  stats: GeoLayerStat[],
  fallback: string,
): string {
  if (!stats.length) return fallback;
  const totalHa = stats.reduce((s, row) => s + (row.areaHa ?? 0), 0);
  const top = stats[0];
  const tadCount = stats.reduce((s, row) => s + (row.count ?? 1), 0);
  const parts = [
    `${tadCount} termo(s) de embargo intersectando o perímetro`,
    top?.label ? `— predominante: ${top.label}` : "",
    totalHa > 0 ? `(~${totalHa.toFixed(2)} ha no recorte)` : "",
    "Consulte autos/TADs no PAMGIA/SISCOM antes de conclusões regulatórias.",
  ].filter(Boolean);
  return parts.join(" ");
}

export function enrichProdesLayerSummary(
  stats: GeoLayerStat[],
  fallback: string,
): string {
  if (!stats.length) return fallback;
  const desmatamento = stats.filter((row) =>
    /desmat/i.test(row.label),
  );
  const rows = desmatamento.length ? desmatamento : stats;
  const totalHa = rows.reduce((s, row) => s + (row.areaHa ?? 0), 0);
  const top = rows[0];
  return [
    `${rows.length} polígono(s) PRODES no perímetro`,
    top?.label ? `(classe/ano: ${top.label})` : "",
    totalHa > 0 ? `~${totalHa.toFixed(2)} ha` : "",
    "Dado oficial INPE/TerraBrasilis — confira série temporal e bioma.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function isEmbargosLayer(layerId: string): boolean {
  return layerId === IBAMA_EMBARGOS_LAYER_ID;
}

export function isProdesLayer(layerId: string): boolean {
  return (
    layerId === FEDERAL_PRODES_CERRADO_LAYER_ID ||
    layerId === FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID
  );
}

export function isFederalArcGisLayer(layerId: string): boolean {
  return layerId === FEDERAL_UC_LAYER_ID || layerId === FEDERAL_TI_LAYER_ID;
}

export function federalLayerUnavailableSummary(
  layerId: string,
  noFeaturesInExtent: boolean,
): string | null {
  if (!noFeaturesInExtent) return null;
  if (layerId === FEDERAL_UC_LAYER_ID) {
    return "Nenhuma unidade de conservação intersectou o perímetro (PAMGIA/MMA).";
  }
  if (layerId === FEDERAL_TI_LAYER_ID) {
    return "Nenhuma terra indígena intersectou o perímetro (PAMGIA/FUNAI).";
  }
  if (isProdesLayer(layerId)) {
    return "Nenhum polígono PRODES anual intersectou o perímetro no recorte WFS INPE.";
  }
  return null;
}
