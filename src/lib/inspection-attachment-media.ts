'use client';

import { effectiveMimeType, isPdfLikeFile } from '@/lib/file-mime';
import { isImageUploadFile } from '@/lib/upload-pipeline';
import { fetchBrandingImageAsBase64 } from '@/lib/branding-pdf';

/** Imagens (incl. extensão sem MIME no celular) e PDF para evidências de vistoria. */
export function isAllowedInspectionUploadFile(file: File): boolean {
  if (isPdfLikeFile(file)) return true;
  if (isImageUploadFile(file)) return true;
  const mime = effectiveMimeType(file);
  if (mime === 'image/heic' || mime === 'image/heif') return true;
  return /\.(heic|heif)$/i.test(file.name);
}

export function inspectionUploadContentType(file: File): string {
  const mime = effectiveMimeType(file);
  if (mime === 'image/jpg') return 'image/jpeg';
  if (mime.startsWith('image/')) return mime;
  if (isPdfLikeFile(file)) return 'application/pdf';
  return mime || 'application/octet-stream';
}

/** Proporção foto revelação 10×15 cm (2:3). */
export const INSPECTION_EVIDENCE_W_MM = 70;
export const INSPECTION_EVIDENCE_H_MM = 105;

const PDF_RENDER_MAX_BYTES = 5 * 1024 * 1024;
const PDF_RENDER_MAX_PAGES = 10;

function isFirebaseStorageHttpsUrl(url: string): boolean {
  return (
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('firebasestorage.app')
  );
}

/** URL para exibir no browser (evita CORS no Storage). */
export function inspectionAttachmentDisplayUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  if (isFirebaseStorageHttpsUrl(url)) {
    return `/api/branding/image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function isPdfAttachmentUrl(url: string): boolean {
  const u = url.split('?')[0].toLowerCase();
  return u.endsWith('.pdf') || u.includes('.pdf');
}

export function isImageAttachmentUrl(url: string): boolean {
  if (isPdfAttachmentUrl(url)) return false;
  let path = url.split('?')[0];
  try {
    if (path.includes('%')) path = decodeURIComponent(path);
  } catch {
    /* mantém path original */
  }
  const lower = path.toLowerCase();
  return (
    /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(lower) || lower.includes('image')
  );
}

export function attachmentKindLabel(url: string): 'PDF' | 'Imagem' | 'Arquivo' {
  if (isPdfAttachmentUrl(url)) return 'PDF';
  if (isImageAttachmentUrl(url)) return 'Imagem';
  return 'Arquivo';
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

/**
 * Híbrido: 1ª página do PDF como JPEG se tamanho/páginas aceitáveis; senão null (cartão de referência no laudo).
 */
export async function renderPdfFirstPageForInspection(
  url: string,
): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(inspectionAttachmentDisplayUrl(url), {
      credentials: 'same-origin',
      cache: 'default',
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size > PDF_RENDER_MAX_BYTES) return null;

    const pdfjs = await loadPdfJs();
    const data = new Uint8Array(await blob.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    if (pdf.numPages > PDF_RENDER_MAX_PAGES) return null;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.4 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch {
    return null;
  }
}

export type InspectionEvidencePdfImage = {
  dataUrl: string;
  format: 'PNG' | 'JPEG';
};

/** Carrega imagem para embutir no PDF da vistoria. */
export async function fetchInspectionImageForPdf(
  url: string,
): Promise<InspectionEvidencePdfImage | null> {
  const base64 = await fetchBrandingImageAsBase64(url);
  if (!base64) return null;
  const format = base64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
  return { dataUrl: base64, format };
}

/** Imagem ou 1ª página de PDF (híbrido) para o laudo. */
export async function resolveInspectionEvidenceForPdf(
  url: string,
): Promise<InspectionEvidencePdfImage | 'pdf_reference' | null> {
  if (isPdfAttachmentUrl(url)) {
    const jpeg = await renderPdfFirstPageForInspection(url);
    if (jpeg) return { dataUrl: jpeg, format: 'JPEG' };
    return 'pdf_reference';
  }
  if (isImageAttachmentUrl(url)) {
    return fetchInspectionImageForPdf(url);
  }
  const img = await fetchInspectionImageForPdf(url);
  if (img) return img;
  return 'pdf_reference';
}
