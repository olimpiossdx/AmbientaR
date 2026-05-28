import type { jsPDF } from "jspdf";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";

export type McaPdfMapRect = { x: number; y: number; w: number; h: number };

type Bbox = [number, number, number, number];

type LayerStyle = {
  stroke: [number, number, number];
  fill?: [number, number, number];
  fillOpacity?: number;
  weight: number;
};

const LAYER_STYLES: { prefix: string; style: LayerStyle }[] = [
  { prefix: "USO_", style: { stroke: [22, 163, 74], fill: [34, 197, 94], fillOpacity: 0.35, weight: 0.35 } },
  { prefix: "HYD_", style: { stroke: [37, 99, 235], weight: 0.5 } },
  { prefix: "AMB_", style: { stroke: [124, 58, 237], fill: [167, 139, 250], fillOpacity: 0.3, weight: 0.35 } },
  { prefix: "INFRA_", style: { stroke: [234, 88, 12], fill: [251, 146, 60], fillOpacity: 0.4, weight: 0.35 } },
  { prefix: "CTX_", style: { stroke: [100, 116, 139], weight: 0.25 } },
  { prefix: "FUND_", style: { stroke: [15, 23, 42], weight: 0.6 } },
  { prefix: "BASE_", style: { stroke: [21, 128, 61], fill: [34, 197, 94], fillOpacity: 0.15, weight: 0.8 } },
];

const DEFAULT_STYLE: LayerStyle = {
  stroke: [148, 163, 184],
  fill: [226, 232, 240],
  fillOpacity: 0.2,
  weight: 0.25,
};

function styleForLayerId(layerId: string): LayerStyle {
  const hit = LAYER_STYLES.find((s) => layerId.startsWith(s.prefix));
  return hit?.style ?? DEFAULT_STYLE;
}

function isValidCoord(lon: number, lat: number): boolean {
  return Number.isFinite(lon) && Number.isFinite(lat);
}

function walkPositions(geom: Geometry, fn: (lon: number, lat: number) => void): void {
  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) {
      for (const [lon, lat] of ring) fn(lon, lat);
    }
    return;
  }
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        for (const [lon, lat] of ring) fn(lon, lat);
      }
    }
    return;
  }
  if (geom.type === "LineString") {
    for (const [lon, lat] of geom.coordinates) fn(lon, lat);
    return;
  }
  if (geom.type === "MultiLineString") {
    for (const line of geom.coordinates) {
      for (const [lon, lat] of line) fn(lon, lat);
    }
  }
}

function bboxFromCollections(...fcs: (FeatureCollection | null | undefined)[]): Bbox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const fc of fcs) {
    if (!fc?.features?.length) continue;
    for (const f of fc.features) {
      if (!f.geometry) continue;
      walkPositions(f.geometry, (lon, lat) => {
        if (!isValidCoord(lon, lat)) return;
        minX = Math.min(minX, lon);
        minY = Math.min(minY, lat);
        maxX = Math.max(maxX, lon);
        maxY = Math.max(maxY, lat);
      });
    }
  }
  if (!Number.isFinite(minX)) return null;
  const padX = (maxX - minX) * 0.04 || 0.001;
  const padY = (maxY - minY) * 0.04 || 0.001;
  return [minX - padX, minY - padY, maxX + padX, maxY + padY];
}

function project(
  lon: number,
  lat: number,
  bbox: Bbox,
  rect: McaPdfMapRect,
): [number, number] {
  const [minX, minY, maxX, maxY] = bbox;
  if (!isValidCoord(lon, lat)) return [NaN, NaN];
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;
  const innerPad = 4;
  const innerW = rect.w - innerPad * 2;
  const innerH = rect.h - innerPad * 2;
  const x = rect.x + innerPad + ((lon - minX) / spanX) * innerW;
  const y = rect.y + innerPad + (1 - (lat - minY) / spanY) * innerH;
  return [x, y];
}

function ringToLine(
  ring: Position[],
  bbox: Bbox,
  rect: McaPdfMapRect,
): number[] {
  const line: number[] = [];
  for (const [lon, lat] of ring) {
    const [x, y] = project(lon, lat, bbox, rect);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    line.push(x, y);
  }
  return line;
}

function safeLines(
  doc: jsPDF,
  line: number[],
  style: "S" | "FD",
  fill: boolean,
): void {
  if (line.length < 4) return;
  for (let i = 0; i < line.length; i++) {
    if (!Number.isFinite(line[i])) return;
  }
  try {
    doc.lines([line], 0, 0, [1, 1], style, fill);
  } catch {
    /* geometria complexa (ex. buffer APP) — omitir no preview v1 */
  }
}

function drawPolygonRings(
  doc: jsPDF,
  rings: Position[][],
  bbox: Bbox,
  rect: McaPdfMapRect,
  style: LayerStyle,
): void {
  if (!rings[0]?.length) return;
  const outer = ringToLine(rings[0], bbox, rect);
  if (outer.length < 4) return;

  doc.setDrawColor(...style.stroke);
  doc.setLineWidth(style.weight);
  if (style.fill) {
    const [fr, fg, fb] = style.fill;
    const a = style.fillOpacity ?? 0.35;
    doc.setFillColor(
      Math.round(255 * (1 - a) + fr * a),
      Math.round(255 * (1 - a) + fg * a),
      Math.round(255 * (1 - a) + fb * a),
    );
    safeLines(doc, outer, style.fill ? "FD" : "S", true);
  } else {
    safeLines(doc, outer, "S", false);
  }
}

