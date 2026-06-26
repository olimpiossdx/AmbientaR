import * as turf from "@turf/turf";
import type { GeoJSON } from "geojson";
import type { FadChangeAnalysisType, FadChangePolygon } from "./types";

const GRID = 8;
const DIFF_THRESHOLD = 0.12;

function chunkDiff(a: Buffer, b: Buffer, index: number, total: number): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  const size = Math.floor(len / total);
  const start = index * size;
  const end = index === total - 1 ? len : start + size;
  let diff = 0;
  for (let i = start; i < end; i++) {
    diff += Math.abs(a[i]! - b[i]!);
  }
  return diff / Math.max(1, end - start) / 255;
}

function cellToPolygon(
  bbox: [number, number, number, number],
  gx: number,
  gy: number,
): GeoJSON.Polygon {
  const [minX, minY, maxX, maxY] = bbox;
  const dx = (maxX - minX) / GRID;
  const dy = (maxY - minY) / GRID;
  const x0 = minX + gx * dx;
  const x1 = minX + (gx + 1) * dx;
  const y0 = minY + gy * dy;
  const y1 = minY + (gy + 1) * dy;
  return {
    type: "Polygon",
    coordinates: [
      [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
        [x0, y0],
      ],
    ],
  };
}

function classifyCell(before: Buffer, after: Buffer, index: number): FadChangeAnalysisType {
  const bGreen = before[index % before.length] ?? 0;
  const aGreen = after[index % after.length] ?? 0;
  if (aGreen < bGreen - 8) return "vegetation_loss";
  if (aGreen > bGreen + 8) return "vegetation_gain";
  return "bare_soil_exposure";
}

export async function runInlineChangeDetection(params: {
  beforeUrl: string;
  afterUrl: string;
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  bbox: [number, number, number, number];
}): Promise<{
  polygons: FadChangePolygon[];
  summary: { lossHa: number; gainHa: number; bareHa: number; totalChangedHa: number };
  confidence: number;
}> {
  const [beforeRes, afterRes] = await Promise.all([
    fetch(params.beforeUrl, { signal: AbortSignal.timeout(120_000) }),
    fetch(params.afterUrl, { signal: AbortSignal.timeout(120_000) }),
  ]);

  if (!beforeRes.ok || !afterRes.ok) {
    throw new Error("Não foi possível descarregar as previews para análise.");
  }

  const beforeBuf = Buffer.from(await beforeRes.arrayBuffer());
  const afterBuf = Buffer.from(await afterRes.arrayBuffer());
  const totalCells = GRID * GRID;
  const polygons: FadChangePolygon[] = [];
  const aoiFeature = turf.feature(params.aoi);

  let lossHa = 0;
  let gainHa = 0;
  let bareHa = 0;

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const idx = gy * GRID + gx;
      const score = chunkDiff(beforeBuf, afterBuf, idx, totalCells);
      if (score < DIFF_THRESHOLD) continue;

      const geometry = cellToPolygon(params.bbox, gx, gy);
      const center = turf.center(geometry);
      if (!turf.booleanPointInPolygon(center, aoiFeature)) continue;
      const areaHa = turf.area(geometry) / 10_000;
      if (areaHa < 0.01) continue;

      const type = classifyCell(beforeBuf, afterBuf, idx);
      const confidence = Math.min(0.65, 0.35 + score);

      polygons.push({ type, geometry, areaHa: Math.round(areaHa * 100) / 100, confidence });

      if (type === "vegetation_loss") lossHa += areaHa;
      else if (type === "vegetation_gain") gainHa += areaHa;
      else bareHa += areaHa;
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100;

  return {
    polygons,
    summary: {
      lossHa: round(lossHa),
      gainHa: round(gainHa),
      bareHa: round(bareHa),
      totalChangedHa: round(lossHa + gainHa + bareHa),
    },
    confidence: polygons.length ? 0.45 : 0.2,
  };
}
