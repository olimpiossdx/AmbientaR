import type { jsPDF } from "jspdf";
import type { McaPdfMapRect } from "./map-preview-pdf";

export type McaPdfBbox = [number, number, number, number];

const MG_OVERVIEW_BBOX: McaPdfBbox = [-51.5, -23.5, -39.8, -14.0];

export function isLikelyUtmBbox(bbox: McaPdfBbox): boolean {
  const [minX, minY, maxX, maxY] = bbox;
  return (
    Math.abs(minX) > 180 ||
    Math.abs(maxX) > 180 ||
    Math.abs(minY) > 90 ||
    Math.abs(maxY) > 90
  );
}

export function expandBbox(bbox: McaPdfBbox, factor: number): McaPdfBbox {
  const [minX, minY, maxX, maxY] = bbox;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const halfW = ((maxX - minX) / 2) * factor;
  const halfH = ((maxY - minY) / 2) * factor;
  return [cx - halfW, cy - halfH, cx + halfW, cy + halfH];
}

function niceStep(span: number, targetTicks = 4): number {
  if (!Number.isFinite(span) || span <= 0) return 1;
  const rough = span / targetTicks;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  if (norm <= 1) return mag;
  if (norm <= 2) return 2 * mag;
  if (norm <= 5) return 5 * mag;
  return 10 * mag;
}

function formatCoord(value: number, utm: boolean, axis: "x" | "y"): string {
  if (utm) return Math.round(value).toLocaleString("pt-BR");
  const abs = Math.abs(value);
  const hemi = axis === "x" ? (value < 0 ? "W" : "E") : value < 0 ? "S" : "N";
  return `${abs.toFixed(2)}°${hemi}`;
}

function projectLonLat(
  lon: number,
  lat: number,
  bbox: McaPdfBbox,
  rect: McaPdfMapRect,
  pad: number,
): [number, number] {
  const [minX, minY, maxX, maxY] = bbox;
  const innerW = rect.w - pad * 2;
  const innerH = rect.h - pad * 2;
  const x = rect.x + pad + ((lon - minX) / (maxX - minX || 1e-9)) * innerW;
  const y = rect.y + pad + (1 - (lat - minY) / (maxY - minY || 1e-9)) * innerH;
  return [x, y];
}

function ringToPdfLine(
  ring: [number, number][],
  bbox: McaPdfBbox,
  rect: McaPdfMapRect,
  pad: number,
): number[] {
  const line: number[] = [];
  for (const [lon, lat] of ring) {
    const [x, y] = projectLonLat(lon, lat, bbox, rect, pad);
    if (Number.isFinite(x) && Number.isFinite(y)) line.push(x, y);
  }
  return line;
}

function drawClosedLine(doc: jsPDF, line: number[], style: "S" | "FD"): void {
  if (line.length < 4) return;
  try {
    doc.lines([line], 0, 0, [1, 1], style, style === "FD");
  } catch {
    /* geometria complexa */
  }
}

/** Grade UTM / geográfica nas bordas do painel do mapa. */
export function drawMcaUtmGrid(
  doc: jsPDF,
  bbox: McaPdfBbox,
  rect: McaPdfMapRect,
  pad = 8,
): void {
  const utm = isLikelyUtmBbox(bbox);
  const [minX, minY, maxX, maxY] = bbox;
  const stepX = niceStep(maxX - minX);
  const stepY = niceStep(maxY - minY);
  const innerW = rect.w - pad * 2;
  const innerH = rect.h - pad * 2;

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.12);
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);

  for (let x = Math.ceil(minX / stepX) * stepX; x <= maxX; x += stepX) {
    const px = rect.x + pad + ((x - minX) / (maxX - minX || 1)) * innerW;
    doc.line(px, rect.y + pad, px, rect.y + pad + innerH);
    const lbl = formatCoord(x, utm, "x");
    doc.text(lbl, px, rect.y + 4, { align: "center" });
    doc.text(lbl, px, rect.y + rect.h - 2, { align: "center" });
  }

  for (let y = Math.ceil(minY / stepY) * stepY; y <= maxY; y += stepY) {
    const py = rect.y + pad + (1 - (y - minY) / (maxY - minY || 1)) * innerH;
    doc.line(rect.x + pad, py, rect.x + pad + innerW, py);
    const lbl = formatCoord(y, utm, "y");
    doc.text(lbl, rect.x + 2, py + 1.5, { angle: 90 });
    doc.text(lbl, rect.x + rect.w - 2, py + 1.5, { angle: 90 });
  }
}

export function drawMcaNorthArrow(doc: jsPDF, x: number, y: number): void {
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.2);
  const tri = [x, y, x + 5, y + 14, x + 10, y];
  doc.lines([tri], 0, 0, [1, 1], "FD", true);
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text("N", x + 5, y + 18, { align: "center" });
}

