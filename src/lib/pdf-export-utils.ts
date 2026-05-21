"use client";

import type jsPDF from "jspdf";

/** Qualidade JPEG recomendada para imagens embutidas em relatórios PDF. */
export const PDF_EMBED_JPEG_QUALITY = 0.85;

/**
 * Converte data URL de imagem para JPEG (menor que PNG em fotos/gráficos raster).
 */
export async function imageDataUrlToJpegForPdf(
  dataUrl: string,
  quality = PDF_EMBED_JPEG_QUALITY,
): Promise<string> {
  if (dataUrl.startsWith("data:image/jpeg")) return dataUrl;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 1;
        canvas.height = img.naturalHeight || 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D indisponível"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Falha ao carregar imagem para PDF"));
    img.src = dataUrl;
  });
}

/** Renderiza uma linha justificada (espaçamento entre palavras). */
export function drawJustifiedLine(
  doc: jsPDF,
  line: string,
  x: number,
  y: number,
  maxWidth: number,
): void {
  const words = line.split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= 1) {
    doc.text(line, x, y);
    return;
  }
  const totalTextWidth = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
  const totalSpace = maxWidth - totalTextWidth;
  const spacePerGap = totalSpace / (words.length - 1);
  let cx = x;
  for (let i = 0; i < words.length; i++) {
    doc.text(words[i], cx, y);
    cx += doc.getTextWidth(words[i]) + spacePerGap;
  }
}

export type JustifiedTextBlockOptions = {
  x: number;
  maxWidth: number;
  lineHeight: number;
  /** Limite Y inferior do conteúdo (acima do rodapé). */
  contentBottomY: number;
  contentStartY: number;
  onNewPage: () => void;
};

/**
 * Escreve texto com parágrafos justificados (última linha de cada bloco alinhada à esquerda).
 * Retorna a posição Y após o bloco.
 */
export function addJustifiedTextBlock(
  doc: jsPDF,
  text: string,
  startY: number,
  opts: JustifiedTextBlockOptions,
): number {
  const lines: string[] = doc.splitTextToSize(text, opts.maxWidth);
  let y = startY;
  for (let i = 0; i < lines.length; i++) {
    if (y > opts.contentBottomY) {
      opts.onNewPage();
      y = opts.contentStartY;
    }
    const trimmed = String(lines[i]).trim();
    if (!trimmed) {
      y += opts.lineHeight * 0.5;
      continue;
    }
    const isLastLine = i === lines.length - 1;
    if (!isLastLine && trimmed.includes(" ")) {
      drawJustifiedLine(doc, trimmed, opts.x, y, opts.maxWidth);
    } else {
      doc.text(trimmed, opts.x, y);
    }
    y += opts.lineHeight;
  }
  return y;
}

/** Download via Blob com compressão DEFLATE do PDF (jsPDF 2.x). */
export function downloadJsPdf(doc: jsPDF, filename: string): void {
  const safeName = filename
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "_");
  const finalName = safeName.toLowerCase().endsWith(".pdf")
    ? safeName
    : `${safeName}.pdf`;
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = finalName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
