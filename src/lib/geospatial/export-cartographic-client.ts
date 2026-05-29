"use client";

import { jsPDF } from "jspdf";
import { CARTOGRAPHIC_PAGE_SIZE } from "@/lib/geospatial/cartographic-layout";
import {
  resolveWaveCartographicSheets,
  type ResolveCartographicSheetsOptions,
} from "@/lib/geospatial/resolve-cartographic-sheets";
import { svgStringToPngDataUrl } from "@/lib/geospatial/render-minimap-client";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";

export type CartographicExportFormat = "pdf" | "png" | "jpeg";

export type CartographicExportOptions = ResolveCartographicSheetsOptions & {
  layerId?: string | "all";
};

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
    .toLowerCase();
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

export async function exportCartographicFromWaveA(
  wave: WaveAAnalysisResult,
  format: CartographicExportFormat,
  options?: CartographicExportOptions,
): Promise<{ fileName: string; sheetCount: number }> {
  const date = new Date().toISOString().slice(0, 10);
  const sheets = await resolveWaveCartographicSheets(wave, options);

  if (!sheets.length) {
    throw new Error("Não foi possível gerar folhas cartográficas (perímetro inválido).");
  }

  const filtered =
    options?.layerId && options.layerId !== "all"
      ? sheets.filter((s) => s.layerId === options.layerId)
      : sheets;

  if (!filtered.length) {
    throw new Error("Camada não encontrada para exportação cartográfica.");
  }

  const baseName = slugify(options?.propertyName ?? "empreendimento") || "mapa";

  if (format === "png" || format === "jpeg") {
    const sheet = filtered[0]!;
    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    const png = await svgStringToPngDataUrl(
      sheet.svg,
      CARTOGRAPHIC_PAGE_SIZE.width,
      CARTOGRAPHIC_PAGE_SIZE.height,
    );
    let dataUrl = png;
    if (format === "jpeg") {
      const img = await loadImage(png);
      const canvas = document.createElement("canvas");
      canvas.width = CARTOGRAPHIC_PAGE_SIZE.width;
      canvas.height = CARTOGRAPHIC_PAGE_SIZE.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponível.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      dataUrl = canvas.toDataURL(mime, 0.92);
    }
    const ext = format === "jpeg" ? "jpg" : "png";
    const fileName = `mapa-${slugify(sheet.title)}-${baseName}-${date}.${ext}`;
    downloadDataUrl(dataUrl, fileName);
    return { fileName, sheetCount: 1 };
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let i = 0; i < filtered.length; i++) {
    if (i > 0) doc.addPage();
    const sheet = filtered[i]!;
    const png = await svgStringToPngDataUrl(
      sheet.svg,
      CARTOGRAPHIC_PAGE_SIZE.width,
      CARTOGRAPHIC_PAGE_SIZE.height,
    );
    doc.addImage(png, "PNG", 0, 0, pageW, pageH);
  }

  const fileName = `mapas-cartograficos-${baseName}-${date}.pdf`;
  doc.save(fileName);
  return { fileName, sheetCount: filtered.length };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao converter imagem."));
    img.src = src;
  });
}

/** Exporta cada folha como PNG (útil para pacote ZIP manual ou seleção múltipla). */
export async function exportAllCartographicPngs(
  wave: WaveAAnalysisResult,
  options?: CartographicExportOptions,
): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  const baseName = slugify(options?.propertyName ?? "empreendimento") || "mapa";
  const sheets = await resolveWaveCartographicSheets(wave, options);

  let count = 0;
  for (const sheet of sheets) {
    const png = await svgStringToPngDataUrl(
      sheet.svg,
      CARTOGRAPHIC_PAGE_SIZE.width,
      CARTOGRAPHIC_PAGE_SIZE.height,
    );
    const fileName = `mapa-${slugify(sheet.title)}-${baseName}-${date}.png`;
    downloadDataUrl(png, fileName);
    count += 1;
    await new Promise((r) => setTimeout(r, 350));
  }
  return count;
}
