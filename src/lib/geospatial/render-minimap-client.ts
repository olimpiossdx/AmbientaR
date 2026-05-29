"use client";

/**
 * Preview e mini-mapas — módulo Análise Geoespacial (IA).
 * Não partilhar com src/lib/mca/* (Mapas / Estudos Técnicos).
 */

import {
  CARTOGRAPHIC_PAGE_SIZE,
} from "@/lib/geospatial/cartographic-layout";
import { perimeterToMinimapSvg } from "@/lib/geospatial/render-minimap";
import {
  resolveWaveCartographicSheets,
  type ResolveCartographicSheetsOptions,
} from "@/lib/geospatial/resolve-cartographic-sheets";
import type { GeoLayerResult, WaveAAnalysisResult } from "@/lib/types/geo-wave-a";

export async function svgStringToPngDataUrl(
  svg: string,
  width: number,
  height: number,
): Promise<string> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Falha ao carregar SVG do mini-mapa."));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type FactualMinimapSet = {
  locationPng: string | null;
  layerPngs: Record<string, string>;
};

/** Gera PNGs esquemáticos do perímetro (um geral + um rótulo por camada). */
export async function buildFactualMinimaps(
  wave: WaveAAnalysisResult,
): Promise<FactualMinimapSet> {
  const geo = wave.perimeter.geojson;
  const locationSvg = perimeterToMinimapSvg(geo, {
    title: "Localização — perímetro do empreendimento",
    subtitle: `${wave.perimeter.areaHa.toFixed(2)} ha`,
  });
  const locationPng = locationSvg
    ? await svgStringToPngDataUrl(locationSvg, 320, 220)
    : null;

  const layerPngs: Record<string, string> = {};
  for (const layer of wave.layers) {
    const svg = perimeterToMinimapSvg(geo, {
      layerId: layer.layerId,
      title: layer.title.slice(0, 48),
      subtitle: layer.status === "ok" ? "com interseção SIG" : layer.status,
    });
    if (svg) {
      layerPngs[layer.layerId] = await svgStringToPngDataUrl(svg, 280, 190);
    }
  }

  return { locationPng, layerPngs };
}

export function minimapLabelForLayer(layer: GeoLayerResult): string {
  return `${layer.title} [${layer.status}]`;
}

export type CartographicPngMap = Record<string, string>;

/** Folhas cartográficas GeoSIG (SVG→PNG) indexadas por layerId. */
export async function buildCartographicPngMap(
  wave: WaveAAnalysisResult,
  options?: ResolveCartographicSheetsOptions & {
    layerId?: string | "all";
  },
): Promise<CartographicPngMap> {
  const sheets = await resolveWaveCartographicSheets(wave, options);

  const filtered =
    options?.layerId && options.layerId !== "all"
      ? sheets.filter((sheet) => sheet.layerId === options.layerId)
      : sheets;

  const pngMap: CartographicPngMap = {};
  for (const sheet of filtered) {
    pngMap[sheet.layerId] = await svgStringToPngDataUrl(
      sheet.svg,
      CARTOGRAPHIC_PAGE_SIZE.width,
      CARTOGRAPHIC_PAGE_SIZE.height,
    );
  }
  return pngMap;
}
