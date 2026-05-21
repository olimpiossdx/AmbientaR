"use client";

import imageCompression from "browser-image-compression";
import PizZip from "pizzip";
import { effectiveMimeType, isPdfLikeFile } from "@/lib/file-mime";
import { formatBytesHuman } from "@/lib/upload-limits";
import { loadPdfJsForBrowser } from "@/lib/pdfjs-worker";

export type PrepareFileProgress = (percent: number, message: string) => void;

export type PrepareFileResult = {
  file: File;
  originalSize: number;
  finalSize: number;
  wasCompressed: boolean;
  method: string;
  previewUrl?: string;
  effectiveDpi?: number;
  warnings: string[];
  rasterizedPdf?: boolean;
};

export type PrepareFileOptions = {
  maxBytes: number;
  onProgress?: PrepareFileProgress;
};

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const OFFICE_EXT = /\.(docx|xlsx|xls|doc)$/i;
const ZIP_EXT = /\.zip$/i;

/** Limite de segurança antes de compressão (evita OOM no browser). */
const RAW_FILE_SAFETY_MAX = 150 * 1024 * 1024;

const PDF_PRESETS: Array<{ scale: number; quality: number; label: string }> = [
  { scale: 2, quality: 0.85, label: "alta" },
  { scale: 1.5, quality: 0.72, label: "média" },
  { scale: 1.2, quality: 0.6, label: "compacta" },
];

function report(progress: PrepareFileOptions["onProgress"], pct: number, msg: string) {
  progress?.(Math.min(100, Math.max(0, pct)), msg);
}

function fileFromBlob(blob: Blob, name: string, type: string): File {
  return new File([blob], name, { type, lastModified: Date.now() });
}

export function isImageUploadFile(file: File): boolean {
  const mime = effectiveMimeType(file);
  if (IMAGE_MIME.has(mime)) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
}

export function isOfficeZipUploadFile(file: File): boolean {
  return OFFICE_EXT.test(file.name);
}

export function isZipUploadFile(file: File): boolean {
  if (effectiveMimeType(file) === "application/zip") return true;
  return ZIP_EXT.test(file.name);
}

export function needsUploadPreparation(file: File, maxBytes: number): boolean {
  return file.size > maxBytes;
}

async function compressImageFile(
  file: File,
  maxBytes: number,
  onProgress?: PrepareFileProgress,
): Promise<File> {
  report(onProgress, 10, "Otimizando imagem…");
  const maxSizeMB = Math.max(0.1, maxBytes / (1024 * 1024) - 0.05);
  let quality = 0.88;
  let maxWidthOrHeight = 2560;
  let last: File = file;

  for (let attempt = 0; attempt < 5; attempt++) {
    last = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      initialQuality: quality,
      useWebWorker: true,
      onProgress: (p) => report(onProgress, 10 + (p / 100) * 70, "Comprimindo imagem…"),
    });
    if (last.size <= maxBytes) return last;
    quality -= 0.12;
    maxWidthOrHeight = Math.round(maxWidthOrHeight * 0.85);
    if (quality < 0.35) break;
  }
  return last;
}

async function compressPdfFile(
  file: File,
  maxBytes: number,
  onProgress?: PrepareFileProgress,
): Promise<{ file: File; effectiveDpi?: number; previewUrl?: string }> {
  const pdfjs = await loadPdfJsForBrowser();
  const data = new Uint8Array(await file.arrayBuffer());
  report(onProgress, 5, "Lendo PDF…");
  const pdf = await pdfjs.getDocument({ data }).promise;
  const numPages = pdf.numPages;
  const warnings: string[] = [];

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
      const out = fileFromBlob(blob, file.name.replace(/\.pdf$/i, "") + ".pdf", "application/pdf");
      const previewUrl = URL.createObjectURL(blob);
      return { file: out, effectiveDpi: maxDpi, previewUrl };
    }
  }

  throw new Error(
    `Não foi possível reduzir o PDF abaixo de ${formatBytesHuman(maxBytes)}. Tente um arquivo menor ou comprima externamente.`,
  );
}

const OFFICE_MEDIA_PATH =
  /^(word\/media\/|xl\/media\/|ppt\/media\/)/i;

