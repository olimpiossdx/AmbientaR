import area from "@turf/area";
import buffer from "@turf/buffer";
import booleanIntersects from "@turf/boolean-intersects";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import center from "@turf/center";
import distance from "@turf/distance";
import { lineSegment } from "@turf/line-segment";
import length from "@turf/length";
import { point } from "@turf/helpers";
import intersect from "@turf/intersect";
import type { Position } from "geojson";
import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  Polygon,
} from "geojson";
import type { GeoLayerStat } from "@/lib/types/geo-wave-a";
import { safeFeatureCollection } from "@/lib/geospatial/perimeter";

const HA_FROM_M2 = 1 / 10_000;

/** Corredor para detectar cursos que tangenciam o perímetro (linhas finas no WFS). */
const HYDRO_LINE_BUFFER_KM = 0.08;

export function flattenAnalysisFeatures(features: Feature[]): Feature[] {
  const out: Feature[] = [];
  for (const feature of features) {
    const g = feature.geometry;
    if (!g) continue;
    if (g.type === "GeometryCollection") {
      for (const geom of g.geometries) {
        out.push({
          type: "Feature",
          properties: feature.properties ?? {},
          geometry: geom,
        });
      }
      continue;
    }
    out.push(feature);
  }
  return out;
}

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
    if (g.type === "Polygon") {
      const result = intersect(
        safeFeatureCollection([perimeter, feature as Feature<Polygon>]) as Parameters<
          typeof intersect
        >[0],
      );
      if (result) return area(result) * HA_FROM_M2;
      if (booleanPointInPolygon(center(feature), perimeter)) {
        return Math.min(area(feature), area(perimeter)) * HA_FROM_M2;
      }
      return 0;
    }
    if (g.type === "MultiPolygon") {
      let total = 0;
      for (const polyCoords of g.coordinates) {
        const sub: Feature<Polygon> = {
          type: "Feature",
          properties: feature.properties ?? {},
          geometry: { type: "Polygon", coordinates: polyCoords },
        };
        total += intersectAreaHa(perimeter, sub);
      }
      return total;
    }
  } catch {
    return 0;
  }
  return 0;
}

function isLineGeometry(g: Feature["geometry"] | undefined): boolean {
  return g?.type === "LineString" || g?.type === "MultiLineString";
}

function lineCoordinateSegments(feature: Feature): [Position, Position][] {
  const g = feature.geometry;
  const pairs: [Position, Position][] = [];
  if (!g) return pairs;
  if (g.type === "LineString") {
    for (let i = 0; i < g.coordinates.length - 1; i++) {
      pairs.push([g.coordinates[i]!, g.coordinates[i + 1]!]);
    }
  } else if (g.type === "MultiLineString") {
    for (const line of g.coordinates) {
      for (let i = 0; i < line.length - 1; i++) {
        pairs.push([line[i]!, line[i + 1]!]);
      }
    }
  }
  return pairs;
}

