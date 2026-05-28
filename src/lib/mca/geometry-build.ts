import bbox from "@turf/bbox";
import buffer from "@turf/buffer";
import center from "@turf/center";
import intersect from "@turf/intersect";
import { featureCollection, lineString, point, polygon } from "@turf/helpers";
import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";
import { emptyFc, perimeterAsPolygon, toFeatureCollection } from "./perimeter";
import type { McaAgentContext } from "./types";

function rectInsideBbox(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Feature<Polygon> {
  return polygon([
    [
      [minX + (maxX - minX) * x0, minY + (maxY - minY) * y0],
      [minX + (maxX - minX) * x1, minY + (maxY - minY) * y0],
      [minX + (maxX - minX) * x1, minY + (maxY - minY) * y1],
      [minX + (maxX - minX) * x0, minY + (maxY - minY) * y1],
      [minX + (maxX - minX) * x0, minY + (maxY - minY) * y0],
    ],
  ]);
}

function clipToPerimeter(
  feat: Feature<Polygon>,
  perim: Feature<Polygon>,
): FeatureCollection {
  try {
    const clipped = intersect(
      featureCollection([feat, perim]),
    ) as Feature<Polygon> | null;
    if (clipped?.geometry) {
      return featureCollection([{ ...clipped, properties: feat.properties ?? {} }]);
    }
  } catch {
    /* geometria inválida para intersect */
  }
  return emptyFc();
}

export function resolveLayerGeometry(
  ctx: McaAgentContext,
  layerKey: string,
  synthesize: () => FeatureCollection,
): FeatureCollection {
  const existing = ctx.layers.get(layerKey);
  if (existing?.features?.length) return existing;
  const built = synthesize();
  if (built.features.length) ctx.layers.set(layerKey, built);
  return built;
}

export function synthUsoLayers(ctx: McaAgentContext): void {
  const perim = perimeterAsPolygon(ctx.project.perimeterGeoJson);
  if (!perim) return;
  const [minX, minY, maxX, maxY] = bbox(perim);

  const zones: [string, number, number, number, number][] = [
    ["USO_LAVOURA", 0.05, 0.55, 0.45, 0.95],
    ["USO_PIVO", 0.5, 0.1, 0.9, 0.45],
    ["USO_PASTO", 0.05, 0.05, 0.45, 0.5],
  ];

  for (const [key, x0, y0, x1, y1] of zones) {
    resolveLayerGeometry(ctx, key, () => {
      const rect = rectInsideBbox(minX, minY, maxX, maxY, x0, y0, x1, y1);
      rect.properties = { class: key.replace("USO_", "") };
      return clipToPerimeter(rect, perim);
    });
  }
}

export function synthHydroLayers(ctx: McaAgentContext): void {
  const perim = perimeterAsPolygon(ctx.project.perimeterGeoJson);
  if (!perim) return;
  const [minX, minY, maxX, maxY] = bbox(perim);
  const midY = (minY + maxY) / 2;

  const lines: [string, string, number[][]][] = [
    [
      "HYD_CORREGO",
      "Córrego",
      [
        [minX + (maxX - minX) * 0.15, midY],
        [minX + (maxX - minX) * 0.85, midY + (maxY - minY) * 0.08],
      ],
    ],
    [
      "HYD_VEREDA",
      "Vereda",
      [
        [minX + (maxX - minX) * 0.3, minY + (maxY - minY) * 0.2],
        [minX + (maxX - minX) * 0.7, minY + (maxY - minY) * 0.75],
      ],
    ],
  ];

  for (const [key, nome, coords] of lines) {
    resolveLayerGeometry(ctx, key, () => {
      const ls = lineString(coords, { nome, class: key });
      return featureCollection([ls as Feature<LineString>]);
    });
  }
}

export function synthAppFromHydro(ctx: McaAgentContext, bufferKm = 0.03): FeatureCollection {
  const hydroKeys = ["HYD_CORREGO", "HYD_VEREDA", "HYD_RIBEIRAO", "HYD_GROTA"];
  const parts: Feature[] = [];
  for (const key of hydroKeys) {
    const fc = ctx.layers.get(key);
    if (!fc?.features?.length) continue;
    for (const f of fc.features) {
      if (!f.geometry) continue;
      try {
        const buf = buffer(f, bufferKm, { units: "kilometers" });
        if (buf) parts.push(buf as Feature);
      } catch {
        /* skip */
      }
    }
  }
  if (!parts.length) return emptyFc();
  return featureCollection(parts);
}

export function synthRlGlebas(ctx: McaAgentContext): FeatureCollection {
  const perim = perimeterAsPolygon(ctx.project.perimeterGeoJson);
  if (!perim) return emptyFc();
  const mats = ctx.project.meta.matriculas?.length
    ? ctx.project.meta.matriculas
    : ["M-única"];
  const [minX, minY, maxX, maxY] = bbox(perim);
  const features: Feature<Polygon>[] = [];
  const n = Math.min(mats.length, 7);
  const step = 1 / (n + 1);

  for (let i = 0; i < n; i++) {
    const x0 = step * (i + 0.2);
    const y0 = 0.55;
    const x1 = x0 + step * 0.7;
    const y1 = 0.92;
    const rect = rectInsideBbox(minX, minY, maxX, maxY, x0, y0, x1, y1);
    const clipped = clipToPerimeter(rect, perim);
    if (clipped.features[0]) {
      const f = clipped.features[0] as Feature<Polygon>;
      f.properties = {
        matricula: mats[i],
        gleba: `0${i + 1}`,
        compensada: i === n - 1 && n > 1,
        class: "RL_GLEBA",
      };
      features.push(f);
    }
  }
  return featureCollection(features);
}

export function synthInfraPoints(ctx: McaAgentContext): void {
  const perim = toFeatureCollection(ctx.project.perimeterGeoJson);
  if (!perim?.features.length) return;
  const c = center(perim);
  const [lon, lat] = c.geometry.coordinates;

  const points: [string, number, number, Record<string, string>][] = [
    ["INFRA_SEDE", lon, lat, { tipo: "Sede" }],
    ["INFRA_SILOS", lon + 0.002, lat + 0.001, { tipo: "SILOS" }],
    ["INFRA_PATIO", lon - 0.001, lat - 0.001, { tipo: "Pátio" }],
  ];

  for (const [key, x, y, props] of points) {
    resolveLayerGeometry(ctx, key, () =>
      featureCollection([point([x, y], props) as Feature<Point>]),
    );
  }
}

export function synthConfrontantes(ctx: McaAgentContext): FeatureCollection {
  const perim = perimeterAsPolygon(ctx.project.perimeterGeoJson);
  if (!perim?.geometry || perim.geometry.type !== "Polygon") return emptyFc();
  const ring = perim.geometry.coordinates[0];
  if (ring.length < 4) return emptyFc();
  const features: Feature<LineString>[] = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    features.push(
      lineString([a, b], {
        confrontante: `Confrontante ${i + 1}`,
        fazenda: "—",
        matricula: ctx.project.meta.matriculas?.[i % (ctx.project.meta.matriculas?.length || 1)] ?? "",
      }) as Feature<LineString>,
    );
  }
  return featureCollection(features);
}

/** Gera geometrias mínimas quando layers ainda estão vazias (após import Firestore). */
export function ensureProjectGeometry(ctx: McaAgentContext): void {
  if (!perimeterAsPolygon(ctx.project.perimeterGeoJson)) return;
  synthHydroLayers(ctx);
  synthUsoLayers(ctx);
  synthInfraPoints(ctx);
  const appBuf = synthAppFromHydro(ctx);
  if (appBuf.features.length) {
    ctx.layers.set("AMB_APP_BUFFER", appBuf);
    ctx.layers.set("AMB_APP", appBuf);
  }
  const rl = synthRlGlebas(ctx);
  if (rl.features.length) ctx.layers.set("AMB_RL_GLEBA", rl);
  const conf = synthConfrontantes(ctx);
  if (conf.features.length) ctx.layers.set("FUND_CONFRONTANTE", conf);
}
