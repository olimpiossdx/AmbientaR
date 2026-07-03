/**
 * Layout cartográfico — módulo Análise Geoespacial (IA).
 * Rota: /analise-ambiental · Código: src/lib/geospatial/*
 *
 * Independente do submenu Mapas (Estudos Técnicos / MCA): src/lib/mca/*, /studies/mapas.
 * Não importar código MCA daqui; integração futura apenas via dados/APIs explícitas.
 */

import type { GeoLayerResult, GeoLayerStat, GeoPerimeter } from "@/lib/types/geo-wave-a";
import type { GeoInfluenceAreas } from "@/lib/types/geo-wave-a";

export type CartographicBranding = {
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type CartographicSheetMeta = {
  propertyLabel?: string;
  projectionLabel?: string;
  dataSource?: string;
  projectAuthor?: string;
};

export type CartographicOverlayRing = {
  ring: [number, number][];
  stroke: string;
  fill?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  dashArray?: string;
  label?: string;
};

export type CartographicSheetInput = {
  title: string;
  perimeter: GeoPerimeter;
  layer?: GeoLayerResult;
  branding?: CartographicBranding;
  meta?: CartographicSheetMeta;
  overlayRings?: CartographicOverlayRing[];
  satelliteBackgroundHref?: string;
  mapBbox?: [number, number, number, number];
};

const PAGE_W = 1123;
const PAGE_H = 794;

/** Extent MG para inseto estatal (estilo Pimenta / QGIS). */
const MG_STATE_BBOX: [number, number, number, number] = [-51.5, -23.5, -39.8, -14.0];

const CLASS_COLORS: { match: RegExp; color: string; label: string }[] = [
  { match: /muito\s*alta/i, color: "#c41e3a", label: "Muito alta" },
  { match: /^alta$/i, color: "#f59e0b", label: "Alta" },
  { match: /média|media/i, color: "#86efac", label: "Média" },
  { match: /^baixa$/i, color: "#7dd3fc", label: "Baixa" },
  { match: /muito\s*baixa/i, color: "#1e3a8a", label: "Muito baixa" },
];

function esc(text: string): string {
  return text.replace(/[<>&"]/g, (c) => {
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === "&") return "&amp;";
    return "&quot;";
  });
}

function ringFromPerimeter(geojson: Record<string, unknown>): [number, number][] | null {
  const g = geojson as { type?: string; coordinates?: [number, number][][] };
  if (g.type !== "Polygon" || !g.coordinates?.[0]?.length) return null;
  return g.coordinates[0];
}

function unionBbox(
  boxes: ([number, number, number, number] | undefined)[],
): [number, number, number, number] | null {
  const valid = boxes.filter(Boolean) as [number, number, number, number][];
  if (!valid.length) return null;
  let minX = valid[0]![0];
  let minY = valid[0]![1];
  let maxX = valid[0]![2];
  let maxY = valid[0]![3];
  for (const b of valid.slice(1)) {
    minX = Math.min(minX, b[0]);
    minY = Math.min(minY, b[1]);
    maxX = Math.max(maxX, b[2]);
    maxY = Math.max(maxY, b[3]);
  }
  return [minX, minY, maxX, maxY];
}

function bboxFromRing(ring: [number, number][]): [number, number, number, number] {
  let minX = ring[0]![0];
  let minY = ring[0]![1];
  let maxX = ring[0]![0];
  let maxY = ring[0]![1];
  for (const [x, y] of ring) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return [minX, minY, maxX, maxY];
}

function expandBbox(
  bbox: [number, number, number, number],
  factor: number,
): [number, number, number, number] {
  const [minX, minY, maxX, maxY] = bbox;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const halfW = ((maxX - minX) / 2) * factor;
  const halfH = ((maxY - minY) / 2) * factor;
  return [cx - halfW, cy - halfH, cx + halfW, cy + halfH];
}

function isLikelyUtm(bbox: [number, number, number, number]): boolean {
  const [minX, minY, maxX, maxY] = bbox;
  return (
    Math.abs(minX) > 180 ||
    Math.abs(maxX) > 180 ||
    Math.abs(minY) > 90 ||
    Math.abs(maxY) > 90
  );
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
  return `${abs.toFixed(3)}°${hemi}`;
}

