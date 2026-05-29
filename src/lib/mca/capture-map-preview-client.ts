"use client";

import type { FeatureCollection } from "geojson";
import { mcaLayersToPreviewSvg } from "./map-preview-svg";
import {
  mcaPreviewBboxFromCollections,
  mcaPreviewProject,
  type McaPreviewBbox,
} from "./map-preview-bbox";
import { svgStringToPngDataUrl } from "./svg-to-png-client";

const ESRI_TILE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const TILE_SIZE = 256;

function lonLatToTile(lon: number, lat: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x, y };
}

function tileToLonLat(x: number, y: number, zoom: number): [number, number] {
  const n = 2 ** zoom;
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  return [lon, (latRad * 180) / Math.PI];
}

function chooseSatelliteZoom(bbox: McaPreviewBbox, targetWidth: number): number {
  const [minX, minY, maxX, maxY] = bbox;
  for (let z = 19; z >= 8; z--) {
    const nw = lonLatToTile(minX, maxY, z);
    const se = lonLatToTile(maxX, minY, z);
    const px = (se.x - nw.x + 1) * TILE_SIZE;
    if (px <= targetWidth * 2.2) return z;
  }
  return 10;
}

async function loadTileImage(z: number, x: number, y: number): Promise<HTMLImageElement | null> {
  const url = ESRI_TILE.replace("{z}", String(z)).replace("{y}", String(y)).replace("{x}", String(x));
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function drawSatelliteBasemap(
  ctx: CanvasRenderingContext2D,
  bbox: McaPreviewBbox,
  width: number,
  height: number,
  pad: number,
): Promise<boolean> {
  const z = chooseSatelliteZoom(bbox, width - pad * 2);
  const [minX, minY, maxX, maxY] = bbox;
  const nw = lonLatToTile(minX, maxY, z);
  const se = lonLatToTile(maxX, minY, z);

  let drawn = 0;
  for (let tx = nw.x; tx <= se.x; tx++) {
    for (let ty = nw.y; ty <= se.y; ty++) {
      const img = await loadTileImage(z, tx, ty);
      if (!img) continue;
      const [lonL] = tileToLonLat(tx, ty, z);
      const [, latT] = tileToLonLat(tx, ty, z);
      const [lonR] = tileToLonLat(tx + 1, ty + 1, z);
      const [, latB] = tileToLonLat(tx + 1, ty + 1, z);
      const [x0, y0] = mcaPreviewProject(lonL, latT, bbox, width, height, pad);
      const [x1, y1] = mcaPreviewProject(lonR, latB, bbox, width, height, pad);
      ctx.drawImage(img, x0, y1, x1 - x0, y0 - y1);
      drawn++;
    }
  }
  return drawn > 0;
}

/** Composito satélite Esri + overlay vetorial MCA → PNG/JPEG data URL. */
export async function captureMcaSatelliteMapPng(opts: {
  perimeter: FeatureCollection | null;
  layers: Record<string, FeatureCollection>;
  width?: number;
  height?: number;
}): Promise<string | null> {
  const width = opts.width ?? 960;
  const height = opts.height ?? 672;
  const pad = 16;

  const layerFcs = Object.values(opts.layers).filter((fc) => fc?.features?.length);
  const bbox = mcaPreviewBboxFromCollections(opts.perimeter, ...layerFcs);
  if (!bbox) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0, 0, width, height);

  const satOk = await drawSatelliteBasemap(ctx, bbox, width, height, pad);
  if (!satOk) return null;

  const overlaySvg = mcaLayersToPreviewSvg(opts.perimeter, opts.layers, width, height, {
    background: "none",
    drawLines: true,
    drawPoints: true,
  });
  if (overlaySvg) {
    const overlayUrl = await svgStringToPngDataUrl(overlaySvg, width, height, {
      skipBackgroundFill: true,
    });
    const overlayImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Overlay MCA falhou."));
      el.src = overlayUrl;
    });
    ctx.drawImage(overlayImg, 0, 0, width, height);
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

/** Satélite + layers; fallback para SVG cinza se tiles falharem. */
export async function captureMcaMapPreviewForPdf(opts: {
  perimeter: FeatureCollection | null;
  layers: Record<string, FeatureCollection>;
  width?: number;
  height?: number;
  preferSatellite?: boolean;
}): Promise<{ dataUrl: string; mode: "satellite" | "vector" } | null> {
  const width = opts.width ?? 960;
  const height = opts.height ?? 672;

  if (opts.preferSatellite !== false) {
    try {
      const sat = await captureMcaSatelliteMapPng({
        perimeter: opts.perimeter,
        layers: opts.layers,
        width,
        height,
      });
      if (sat) return { dataUrl: sat, mode: "satellite" };
    } catch {
      /* fallback */
    }
  }

  const svg = mcaLayersToPreviewSvg(opts.perimeter, opts.layers, width, height);
  if (!svg) return null;
  const dataUrl = await svgStringToPngDataUrl(svg, width, height);
  return { dataUrl, mode: "vector" };
}