async function compressEmbeddedImageBuffer(
  buffer: Uint8Array,
  name: string,
  maxBytes: number,
): Promise<Uint8Array | null> {
  try {
    const mime = effectiveMimeType({ name } as File);
    if (!IMAGE_MIME.has(mime) && !/\.(jpe?g|png|webp)$/i.test(name)) {
      return null;
    }
    const blob = new Blob([buffer.slice()]);
    const file = fileFromBlob(blob, name.split("/").pop() || "img.jpg", mime || "image/jpeg");
    const compressed = await compressImageFile(file, Math.min(maxBytes, file.size), undefined);
    return new Uint8Array(await compressed.arrayBuffer());
  } catch {
    return null;
  }
}

async function recompressZipBlob(
  file: File,
  maxBytes: number,
  onProgress?: PrepareFileProgress,
): Promise<File> {
  report(onProgress, 20, "Recompactando arquivo…");
  const zip = new PizZip(await file.arrayBuffer());
  const paths = Object.keys(zip.files);

  for (const path of paths) {
    const entry = zip.files[path];
    if (!entry || entry.dir) continue;
    if (OFFICE_MEDIA_PATH.test(path)) {
      const raw = entry.asUint8Array();
      const smaller = await compressEmbeddedImageBuffer(raw, path, maxBytes / 4);
      if (smaller && smaller.length < raw.length) {
        zip.file(path, smaller);
      }
    }
  }

  const blob = zip.generate({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  }) as Blob;

  return fileFromBlob(blob, file.name, effectiveMimeType(file) || "application/zip");
}

export async function prepareFileForUpload(
  file: File,
  options: PrepareFileOptions,
): Promise<PrepareFileResult> {
  const { maxBytes, onProgress } = options;
  const originalSize = file.size;
  const warnings: string[] = [];

  if (file.size > RAW_FILE_SAFETY_MAX) {
    throw new Error(
      `Arquivo muito grande para processar no navegador (máx. ${formatBytesHuman(RAW_FILE_SAFETY_MAX)}).`,
    );
  }

  if (file.size <= maxBytes) {
    return {
      file,
      originalSize,
      finalSize: file.size,
      wasCompressed: false,
      method: "none",
      warnings: [],
    };
  }

  report(onProgress, 0, "Preparando arquivo…");

  if (isImageUploadFile(file)) {
    const compressed = await compressImageFile(file, maxBytes, onProgress);
    if (compressed.size > maxBytes) {
      throw new Error(
        `Não foi possível reduzir a imagem abaixo de ${formatBytesHuman(maxBytes)}.`,
      );
    }
    report(onProgress, 100, "Concluído");
    return {
      file: compressed,
      originalSize,
      finalSize: compressed.size,
      wasCompressed: true,
      method: "image",
      previewUrl: URL.createObjectURL(compressed),
      warnings,
    };
  }

  if (isPdfLikeFile(file)) {
    const { file: compressed, effectiveDpi, previewUrl } = await compressPdfFile(
      file,
      maxBytes,
      onProgress,
    );
    warnings.push(
      "O PDF foi convertido em imagens por página; texto pode deixar de ser selecionável.",
    );
    report(onProgress, 100, "Concluído");
    return {
      file: compressed,
      originalSize,
      finalSize: compressed.size,
      wasCompressed: true,
      method: "pdf-raster",
      previewUrl,
      effectiveDpi,
      warnings,
      rasterizedPdf: true,
    };
  }

  if (isOfficeZipUploadFile(file) || isZipUploadFile(file)) {
    let current = file;
    for (let i = 0; i < 2 && current.size > maxBytes; i++) {
      current = await recompressZipBlob(current, maxBytes, onProgress);
    }
    if (current.size > maxBytes) {
      warnings.push(
        "A recompactação reduziu pouco o tamanho; o arquivo pode conter conteúdo já comprimido.",
      );
      throw new Error(
        `Não foi possível reduzir o arquivo abaixo de ${formatBytesHuman(maxBytes)}. Reduza externamente ou divida o conteúdo.`,
      );
    }
    report(onProgress, 100, "Concluído");
    return {
      file: current,
      originalSize,
      finalSize: current.size,
      wasCompressed: true,
      method: "zip-deflate",
      warnings,
    };
  }

  throw new Error(
    `Tipo de arquivo não suportado para compressão automática. Limite: ${formatBytesHuman(maxBytes)}.`,
  );
}

export function revokePrepareFilePreview(result?: PrepareFileResult | null) {
  if (result?.previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(result.previewUrl);
  }
}