function drawLine(
  doc: jsPDF,
  coords: Position[],
  bbox: Bbox,
  rect: McaPdfMapRect,
  style: LayerStyle,
): void {
  if (coords.length < 2) return;
  const line = ringToLine(coords, bbox, rect);
  doc.setDrawColor(...style.stroke);
  doc.setLineWidth(style.weight);
  safeLines(doc, line, "S", false);
}

function drawFeature(
  doc: jsPDF,
  feature: Feature,
  bbox: Bbox,
  rect: McaPdfMapRect,
  style: LayerStyle,
): void {
  const g = feature.geometry;
  if (!g) return;
  if (g.type === "Polygon") {
    drawPolygonRings(doc, g.coordinates, bbox, rect, style);
  } else if (g.type === "MultiPolygon") {
    for (const poly of g.coordinates) {
      drawPolygonRings(doc, poly, bbox, rect, style);
    }
  } else if (g.type === "LineString") {
    drawLine(doc, g.coordinates, bbox, rect, style);
  } else if (g.type === "MultiLineString") {
    for (const line of g.coordinates) drawLine(doc, line, bbox, rect, style);
  }
}

function drawLayer(
  doc: jsPDF,
  layerId: string,
  fc: FeatureCollection,
  bbox: Bbox,
  rect: McaPdfMapRect,
): void {
  const style = styleForLayerId(layerId);
  for (const f of fc.features) {
    drawFeature(doc, f, bbox, rect, style);
  }
}

const DRAW_ORDER = ["USO_", "HYD_", "AMB_", "INFRA_", "CTX_", "FUND_", "BASE_"];

function sortLayerKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const ia = DRAW_ORDER.findIndex((p) => a.startsWith(p));
    const ib = DRAW_ORDER.findIndex((p) => b.startsWith(p));
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
}

export function drawMcaMapPanel(
  doc: jsPDF,
  rect: McaPdfMapRect,
  perimeter: FeatureCollection | null | undefined,
  layers: Record<string, FeatureCollection>,
): boolean {
  const layerFcs = Object.values(layers).filter((fc) => fc?.features?.length);
  const bbox = bboxFromCollections(perimeter, ...layerFcs);
  if (!bbox) return false;

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.setLineWidth(0.2);
  doc.roundedRect(rect.x, rect.y, rect.w, rect.h, 2, 2, "FD");

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Mapa esquemático MCA (UTM/SIRGAS — referência)", rect.x + 4, rect.y + 5);

  const mapInner: McaPdfMapRect = {
    x: rect.x,
    y: rect.y + 7,
    w: rect.w,
    h: rect.h - 7,
  };

  for (const key of sortLayerKeys(Object.keys(layers))) {
    const fc = layers[key];
    if (fc?.features?.length) drawLayer(doc, key, fc, bbox, mapInner);
  }

  if (perimeter?.features?.length) {
    const perimStyle: LayerStyle = {
      stroke: [21, 128, 61],
      weight: 0.9,
    };
    for (const f of perimeter.features) {
      drawFeature(doc, f, bbox, mapInner, perimStyle);
    }
  } else {
    const fund = layers.FUND_LIMITE ?? layers.BASE_PERIMETRO;
    if (fund?.features?.length) {
      const perimStyle: LayerStyle = { stroke: [21, 128, 61], weight: 0.9 };
      for (const f of fund.features) {
        drawFeature(doc, f, bbox, mapInner, perimStyle);
      }
    }
  }

  return true;
}

export function drawMcaCartouche(
  doc: jsPDF,
  rect: McaPdfMapRect,
  meta: {
    propertyName?: string;
    ownerName?: string;
    scale?: string;
    technicalResponsible?: string;
    crea?: string;
    municipality?: string;
  },
): void {
  const w = 72;
  const h = 38;
  const x = rect.x + rect.w - w - 4;
  const y = rect.y + rect.h - h - 4;

  doc.setDrawColor(15, 23, 42);
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.rect(x, y, w, h, "FD");

  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  let ly = y + 5;
  const lines = [
    (meta.propertyName ?? "Propriedade").slice(0, 42),
    meta.ownerName ? `Prop.: ${meta.ownerName}`.slice(0, 42) : null,
    meta.municipality ? meta.municipality.slice(0, 42) : null,
    `Escala ${meta.scale ?? "1:12.000"}`,
    meta.technicalResponsible
      ? `RT: ${meta.technicalResponsible}`.slice(0, 42)
      : "Responsável técnico: —",
    meta.crea ? `CREA: ${meta.crea}` : "CREA: —",
  ].filter(Boolean) as string[];

  for (const line of lines) {
    doc.text(line, x + 2, ly);
    ly += 5;
  }
}

export function drawMcaLegend(
  doc: jsPDF,
  x: number,
  y: number,
  layerKeys: string[],
): number {
  const shown = layerKeys
    .filter((k) => k !== "BASE_PERIMETRO")
    .slice(0, 8);
  if (!shown.length) return y;

  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Legenda:", x, y);
  let ly = y + 4;
  for (const key of shown) {
    const style = styleForLayerId(key);
    doc.setFillColor(...(style.fill ?? style.stroke));
    doc.rect(x, ly - 2.5, 3, 3, "F");
    doc.text(key.replace(/_/g, " ").slice(0, 28), x + 5, ly);
    ly += 4;
  }
  return ly + 2;
}