function projectRing(
  ring: [number, number][],
  bbox: [number, number, number, number],
  x: number,
  y: number,
  w: number,
  h: number,
  pad = 28,
): string {
  const [minX, minY, maxX, maxY] = bbox;
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  return ring
    .map(([lon, lat]) => {
      const px = x + pad + ((lon - minX) / spanX) * innerW;
      const py = y + pad + (1 - (lat - minY) / spanY) * innerH;
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");
}

function scaleBarMeters(bbox: [number, number, number, number], utm: boolean): {
  label: string;
  widthPx: number;
  segments: number[];
} {
  const [minX, , maxX] = bbox;
  const span = maxX - minX;
  if (!utm) {
    const km = span * 111 * Math.cos(((bbox[1] + bbox[3]) / 2) * (Math.PI / 180));
    const stepKm = niceStep(km, 3);
    const seg = [0, stepKm, stepKm * 2];
    return {
      label: "km",
      widthPx: 90,
      segments: seg,
    };
  }
  const stepM = niceStep(span, 3);
  const seg = [0, stepM, stepM * 2];
  const useKm = stepM >= 1000;
  return {
    label: useKm ? "km" : "m",
    widthPx: 90,
    segments: useKm ? seg.map((v) => v / 1000) : seg,
  };
}

function legendFromStats(stats: GeoLayerStat[]): { label: string; color: string }[] {
  const items: { label: string; color: string }[] = [];
  const seen = new Set<string>();
  for (const row of stats) {
    const label = row.label.trim();
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    const hit = CLASS_COLORS.find((c) => c.match.test(label));
    items.push({
      label: label.length > 52 ? `${label.slice(0, 49)}…` : label,
      color: hit?.color ?? "#94a3b8",
    });
    if (items.length >= 12) break;
  }
  return items;
}

function drawGrid(
  bbox: [number, number, number, number],
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  utm: boolean,
): string {
  const [minX, minY, maxX, maxY] = bbox;
  const stepX = niceStep(maxX - minX);
  const stepY = niceStep(maxY - minY);
  const lines: string[] = [];
  const labels: string[] = [];
  const pad = 28;
  const innerW = mapW - pad * 2;
  const innerH = mapH - pad * 2;

  for (let x = Math.ceil(minX / stepX) * stepX; x <= maxX; x += stepX) {
    const px = mapX + pad + ((x - minX) / (maxX - minX || 1)) * innerW;
    lines.push(
      `<line x1="${px}" y1="${mapY + pad}" x2="${px}" y2="${mapY + mapH - pad}" stroke="#0f172a" stroke-width="0.6"/>`,
    );
    const lbl = formatCoord(x, utm, "x");
    labels.push(
      `<text x="${px}" y="${mapY + 14}" text-anchor="middle" font-size="9" fill="#0f172a">${esc(lbl)}</text>`,
    );
    labels.push(
      `<text x="${px}" y="${mapY + mapH - 8}" text-anchor="middle" font-size="9" fill="#0f172a">${esc(lbl)}</text>`,
    );
  }
  for (let y = Math.ceil(minY / stepY) * stepY; y <= maxY; y += stepY) {
    const py = mapY + pad + (1 - (y - minY) / (maxY - minY || 1)) * innerH;
    lines.push(
      `<line x1="${mapX + pad}" y1="${py}" x2="${mapX + mapW - pad}" y2="${py}" stroke="#0f172a" stroke-width="0.6"/>`,
    );
    const lbl = formatCoord(y, utm, "y");
    labels.push(
      `<text x="${mapX + 12}" y="${py + 3}" text-anchor="middle" font-size="9" fill="#0f172a" transform="rotate(-90 ${mapX + 12} ${py})">${esc(lbl)}</text>`,
    );
    labels.push(
      `<text x="${mapX + mapW - 10}" y="${py + 3}" text-anchor="middle" font-size="9" fill="#0f172a" transform="rotate(-90 ${mapX + mapW - 10} ${py})">${esc(lbl)}</text>`,
    );
  }
  return lines.join("\n") + labels.join("\n");
}

function northArrow(x: number, y: number): string {
  return `
  <g transform="translate(${x},${y})">
    <polygon points="8,0 16,22 8,18 0,22" fill="#0f172a"/>
    <text x="8" y="34" text-anchor="middle" font-size="9" font-weight="600" fill="#0f172a">N</text>
  </g>`;
}

function scaleBarSvg(x: number, y: number, bar: ReturnType<typeof scaleBarMeters>): string {
  const segW = bar.widthPx / (bar.segments.length - 1 || 1);
  const rects = bar.segments
    .slice(0, -1)
    .map(
      (_, i) =>
        `<rect x="${x + i * segW}" y="${y}" width="${segW}" height="6" fill="${i % 2 === 0 ? "#0f172a" : "#ffffff"}" stroke="#0f172a" stroke-width="0.5"/>`,
    )
    .join("");
  const labels = bar.segments
    .map(
      (v, i) =>
        `<text x="${x + i * segW}" y="${y + 14}" font-size="8" fill="#0f172a">${v}${bar.label === "km" ? "" : ""}</text>`,
    )
    .join("");
  return `${rects}${labels}<text x="${x + bar.widthPx + 4}" y="${y + 6}" font-size="8" fill="#0f172a">${bar.label}</text>`;
}

/** Folha cartográfica completa em SVG (A4 paisagem, 1123×794). */
export function buildCartographicSheetSvg(input: CartographicSheetInput): string | null {
  const ring = ringFromPerimeter(input.perimeter.geojson);
  if (!ring?.length) return null;

  const overlayRings = input.overlayRings ?? [];
  const bbox =
    input.mapBbox ??
    unionBbox([
      input.perimeter.bbox,
      ...overlayRings.map((o) => bboxFromRing(o.ring)),
    ]) ??
    input.perimeter.bbox;
  const utm = isLikelyUtm(bbox);
  const mainBbox = bbox;
  const insetBbox = expandBbox(bbox, 4);

  const title = input.title.trim() || "Análise geoespacial";
  const propertyLabel = input.meta?.propertyLabel ?? "Perímetro do Empreendimento";
  const projection =
    input.meta?.projectionLabel ??
    (utm ? "SIRGAS 2000 / UTM zone 23S" : "EPSG: 4989 — SIRGAS 2000");
  const dataSource = input.meta?.dataSource ?? "IDE-SISEMA";
  const projectAuthor = input.meta?.projectAuthor ?? "—";
  const branding = input.branding ?? {
    companyName: "Pimenta Consultoria Ambiental",
    address: "Unaí — MG",
    email: "pimentambiental@hotmail.com",
  };

  const mapX = 24;
  const mapY = 58;
  const mapW = 700;
  const mapH = 640;
  const sideX = 738;
  const sideW = 360;

  const mainPoints = projectRing(ring, mainBbox, mapX, mapY, mapW, mapH);
  const insetLocalH = 88;
  const insetMgH = 72;
  const insetPoints = projectRing(
    ring,
    insetBbox,
    sideX + 12,
    mapY + 14,
    sideW - 24,
    insetLocalH,
  );
  const mgInsetPoints = projectRing(
    ring,
    MG_STATE_BBOX,
    sideX + 12,
    mapY + 14 + insetLocalH + 10,
    sideW - 24,
    insetMgH,
  );
  const overlaySvg = overlayRings
    .map((overlay) => {
      const pts = projectRing(overlay.ring, mainBbox, mapX, mapY, mapW, mapH);
      const fill = overlay.fill ?? "none";
      const fillOpacity = overlay.fillOpacity ?? 0.12;
      const strokeWidth = overlay.strokeWidth ?? 1.5;
      const dash = overlay.dashArray ? ` stroke-dasharray="${overlay.dashArray}"` : "";
      return `<polygon points="${pts}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${overlay.stroke}" stroke-width="${strokeWidth}"${dash}/>`;
    })
    .join("\n");
  const satelliteLayer = input.satelliteBackgroundHref
    ? `<image href="${input.satelliteBackgroundHref.replace(/"/g, "&quot;")}" x="${mapX + 28}" y="${mapY + 28}" width="${mapW - 56}" height="${mapH - 56}" preserveAspectRatio="xMidYMid slice" opacity="0.88"/>`
    : "";
  const bar = scaleBarMeters(mainBbox, utm);

  const classificationItems = input.layer?.stats?.length
    ? legendFromStats(input.layer.stats)
    : [];

  const insetBlockH = insetLocalH + insetMgH + 28;
  const legendBoxY = mapY + insetBlockH;
  const legendY = legendBoxY + 68;

  const layerSummary = input.layer?.summary
    ? `<text x="${sideX + 14}" y="${legendY + 36}" font-size="8" fill="#475569">${esc(input.layer.summary.slice(0, 120))}${input.layer.summary.length > 120 ? "…" : ""}</text>`
    : "";
  const classLegend = classificationItems.length
    ? classificationItems
        .map((item, i) => {
          const ly = legendY + 14 + i * 16;
          return `<rect x="${sideX + 14}" y="${ly - 9}" width="14" height="10" fill="${item.color}" stroke="#0f172a" stroke-width="0.4"/>
      <text x="${sideX + 34}" y="${ly}" font-size="9" fill="#0f172a">${esc(item.label)}</text>`;
        })
        .join("\n")
    : `<text x="${sideX + 14}" y="${legendY + 20}" font-size="9" fill="#64748b">Sem classes mensuráveis nesta camada.</text>`;

  const metaY = legendBoxY + (classificationItems.length ? 132 + classificationItems.length * 16 : 100);
  const brandY = mapY + 500;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
  <defs>
    <pattern id="perimHatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#0f172a" stroke-width="1.2"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <rect x="8" y="8" width="${PAGE_W - 16}" height="${PAGE_H - 16}" fill="none" stroke="#0f172a" stroke-width="1.2"/>

  <rect x="${(PAGE_W - 520) / 2}" y="16" width="520" height="32" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
  <text x="${PAGE_W / 2}" y="37" text-anchor="middle" font-size="14" font-weight="700" fill="#0f172a">${esc(title.toUpperCase())}</text>

  <rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" fill="#f8fafc" stroke="#0f172a" stroke-width="1"/>
  ${satelliteLayer}
  ${drawGrid(mainBbox, mapX, mapY, mapW, mapH, utm)}
  ${overlaySvg}
  <polygon points="${mainPoints}" fill="url(#perimHatch)" stroke="#ca8a04" stroke-width="2"/>
  ${northArrow(mapX + 24, mapY + mapH - 72)}
  ${scaleBarSvg(mapX + 24, mapY + mapH - 42, bar)}

  <rect x="${sideX}" y="${mapY}" width="${sideW}" height="${insetLocalH + insetMgH + 28}" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
  <text x="${sideX + sideW / 2}" y="${mapY + 10}" text-anchor="middle" font-size="8" fill="#64748b">Mapa de localização (regional)</text>
  <rect x="${sideX + 10}" y="${mapY + 14}" width="${sideW - 20}" height="${insetLocalH}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="0.5"/>
  <polygon points="${insetPoints}" fill="url(#perimHatch)" stroke="#0f172a" stroke-width="1.2"/>
  <text x="${sideX + sideW / 2}" y="${mapY + insetLocalH + 22}" text-anchor="middle" font-size="8" fill="#64748b">Minas Gerais</text>
  <rect x="${sideX + 10}" y="${mapY + insetLocalH + 26}" width="${sideW - 20}" height="${insetMgH}" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="0.5"/>
  <polygon points="${mgInsetPoints}" fill="url(#perimHatch)" stroke="#b91c1c" stroke-width="1.4"/>

  <rect x="${sideX}" y="${legendBoxY}" width="${sideW}" height="${classificationItems.length ? 120 + classificationItems.length * 16 : 88}" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
  <rect x="${sideX + 14}" y="${legendBoxY + 14}" width="18" height="12" fill="url(#perimHatch)" stroke="#0f172a" stroke-width="0.6"/>
  <text x="${sideX + 38}" y="${legendBoxY + 24}" font-size="9" fill="#0f172a">${esc(propertyLabel)}</text>
  ${classificationItems.length ? `<text x="${sideX + 14}" y="${legendY}" font-size="9" font-weight="600" fill="#0f172a">Classificações</text>` : ""}
  ${classLegend}
  ${layerSummary}

  <rect x="${sideX}" y="${metaY}" width="${sideW}" height="108" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
  <text x="${sideX + 14}" y="${metaY + 18}" font-size="9" font-weight="600" fill="#0f172a">Projeção e Datum</text>
  <text x="${sideX + 14}" y="${metaY + 32}" font-size="9" fill="#0f172a">${esc(projection)}</text>
  <text x="${sideX + 14}" y="${metaY + 48}" font-size="9" font-weight="600" fill="#0f172a">Dados</text>
  <text x="${sideX + 14}" y="${metaY + 62}" font-size="9" fill="#0f172a">${esc(dataSource)}</text>
  <text x="${sideX + 14}" y="${metaY + 78}" font-size="9" font-weight="600" fill="#0f172a">Projeto</text>
  <text x="${sideX + 14}" y="${metaY + 92}" font-size="9" fill="#0f172a">${esc(projectAuthor)}</text>

  <rect x="${sideX}" y="${brandY}" width="${sideW}" height="${mapY + mapH - brandY}" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
  <text x="${sideX + sideW / 2}" y="${brandY + 28}" text-anchor="middle" font-size="13" font-weight="700" fill="#b91c1c">${esc((branding.companyName ?? "").split(" ")[0] ?? "PIMENTA")}</text>
  <text x="${sideX + sideW / 2}" y="${brandY + 44}" text-anchor="middle" font-size="10" fill="#0f172a">${esc(branding.companyName ?? "Consultoria Ambiental")}</text>
  ${branding.address ? `<text x="${sideX + sideW / 2}" y="${brandY + 62}" text-anchor="middle" font-size="8" fill="#475569">${esc(branding.address)}</text>` : ""}
  ${branding.phone ? `<text x="${sideX + sideW / 2}" y="${brandY + 76}" text-anchor="middle" font-size="8" fill="#475569">${esc(branding.phone)}</text>` : ""}
  ${branding.email ? `<text x="${sideX + sideW / 2}" y="${brandY + 90}" text-anchor="middle" font-size="8" fill="#475569">${esc(branding.email)}</text>` : ""}

  <text x="${mapX + 8}" y="${mapY + mapH - 6}" font-size="7" fill="#64748b">Área: ${input.perimeter.areaHa.toFixed(2)} ha · AmbientaR / SIG MG</text>
</svg>`;
}

export type CartographicSheetBundle = {
  layerId: string;
  title: string;
  svg: string;
};

const INFLUENCE_STYLE: Record<
  "ada" | "aid" | "aii",
  { stroke: string; fill: string; dash?: string }
> = {
  ada: { stroke: "#ca8a04", fill: "#facc15" },
  aid: { stroke: "#0891b2", fill: "#22d3ee", dash: "6 4" },
  aii: { stroke: "#0f172a", fill: "#64748b", dash: "3 5" },
};

function influenceOverlayRings(
  areas: GeoInfluenceAreas,
  focus: "ada" | "aid" | "aii" | "all",
): CartographicOverlayRing[] {
  const items: { key: "ada" | "aid" | "aii"; poly: GeoInfluenceAreas["ada"] | null }[] = [
    { key: "ada", poly: areas.ada },
    { key: "aid", poly: areas.aid },
    { key: "aii", poly: areas.aii },
  ];
  const rings: CartographicOverlayRing[] = [];
  for (const item of items) {
    if (!item.poly) continue;
    if (focus !== "all" && item.key !== focus) continue;
    const r = ringFromPerimeter(item.poly.geojson);
    if (!r) continue;
    const style = INFLUENCE_STYLE[item.key];
    rings.push({
      ring: r,
      stroke: style.stroke,
      fill: style.fill,
      fillOpacity: item.key === "ada" ? 0.35 : 0.18,
      strokeWidth: item.key === "ada" ? 2.2 : 1.6,
      dashArray: style.dash,
      label: item.poly.title,
    });
  }
  if (focus === "all") return rings;
  const contextKeys = focus === "ada" ? [] : focus === "aid" ? (["ada"] as const) : (["ada", "aid"] as const);
  for (const key of contextKeys) {
    const poly = key === "ada" ? areas.ada : areas.aid;
    if (!poly) continue;
    const r = ringFromPerimeter(poly.geojson);
    if (!r) continue;
    const style = INFLUENCE_STYLE[key];
    rings.unshift({
      ring: r,
      stroke: style.stroke,
      fill: style.fill,
      fillOpacity: 0.08,
      strokeWidth: 1,
      dashArray: style.dash,
    });
  }
  return rings;
}

function influenceMapBbox(areas: GeoInfluenceAreas): [number, number, number, number] {
  return (
    unionBbox([areas.ada.bbox, areas.aid?.bbox, areas.aii?.bbox]) ?? areas.ada.bbox
  );
}

/** Uma folha por camada SIG + folha de localização + áreas de influência. */
export function buildWaveACartographicSheets(
  wave: {
    perimeter: GeoPerimeter;
    layers: GeoLayerResult[];
    factualSummary?: string;
    influenceAreas?: GeoInfluenceAreas;
  },
  options?: {
    propertyName?: string;
    branding?: CartographicBranding;
    meta?: CartographicSheetMeta;
    satelliteBackgroundHref?: string;
    influenceAreas?: GeoInfluenceAreas;
    thematicOverlaysByLayerId?: Record<string, CartographicOverlayRing[]>;
  },
): CartographicSheetBundle[] {
  const meta: CartographicSheetMeta = {
    ...options?.meta,
    propertyLabel: options?.propertyName ?? options?.meta?.propertyLabel,
  };
  const satelliteHref = options?.satelliteBackgroundHref;
  const influence = options?.influenceAreas ?? wave.influenceAreas;
  const sheets: CartographicSheetBundle[] = [];

  const locationSvg = buildCartographicSheetSvg({
    title: options?.propertyName
      ? `Localização — ${options.propertyName}`
      : "Localização do empreendimento",
    perimeter: wave.perimeter,
    branding: options?.branding,
    meta,
    satelliteBackgroundHref: satelliteHref,
  });
  if (locationSvg) {
    sheets.push({ layerId: "_localizacao", title: "Localização", svg: locationSvg });
  }

  if (influence) {
    const mapBbox = influenceMapBbox(influence);
    const influenceTargets: { id: string; title: string; focus: "ada" | "aid" | "aii" }[] = [
      { id: "_ada", title: "Área diretamente afetada (ADA)", focus: "ada" },
    ];
    if (influence.aid) {
      influenceTargets.push({
        id: "_aid",
        title: "Área de influência direta (AID)",
        focus: "aid",
      });
    }
    if (influence.aii) {
      influenceTargets.push({
        id: "_aii",
        title: "Área de influência indireta (AII)",
        focus: "aii",
      });
    }
    for (const target of influenceTargets) {
      const focusPoly =
        target.focus === "ada"
          ? influence.ada
          : target.focus === "aid"
            ? influence.aid
            : influence.aii;
      if (!focusPoly) continue;
      const svg = buildCartographicSheetSvg({
        title: target.title,
        perimeter: {
          geojson: focusPoly.geojson,
          areaHa: focusPoly.areaHa,
          source: wave.perimeter.source,
          bbox: focusPoly.bbox,
        },
        branding: options?.branding,
        meta: { ...meta, dataSource: "Delimitação do empreendimento / buffer" },
        overlayRings: influenceOverlayRings(influence, target.focus),
        mapBbox,
        satelliteBackgroundHref: satelliteHref,
      });
      if (svg) sheets.push({ layerId: target.id, title: target.title, svg });
    }
  }

  for (const layer of wave.layers) {
    const svg = buildCartographicSheetSvg({
      title: layer.title,
      perimeter: wave.perimeter,
      layer,
      branding: options?.branding,
      meta,
      satelliteBackgroundHref: satelliteHref,
      overlayRings: options?.thematicOverlaysByLayerId?.[layer.layerId],
    });
    if (svg) {
      sheets.push({ layerId: layer.layerId, title: layer.title, svg });
    }
  }
  return sheets;
}

export const CARTOGRAPHIC_PAGE_SIZE = { width: PAGE_W, height: PAGE_H };
