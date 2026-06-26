"use client";

import { loadPdfJsForBrowser } from "@/lib/pdfjs-worker";
import { formatBytesHuman } from "@/lib/upload-limits";
import type { PrepareFileProgress } from "@/lib/upload-pipeline";

const PDF_PRESETS: Array<{ scale: number; quality: number; label: string }> = [
  { scale: 2, quality: 0.85, label: "alta" },
  { scale: 1.5, quality: 0.72, label: "média" },
  { scale: 1.2, quality: 0.6, label: "compacta" },
];

function fileFromBlob(blob: Blob, name: string, type: string): File {
  return new File([blob], name, { type, lastModified: Date.now() });
}

function report(progress: PrepareFileProgress | undefined, pct: number, msg: string) {
  progress?.(Math.min(100, Math.max(0, pct)), msg);
}

/** Compressão de PDF por rasterização — carregado só quando necessário (evita pdfjs no grafo inicial). */
export async function compressPdfFile(
  file: File,
  maxBytes: number,
  onProgress?: PrepareFileProgress,
): Promise<{ file: File; effectiveDpi?: number; previewUrl?: string }> {
  const pdfjs = await loadPdfJsForBrowser();
  const data = new Uint8Array(await file.arrayBuffer());
  report(onProgress, 5, "Lendo PDF…");
  const pdf = await pdfjs.getDocument({ data }).promise;
  const numPages = pdf.numPages;

  const { jsPDF } = await import("jspdf");

  for (const preset of PDF_PRESETS) {
    report(onProgress, 15, `Gerando PDF (${preset.label})…`);
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    let maxDpi: number | undefined;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: preset.scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponível para compressão de PDF.");
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      const pageWidthMm = (viewport.width / preset.scale) * 0.352778;
      const dpi = viewport.width / (pageWidthMm / 25.4);
      if (maxDpi == null || dpi > maxDpi) maxDpi = Math.round(dpi);

      const imgData = canvas.toDataURL("image/jpeg", preset.quality);
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      const ratio = Math.min(
        pdfWidth / imgProps.width,
        pdfHeight / imgProps.height,
      );
      const w = imgProps.width * ratio;
      const h = imgProps.height * ratio;
      if (pageNum > 1) doc.addPage();
      doc.addImage(imgData, "JPEG", 0, 0, w, h, undefined, "FAST");
      report(
        onProgress,
        15 + (pageNum / numPages) * 70,
        `Página ${pageNum}/${numPages}…`,
      );
    }

    const blob = doc.output("blob");
    if (blob.size <= maxBytes) {
      const out = fileFromBlob(
        blob,
        file.name.replace(/\.pdf$/i, "") + ".pdf",
        "application/pdf",
      );
      const previewUrl = URL.createObjectURL(blob);
      return { file: out, effectiveDpi: maxDpi, previewUrl };
    }
  }

  throw new Error(
    `Não foi possível reduzir o PDF abaixo de ${formatBytesHuman(maxBytes)}. Tente um arquivo menor ou comprima externamente.`,
  );
}
