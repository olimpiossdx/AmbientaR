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
