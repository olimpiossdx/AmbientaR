'use client';

import {
  isImageAttachmentUrl as isImageAttachmentUrlUtil,
  isPdfAttachmentUrl as isPdfAttachmentUrlUtil,
} from '@/lib/attachment-utils';
import { effectiveMimeType, isPdfLikeFile } from '@/lib/file-mime';
import { isImageUploadFile } from '@/lib/upload-pipeline';
import { fetchBrandingImageAsBase64, resizeDataUrlForPdf } from '@/lib/branding-pdf';
import {
  fetchStorageImageProxyBlob,
  isFirebaseStorageHttpsUrl,
} from '@/lib/storage-image-proxy-client';
import { loadPdfJsForBrowser } from '@/lib/pdfjs-worker';
import type { PDFPageProxy } from 'pdfjs-dist';

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

/** Limite de download para rasterizar PDF no laudo (browser). */
export const PDF_REPORT_MAX_BYTES = 15 * 1024 * 1024;
/** Máximo de páginas incorporadas por anexo PDF no relatório. */
export const PDF_REPORT_MAX_PAGES_EMBED = 10;
/** Largura alvo em px ao rasterizar PDF (≈ A4 legível no laudo; ~2× a miniatura anterior). */
export const PDF_REPORT_RENDER_TARGET_PX = 2000;
/** Limite de aresta ao embutir no jsPDF (evita falha silenciosa do addImage). */
const PDF_REPORT_JPEG_MAX_EDGE_PX = 2200;
/** Redimensiona fotos antes do PDF (caixa 10×15 cm no laudo). */
const PHOTO_PDF_MAX_EDGE_PX = 1400;

/** URL para `<img>` / preview (download URL do Storage; utilizador autenticado). */
export function inspectionAttachmentDisplayUrl(url: string): string {
  return url;
}

export function isPdfAttachmentUrl(url: string): boolean {
  return isPdfAttachmentUrlUtil(url);
}

export function isImageAttachmentUrl(url: string): boolean {
  if (isPdfAttachmentUrl(url)) return false;
  return isImageAttachmentUrlUtil(url);
}

export function attachmentKindLabel(url: string): 'PDF' | 'Imagem' | 'Arquivo' {
  if (isPdfAttachmentUrl(url)) return 'PDF';
  if (isImageAttachmentUrl(url)) return 'Imagem';
  return 'Arquivo';
}

async function fetchInspectionAttachmentBlob(
  url: string,
): Promise<{ blob: Blob; contentType: string } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const blob = isFirebaseStorageHttpsUrl(url)
      ? await fetchStorageImageProxyBlob(url)
      : await (async () => {
          const res = await fetch(url, {
            credentials: 'same-origin',
            cache: 'default',
          });
          if (!res.ok) return null;
          return res.blob();
        })();
    if (!blob || blob.type.includes('application/json')) {
      console.warn('[inspection-pdf] fetch anexo falhou:', url.slice(0, 80));
      return null;
    }
    const contentType = blob.type || '';
    return { blob, contentType };
  } catch (e) {
    console.warn('[inspection-pdf] fetch anexo falhou:', e);
    return null;
  }
}

