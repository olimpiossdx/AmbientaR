'use client';

import imageCompression from 'browser-image-compression';
import { effectiveMimeType, isPdfLikeFile } from '@/lib/file-mime';
import { isAllowedInspectionUploadFile } from '@/lib/inspection-attachment-media';
import {
  isImageUploadFile,
  needsUploadPreparation,
} from '@/lib/upload-pipeline';
import { formatBytesHuman } from '@/lib/upload-limits';

/** Imagens já leves não precisam de recompressão. */
const LIGHT_SKIP_BYTES = 512 * 1024;
/** PDFs até este tamanho seguem como PDF (sem rasterizar). */
const PDF_KEEP_BYTES = 3 * 1024 * 1024;
const LIGHT_MAX_EDGE_PX = 2048;
const LIGHT_JPEG_QUALITY = 0.85;

export type PrepareInspectionUploadOptions = {
  maxBytes: number;
  /** Preparação pesada (diálogo) quando ainda excede o limite do sistema. */
  prepareHeavy?: (file: File) => Promise<File | null>;
  onProgress?: (message: string) => void;
};

function isHeicLike(file: File): boolean {
  const mime = effectiveMimeType(file);
  return mime === 'image/heic' || mime === 'image/heif' || /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);
}

function toOptimizedImageFile(blob: File, original: File): File {
  const base = (original.name.replace(/\.[^.]+$/i, '') || 'evidencia').slice(0, 120);
  return new File([blob], `${base}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

/**
 * Redimensiona e comprime imagem para evidência de vistoria (qualidade visual alta).
 */
export async function optimizeInspectionImageLight(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 16,
    maxWidthOrHeight: LIGHT_MAX_EDGE_PX,
    initialQuality: LIGHT_JPEG_QUALITY,
    useWebWorker: true,
    fileType: 'image/jpeg',
    preserveExif: false,
  });
  return toOptimizedImageFile(compressed, file);
}

/**
 * Filtro + otimização leve automática; diálogo só se ainda passar do limite (ex. 40 MB).
 */
export async function prepareInspectionEvidenceForUpload(
  file: File,
  options: PrepareInspectionUploadOptions,
): Promise<File | null> {
  const { maxBytes, prepareHeavy, onProgress } = options;

  if (!isAllowedInspectionUploadFile(file)) {
    throw new Error(
      'Tipo não permitido. Use foto (JPEG, PNG, WebP, HEIC) ou PDF.',
    );
  }

  let working = file;

  if (isImageUploadFile(file)) {
    const shouldOptimize =
      file.size > LIGHT_SKIP_BYTES || isHeicLike(file) || effectiveMimeType(file) === 'image/png';
    if (shouldOptimize) {
      onProgress?.('Otimizando imagem…');
      try {
        working = await optimizeInspectionImageLight(file);
      } catch (err) {
        console.warn('[inspection-upload] otimização leve falhou, original:', err);
        working = file;
      }
    }
  } else if (isPdfLikeFile(file)) {
    if (file.size <= PDF_KEEP_BYTES) {
      return file;
    }
    onProgress?.('Arquivo PDF grande — preparação avançada…');
  }

  if (!needsUploadPreparation(working, maxBytes)) {
    return working;
  }

  if (prepareHeavy) {
    const heavy = await prepareHeavy(working);
    return heavy;
  }

  if (working.size > maxBytes) {
    throw new Error(
      `O arquivo ainda excede ${formatBytesHuman(maxBytes)} após otimização. Tente outra foto ou PDF menor.`,
    );
  }

  return working;
}
