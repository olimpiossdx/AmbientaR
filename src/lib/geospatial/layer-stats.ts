import area from "@turf/area";
import booleanIntersects from "@turf/boolean-intersects";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import intersect from "@turf/intersect";
import length from "@turf/length";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { GeoLayerStat } from "@/lib/types/geo-wave-a";
import { safeFeatureCollection } from "@/lib/geospatial/perimeter";

const HA_FROM_M2 = 1 / 10_000;

function pickLabel(properties: Record<string, unknown> | null, fields: string[]): string {
  if (!properties) return "Sem classificação";
  for (const field of fields) {
    const v = properties[field];
    if (v !== undefined && v !== null && String(v).trim()) {
      return String(v).trim();
    }
  }
  const first = Object.values(properties).find(
    (v) => typeof v === "string" && v.trim().length > 0 && v.trim().length < 120,
  );
  return first ? String(first).trim() : "Sem classificação";
}

function intersectAreaHa(
  perimeter: Feature<Polygon>,
  feature: Feature,
): number {
  try {
    if (!booleanIntersects(perimeter, feature)) return 0;
    const g = feature.geometry;
    if (!g) return 0;
    if (g.type === "Polygon" || g.type === "MultiPolygon") {
      const result = intersect(
        safeFeatureCollection([perimeter, feature as Feature<Polygon>]) as Parameters<
          typeof intersect
        >[0],
      );
      if (!result) return 0;
      return area(result) * HA_FROM_M2;
    }
    if (g.type === "LineString" || g.type === "MultiLineString") {
      if (!booleanIntersects(perimeter, feature)) return 0;
      return 0;
    }
  } catch {
    return 0;
  }
  return 0;
}

function lineLengthKmInsidePerimeter(
  perimeter: Feature<Polygon>,
  feature: Feature,
): number {
  try {
    if (!booleanIntersects(perimeter, feature)) return 0;
    const g = feature.geometry;
    if (g?.type !== "LineString" && g?.type !== "MultiLineString") return 0;
    return length(feature, { units: "kilometers" });
  } catch {
    return 0;
  }
}

export function aggregatePolygonLayerStats(params: {
  perimeter: Feature<Polygon>;
  perimeterAreaHa: number;
  features: Feature[];
  labelFields: string[];
}): GeoLayerStat[] {
  const byLabel = new Map<string, { areaHa: number; count: number }>();

  for (const feature of params.features) {
    const label = pickLabel(
      (feature.properties as Record<string, unknown>) ?? null,
      params.labelFields,
    );
    const partHa = intersectAreaHa(params.perimeter, feature);
    if (partHa <= 0.0001) continue;
    const prev = byLabel.get(label) ?? { areaHa: 0, count: 0 };
    byLabel.set(label, {
      areaHa: prev.areaHa + partHa,
      count: prev.count + 1,
    });
  }

  const stats: GeoLayerStat[] = [];
  for (const [label, agg] of byLabel.entries()) {
    const pct =
      params.perimeterAreaHa > 0
        ? Math.min(100, (agg.areaHa / params.perimeterAreaHa) * 100)
        : 0;
    stats.push({
      label,
      areaHa: Number(agg.areaHa.toFixed(4)),
      pctOfPerimeter: Number(pct.toFixed(2)),
      count: agg.count,
    });
  }

  return stats.sort((a, b) => (b.pctOfPerimeter ?? 0) - (a.pctOfPerimeter ?? 0));
}

export function aggregateLineLayerStats(params: {
  perimeter: Feature<Polygon>;
  features: Feature[];
  labelFields: string[];
}): GeoLayerStat[] {
  const byLabel = new Map<string, { lengthKm: number; count: number }>();

  for (const feature of params.features) {
    const label = pickLabel(
      (feature.properties as Record<string, unknown>) ?? null,
      params.labelFields,
    );
    const km = lineLengthKmInsidePerimeter(params.perimeter, feature);
    if (km <= 0.0001) continue;
    const prev = byLabel.get(label) ?? { lengthKm: 0, count: 0 };
    byLabel.set(label, {
      lengthKm: prev.lengthKm + km,
      count: prev.count + 1,
    });
  }

  const stats: GeoLayerStat[] = [];
  for (const [label, agg] of byLabel.entries()) {
    stats.push({
      label,
      lengthKm: Number(agg.lengthKm.toFixed(3)),
      count: agg.count,
    });
  }

  return stats.sort((a, b) => (b.lengthKm ?? 0) - (a.lengthKm ?? 0));
}

export function aggregatePointLayerStats(params: {
  perimeter: Feature<Polygon>;
  features: Feature[];
  labelFields: string[];
}): GeoLayerStat[] {
  const byLabel = new Map<string, { count: number }>();

  for (const feature of params.features) {
    const g = feature.geometry;
    if (g?.type !== "Point") continue;
    const inside = booleanPointInPolygon(
      point(g.coordinates as [number, number]),
      params.perimeter,
    );
    if (!inside) continue;
    const label = pickLabel(
      (feature.properties as Record<string, unknown>) ?? null,
      params.labelFields,
    );
    const prev = byLabel.get(label) ?? { count: 0 };
    byLabel.set(label, { count: prev.count + 1 });
  }

  const stats: GeoLayerStat[] = [];
  for (const [label, agg] of byLabel.entries()) {
    stats.push({ label, count: agg.count });
  }
  return stats.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
}

export function buildFactualSummary(
  perimeterAreaHa: number,
  layers: { title: string; stats: GeoLayerStat[]; status: string }[],
): string {
  const parts: string[] = [
    `Área do empreendimento: ${perimeterAreaHa.toFixed(2)} ha (IDE-Sisema MG — Ondas A+B+C).`,
  ];
  for (const layer of layers) {
    if (layer.status !== "ok" || layer.stats.length === 0) {
      parts.push(`${layer.title}: consulta sem interseção confirmada ou serviço indisponível.`);
      continue;
    }
    const top = layer.stats[0];
    if (top.pctOfPerimeter != null) {
      parts.push(
        `${layer.title}: predominante "${top.label}" (${top.pctOfPerimeter}% do empreendimento).`,
      );
    } else if (top.lengthKm != null) {
      parts.push(
        `${layer.title}: ${layer.stats.length} feição(ões); maior extensão "${top.label}" (~${top.lengthKm} km no recorte).`,
      );
    } else if (top.count != null) {
      parts.push(
        `${layer.title}: ${top.count} ocorrência(s); principal "${top.label}".`,
      );
    }
  }
  return parts.join(" ");
}