async function blobLooksLikePdf(blob: Blob): Promise<boolean> {
  if (blob.type === 'application/pdf') return true;
  try {
    const head = await blob.slice(0, 5).text();
    return head.startsWith('%PDF');
  } catch {
    return false;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function blobToPhotoDataUrlForPdf(blob: Blob): Promise<string | null> {
  try {
    const raw = await blobToDataUrl(blob);
    const resized = await resizeDataUrlForPdf(raw, PHOTO_PDF_MAX_EDGE_PX);
    return resized.startsWith('data:image') ? resized : raw;
  } catch {
    return null;
  }
}

export type InspectionPdfPageImage = {
  dataUrl: string;
  format: 'JPEG' | 'PNG';
  pageNumber: number;
  totalPages: number;
  /** true se o PDF original tem mais páginas do que as incorporadas. */
  truncated?: boolean;
};

/**
 * Rasteriza até {@link PDF_REPORT_MAX_PAGES_EMBED} páginas de um blob PDF.
 */
async function rasterizePdfPageToJpeg(
  page: PDFPageProxy,
  targetWidthPx: number,
): Promise<string | null> {
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = targetWidthPx / baseViewport.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas.toDataURL('image/jpeg', 0.88);
}

export async function renderPdfPagesFromBlob(
  blob: Blob,
): Promise<InspectionPdfPageImage[] | null> {
  if (typeof window === 'undefined') return null;
  if (blob.size > PDF_REPORT_MAX_BYTES) {
    console.warn('[inspection-pdf] PDF excede limite de tamanho para o laudo');
    return null;
  }
  const targetWidths = [PDF_REPORT_RENDER_TARGET_PX, 1600, 1200, 900];
  try {
    const pdfjs = await loadPdfJsForBrowser();
    const data = new Uint8Array(await blob.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const totalPages = pdf.numPages;
    const pagesToRender = Math.min(totalPages, PDF_REPORT_MAX_PAGES_EMBED);
    const truncated = totalPages > pagesToRender;
    const pages: InspectionPdfPageImage[] = [];

    for (let pageNum = 1; pageNum <= pagesToRender; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      let dataUrl: string | null = null;
      for (const targetPx of targetWidths) {
        try {
          dataUrl = await rasterizePdfPageToJpeg(page, targetPx);
          if (dataUrl) break;
        } catch {
          /* tenta resolução menor (limite de canvas no dev local) */
        }
      }
      if (!dataUrl) continue;
      const sized = await resizeDataUrlForPdf(dataUrl, PDF_REPORT_JPEG_MAX_EDGE_PX);
      const embedUrl = sized.startsWith('data:image') ? sized : dataUrl;
      const format: 'JPEG' | 'PNG' = embedUrl.startsWith('data:image/png')
        ? 'PNG'
        : 'JPEG';
      pages.push({
        dataUrl: embedUrl,
        format,
        pageNumber: pageNum,
        totalPages,
        truncated: pageNum === pagesToRender && truncated ? true : undefined,
      });
    }

    return pages.length > 0 ? pages : null;
  } catch (e) {
    console.warn('[inspection-pdf] rasterizar PDF falhou:', e);
    return null;
  }
}

/** Rasteriza PDF a partir da URL (proxy Storage). */
export async function renderPdfPagesForInspectionReport(
  url: string,
): Promise<InspectionPdfPageImage[] | null> {
  const fetched = await fetchInspectionAttachmentBlob(url);
  if (!fetched) return null;
  const isPdf =
    (await blobLooksLikePdf(fetched.blob)) || isPdfAttachmentUrl(url);
  if (!isPdf) return null;
  return renderPdfPagesFromBlob(fetched.blob);
}

/** @deprecated Use renderPdfPagesForInspectionReport — mantém 1ª página para compatibilidade. */
export async function renderPdfFirstPageForInspection(
  url: string,
): Promise<string | null> {
  const pages = await renderPdfPagesForInspectionReport(url);
  return pages?.[0]?.dataUrl ?? null;
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

export type InspectionAttachmentPdfResolved =
  | { kind: 'pages'; pages: InspectionPdfPageImage[] }
  | { kind: 'image'; dataUrl: string; format: 'PNG' | 'JPEG' }
  | { kind: 'pdf_reference' };

/** Resolve anexo para embutir no relatório PDF (imagens ou até 10 páginas de PDF). */
export async function resolveInspectionAttachmentForReport(
  url: string,
): Promise<InspectionAttachmentPdfResolved> {
  const fetched = await fetchInspectionAttachmentBlob(url);

  if (fetched) {
    const isPdf =
      (await blobLooksLikePdf(fetched.blob)) || isPdfAttachmentUrl(url);
    if (isPdf) {
      const pages = await renderPdfPagesFromBlob(fetched.blob);
      if (pages?.length) return { kind: 'pages', pages };
      return { kind: 'pdf_reference' };
    }

    const isImage =
      fetched.contentType.startsWith('image/') || isImageAttachmentUrl(url);
    if (isImage) {
      const dataUrl = await blobToPhotoDataUrlForPdf(fetched.blob);
      if (dataUrl) {
        const format = dataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        return { kind: 'image', dataUrl, format };
      }
    }
  }

  if (isPdfAttachmentUrl(url)) {
    const pages = await renderPdfPagesForInspectionReport(url);
    if (pages?.length) return { kind: 'pages', pages };
    return { kind: 'pdf_reference' };
  }

  const img = await fetchInspectionImageForPdf(url);
  if (img) return { kind: 'image', dataUrl: img.dataUrl, format: img.format };
  return { kind: 'pdf_reference' };
}

/** Imagem ou 1ª página de PDF (compatibilidade). */
export async function resolveInspectionEvidenceForPdf(
  url: string,
): Promise<InspectionEvidencePdfImage | 'pdf_reference' | null> {
  const resolved = await resolveInspectionAttachmentForReport(url);
  if (resolved.kind === 'pages') {
    const first = resolved.pages[0];
    return { dataUrl: first.dataUrl, format: first.format };
  }
  if (resolved.kind === 'image') {
    return { dataUrl: resolved.dataUrl, format: resolved.format };
  }
  return 'pdf_reference';
}