function lineLengthKmByVertexSampling(
  perimeter: Feature<Polygon>,
  feature: Feature,
): number {
  let totalKm = 0;
  for (const [a, b] of lineCoordinateSegments(feature)) {
    const pA = point(a);
    const pB = point(b);
    const mid = point([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    const inside =
      booleanPointInPolygon(pA, perimeter) ||
      booleanPointInPolygon(pB, perimeter) ||
      booleanPointInPolygon(mid, perimeter);
    if (inside) {
      totalKm += distance(pA, pB, { units: "kilometers" });
    }
  }
  return totalKm;
}

/** Soma segmentos de curso dentro do perímetro (ou corredor buffer para linhas finas). */
function lineLengthKmInsidePerimeter(
  perimeter: Feature<Polygon>,
  feature: Feature,
): number {
  try {
    if (!booleanIntersects(perimeter, feature)) return 0;
    const g = feature.geometry;
    if (!isLineGeometry(g)) return 0;

    const segments = lineSegment(
      feature as Feature<LineString | MultiLineString>,
    );
    let totalKm = 0;
    for (const seg of segments.features) {
      const mid = center(seg);
      if (!booleanPointInPolygon(mid, perimeter)) continue;
      totalKm += length(seg, { units: "kilometers" });
    }
    if (totalKm > 0.0001) return totalKm;

    totalKm = lineLengthKmByVertexSampling(perimeter, feature);
    if (totalKm > 0.0001) return totalKm;

    if (booleanIntersects(perimeter, feature)) {
      return length(feature, { units: "kilometers" });
    }
  } catch {
    return 0;
  }
  return 0;
}

function hydroLineCorridor(perimeter: Feature<Polygon>): Feature<Polygon> | null {
  const buffered = buffer(perimeter, HYDRO_LINE_BUFFER_KM, { units: "kilometers" });
  if (!buffered?.geometry || buffered.geometry.type !== "Polygon") return null;
  return buffered as Feature<Polygon>;
}

/** Hidrografia: linhas (com corredor se necessário) + massas d'água em polígono. */
export function aggregateHydroLayerStats(params: {
  perimeter: Feature<Polygon>;
  perimeterAreaHa: number;
  features: Feature[];
  labelFields: string[];
}): { stats: GeoLayerStat[]; usedLineCorridor: boolean } {
  const flat = flattenAnalysisFeatures(params.features);
  const lines: Feature[] = [];
  const polygons: Feature[] = [];

  for (const f of flat) {
    const t = f.geometry?.type;
    if (t === "LineString" || t === "MultiLineString") lines.push(f);
    else if (t === "Polygon" || t === "MultiPolygon") polygons.push(f);
  }

  let lineStats = aggregateLineLayerStats({
    perimeter: params.perimeter,
    features: lines,
    labelFields: params.labelFields,
  });
  let usedLineCorridor = false;

  if (lineStats.length === 0 && lines.length > 0) {
    const corridor = hydroLineCorridor(params.perimeter);
    if (corridor) {
      lineStats = aggregateLineLayerStats({
        perimeter: corridor,
        features: lines,
        labelFields: params.labelFields,
      });
      usedLineCorridor = lineStats.length > 0;
    }
  }

  const polyStats = aggregatePolygonLayerStats({
    perimeter: params.perimeter,
    perimeterAreaHa: params.perimeterAreaHa,
    features: polygons,
    labelFields: params.labelFields,
  });

  const stats = [...lineStats, ...polyStats].sort((a, b) => {
    const scoreA = a.pctOfPerimeter ?? a.lengthKm ?? 0;
    const scoreB = b.pctOfPerimeter ?? b.lengthKm ?? 0;
    return scoreB - scoreA;
  });

  return { stats, usedLineCorridor };
}

export function aggregateMixedLayerStats(params: {
  perimeter: Feature<Polygon>;
  perimeterAreaHa: number;
  features: Feature[];
  labelFields: string[];
}): GeoLayerStat[] {
  const flat = flattenAnalysisFeatures(params.features);
  const lines: Feature[] = [];
  const polygons: Feature[] = [];
  const points: Feature[] = [];

  for (const f of flat) {
    const t = f.geometry?.type;
    if (t === "LineString" || t === "MultiLineString") lines.push(f);
    else if (t === "Polygon" || t === "MultiPolygon") polygons.push(f);
    else if (t === "Point") points.push(f);
  }

  const lineStats = aggregateLineLayerStats({
    perimeter: params.perimeter,
    features: lines,
    labelFields: params.labelFields,
  });
  const polyStats = aggregatePolygonLayerStats({
    perimeter: params.perimeter,
    perimeterAreaHa: params.perimeterAreaHa,
    features: polygons,
    labelFields: params.labelFields,
  });
  const pointStats = aggregatePointLayerStats({
    perimeter: params.perimeter,
    features: points,
    labelFields: params.labelFields,
  });

  return [...lineStats, ...polyStats, ...pointStats].sort((a, b) => {
    const scoreA = a.pctOfPerimeter ?? a.lengthKm ?? a.count ?? 0;
    const scoreB = b.pctOfPerimeter ?? b.lengthKm ?? b.count ?? 0;
    return scoreB - scoreA;
  });
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
    `Área do empreendimento: ${perimeterAreaHa.toFixed(2)} ha (IDE-Sisema MG — análise SIG MG, incl. potencialidade CECAV).`,
  ];
  for (const layer of layers) {
    if (layer.status !== "ok" || layer.stats.length === 0) {
      parts.push(`${layer.title}: consulta sem interseção confirmada ou serviço indisponível.`);
      continue;
    }
    const totalKm = layer.stats.reduce((s, x) => s + (x.lengthKm ?? 0), 0);
    const top = layer.stats[0];
    if (top.pctOfPerimeter != null) {
      parts.push(
        `${layer.title}: predominante "${top.label}" (${top.pctOfPerimeter}% do empreendimento).`,
      );
    } else if (totalKm > 0) {
      parts.push(
        `${layer.title}: ~${totalKm.toFixed(2)} km de feições lineares no recorte.`,
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
