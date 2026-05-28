/**
 * Layout cartográfico estilo Pimenta Consultoria (mapas IDE-Sisema / CF Agrícola).
 * Gera SVG pronto para PNG, JPEG, PDF ou incorporação em DOCX.
 */

import type { GeoLayerResult, GeoLayerStat, GeoPerimeter } from "@/lib/types/geo-wave-a";

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

export type CartographicSheetInput = {
  title: string;
  perimeter: GeoPerimeter;
  layer?: GeoLayerResult;
  branding?: CartographicBranding;
  meta?: CartographicSheetMeta;
};

const PAGE_W = 1123;
const PAGE_H = 794;

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

  const bbox = input.perimeter.bbox;
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
  const insetPoints = projectRing(ring, insetBbox, sideX + 12, mapY + 12, sideW - 24, 118);
  const bar = scaleBarMeters(mainBbox, utm);

  const classificationItems = input.layer?.stats?.length
    ? legendFromStats(input.layer.stats)
    : [];

  const layerSummary = input.layer?.summary
    ? `<text x="${sideX + 14}" y="${mapY + 200}" font-size="8" fill="#475569">${esc(input.layer.summary.slice(0, 120))}${input.layer.summary.length > 120 ? "…" : ""}</text>`
    : "";

  let legendY = mapY + 168;
  const classLegend = classificationItems.length
    ? classificationItems
        .map((item, i) => {
          const ly = legendY + 14 + i * 16;
          return `<rect x="${sideX + 14}" y="${ly - 9}" width="14" height="10" fill="${item.color}" stroke="#0f172a" stroke-width="0.4"/>
      <text x="${sideX + 34}" y="${ly}" font-size="9" fill="#0f172a">${esc(item.label)}</text>`;
        })
        .join("\n")
    : `<text x="${sideX + 14}" y="${legendY + 20}" font-size="9" fill="#64748b">Sem classes mensuráveis nesta camada.</text>`;

  const metaY = mapY + 380;
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
  ${drawGrid(mainBbox, mapX, mapY, mapW, mapH, utm)}
  <polygon points="${mainPoints}" fill="url(#perimHatch)" stroke="#0f172a" stroke-width="2"/>
  ${northArrow(mapX + 24, mapY + mapH - 72)}
  ${scaleBarSvg(mapX + 24, mapY + mapH - 42, bar)}

  <rect x="${sideX}" y="${mapY}" width="${sideW}" height="132" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
  <text x="${sideX + sideW / 2}" y="${mapY + 10}" text-anchor="middle" font-size="8" fill="#64748b">Mapa de localização</text>
  <rect x="${sideX + 10}" y="${mapY + 14}" width="${sideW - 20}" height="112" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="0.5"/>
  <polygon points="${insetPoints}" fill="url(#perimHatch)" stroke="#0f172a" stroke-width="1.2"/>

  <rect x="${sideX}" y="${mapY + 138}" width="${sideW}" height="${classificationItems.length ? 120 + classificationItems.length * 16 : 88}" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>
  <rect x="${sideX + 14}" y="${mapY + 152}" width="18" height="12" fill="url(#perimHatch)" stroke="#0f172a" stroke-width="0.6"/>
  <text x="${sideX + 38}" y="${mapY + 162}" font-size="9" fill="#0f172a">${esc(propertyLabel)}</text>
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

/** Uma folha por camada SIG + folha de localização. */
export function buildWaveACartographicSheets(
  wave: {
    perimeter: GeoPerimeter;
    layers: GeoLayerResult[];
    factualSummary?: string;
  },
  options?: {
    propertyName?: string;
    branding?: CartographicBranding;
    meta?: CartographicSheetMeta;
  },
): CartographicSheetBundle[] {
  const meta: CartographicSheetMeta = {
    ...options?.meta,
    propertyLabel: options?.propertyName ?? options?.meta?.propertyLabel,
  };
  const sheets: CartographicSheetBundle[] = [];

  const locationSvg = buildCartographicSheetSvg({
    title: options?.propertyName
      ? `Localização — ${options.propertyName}`
      : "Localização do empreendimento",
    perimeter: wave.perimeter,
    branding: options?.branding,
    meta,
  });
  if (locationSvg) {
    sheets.push({ layerId: "_localizacao", title: "Localização", svg: locationSvg });
  }

  for (const layer of wave.layers) {
    const svg = buildCartographicSheetSvg({
      title: layer.title,
      perimeter: wave.perimeter,
      layer,
      branding: options?.branding,
      meta,
    });
    if (svg) {
      sheets.push({ layerId: layer.layerId, title: layer.title, svg });
    }
  }
  return sheets;
}

export const CARTOGRAPHIC_PAGE_SIZE = { width: PAGE_W, height: PAGE_H };
