import type { GeoLayerResult } from "@/lib/types/geo-wave-a";
import { WAVE_ALL_LAYER_COUNT } from "@/lib/geospatial/run-wave-a-analysis";

/** Metadados leves para listagens (evita transferir `layers` completo). */
export type GeoAnalysisListSummary = {
  areaHa: number;
  okCount: number;
  totalLayers: number;
  generatedAtUtc: string;
};

export function buildGeoAnalysisListSummary(params: {
  layers: GeoLayerResult[];
  perimeterAreaHa: number;
  generatedAtUtc: string;
}): GeoAnalysisListSummary {
  const okCount = params.layers.filter((l) => l.status === "ok").length;
  return {
    areaHa: Number(params.perimeterAreaHa.toFixed(4)),
    okCount,
    totalLayers: params.layers.length || WAVE_ALL_LAYER_COUNT,
    generatedAtUtc: params.generatedAtUtc,
  };
}

export function formatGeoAnalysisListLabel(
  summary: GeoAnalysisListSummary,
  opts?: { prefix?: string; date?: string },
): string {
  const date = opts?.date ?? summary.generatedAtUtc.slice(0, 10);
  const area =
    summary.areaHa > 0 ? `${summary.areaHa.toFixed(0)} ha` : "— ha";
  const prefix = opts?.prefix ? `${opts.prefix}` : "";
  return `${prefix}${area} · ${summary.okCount}/${summary.totalLayers} OK${date ? ` · ${date}` : ""}`;
}

export function summaryFromFirestoreDoc(
  data: Record<string, unknown>,
): GeoAnalysisListSummary | null {
  const stored = data.listSummary as GeoAnalysisListSummary | undefined;
  if (stored?.generatedAtUtc) {
    return {
      areaHa: stored.areaHa ?? 0,
      okCount: stored.okCount ?? 0,
      totalLayers: stored.totalLayers ?? WAVE_ALL_LAYER_COUNT,
      generatedAtUtc: stored.generatedAtUtc,
    };
  }
  const layers = (data.layers as GeoLayerResult[] | undefined) ?? [];
  const wave = data.wave as string | undefined;
  if (wave !== "A" && wave !== "ABC") return null;
  const perimeter = data.perimeter as { areaHa?: number } | undefined;
  const areaHa = perimeter?.areaHa ?? 0;
  if (areaHa <= 0 && layers.length === 0) return null;
  return buildGeoAnalysisListSummary({
    layers,
    perimeterAreaHa: areaHa,
    generatedAtUtc: (data.generatedAtUtc as string) ?? "",
  });
}