export function drawMcaScaleBar(
  doc: jsPDF,
  bbox: McaPdfBbox,
  x: number,
  y: number,
): void {
  const utm = isLikelyUtmBbox(bbox);
  const [minX, , maxX] = bbox;
  const span = maxX - minX;
  let step = niceStep(span, 3);
  let unit = utm ? "m" : "km";
  let labelValues = [0, step, step * 2];

  if (!utm) {
    const km = span * 111 * Math.cos(((bbox[1] + bbox[3]) / 2) * (Math.PI / 180));
    step = niceStep(km, 3);
    labelValues = [0, step, step * 2];
    unit = "km";
  } else if (step >= 1000) {
    labelValues = labelValues.map((v) => v / 1000);
    unit = "km";
  }

  const barW = 28;
  const segW = barW / 2;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.25);
  doc.setFillColor(15, 23, 42);
  doc.rect(x, y, segW, 3, "FD");
  doc.setFillColor(255, 255, 255);
  doc.rect(x + segW, y, segW, 3, "FD");
  doc.rect(x, y, barW, 3, "S");

  doc.setFontSize(5.5);
  doc.setTextColor(15, 23, 42);
  for (let i = 0; i < labelValues.length; i++) {
    doc.text(String(labelValues[i]), x + i * segW, y + 6);
  }
  doc.text(unit, x + barW + 2, y + 3);
}

/** Inseto de localização (MG + propriedade). */
export function drawMcaLocationInset(
  doc: jsPDF,
  propertyBbox: McaPdfBbox,
  propertyRing: [number, number][] | null,
  rect: { x: number; y: number; w: number; h: number },
): void {
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.25);
  doc.setFillColor(255, 255, 255);
  doc.rect(rect.x, rect.y, rect.w, rect.h, "FD");

  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Localização", rect.x + rect.w / 2, rect.y + 3.5, { align: "center" });

  const inner: McaPdfMapRect = {
    x: rect.x + 2,
    y: rect.y + 5,
    w: rect.w - 4,
    h: rect.h - 7,
  };
  const pad = 2;
  doc.setFillColor(241, 245, 249);
  doc.rect(inner.x, inner.y, inner.w, inner.h, "F");

  const overview = MG_OVERVIEW_BBOX;
  const [minX, minY, maxX, maxY] = overview;
  const innerW = inner.w - pad * 2;
  const innerH = inner.h - pad * 2;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.15);
  doc.rect(
    inner.x + pad + innerW * 0.12,
    inner.y + pad + innerH * 0.15,
    innerW * 0.76,
    innerH * 0.7,
    "S",
  );
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text("MG", inner.x + inner.w / 2, inner.y + inner.h - 1.5, { align: "center" });

  if (propertyRing?.length) {
    const line = ringToPdfLine(propertyRing, overview, inner, pad);
    doc.setDrawColor(21, 128, 61);
    doc.setLineWidth(0.35);
    drawClosedLine(doc, line, "S");

    const cx = (propertyBbox[0] + propertyBbox[2]) / 2;
    const cy = (propertyBbox[1] + propertyBbox[3]) / 2;
    const [px, py] = projectLonLat(cx, cy, overview, inner, pad);
    if (Number.isFinite(px)) {
      doc.setFillColor(185, 28, 28);
      doc.circle(px, py, 0.8, "F");
    }
  }
}

export function ringFromPerimeterGeo(
  geojson: Record<string, unknown> | undefined,
): [number, number][] | null {
  if (!geojson || typeof geojson !== "object") return null;
  const g = geojson as { type?: string; coordinates?: [number, number][][] };
  if (g.type === "Polygon" && g.coordinates?.[0]?.length) return g.coordinates[0];
  if (g.type === "Feature") {
    const geom = (geojson as { geometry?: { type?: string; coordinates?: [number, number][][] } })
      .geometry;
    if (geom?.type === "Polygon" && geom.coordinates?.[0]?.length) return geom.coordinates[0];
  }
  if (g.type === "FeatureCollection") {
    const f = (geojson as { features?: { geometry?: { coordinates?: [number, number][][] } }[] })
      .features?.[0];
    const coords = f?.geometry?.coordinates?.[0];
    if (coords?.length) return coords;
  }
  return null;
}

export function drawMcaCartographicDecorations(
  doc: jsPDF,
  bbox: McaPdfBbox,
  mapInner: McaPdfMapRect,
  opts?: {
    propertyRing?: [number, number][] | null;
    insetRect?: { x: number; y: number; w: number; h: number };
  },
): void {
  drawMcaUtmGrid(doc, bbox, mapInner);
  drawMcaNorthArrow(doc, mapInner.x + 6, mapInner.y + mapInner.h - 22);
  drawMcaScaleBar(doc, bbox, mapInner.x + 6, mapInner.y + mapInner.h - 10);
  if (opts?.insetRect) {
    drawMcaLocationInset(doc, bbox, opts.propertyRing ?? null, opts.insetRect);
  }
}
