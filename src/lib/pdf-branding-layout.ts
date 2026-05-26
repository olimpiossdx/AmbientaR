/**
 * Layout unificado de identidade visual (cabeçalho, rodapé, marca d'água) em PDFs jsPDF.
 * Referência: contratos + PDF modelo do utilizador (A4, marca d'água atrás do texto).
 */

import type jsPDF from 'jspdf';
import type { BrandingImageUrls, BrandingPdfImages } from '@/lib/branding-pdf';
import {
  brandingPdfMissingSlots,
  calcPdfImageSize,
  fetchBrandingImagesForPdf,
  getImageDimensions,
} from '@/lib/branding-pdf';
import { brandingUrlsFromLocal } from '@/lib/branding/urls';
import {
  BRANDING_REQUIRED_MESSAGE,
  BRANDING_SETUP_PATH,
  getBrandingMissingSlots,
  hasCompleteBrandingImages,
  hasCompleteBrandingUrls,
} from '@/lib/branding/requirements';

export type PdfUnit = 'mm' | 'cm';

export type PdfBrandingMargins = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** Margens padrão em mm (propostas, DRE, faturas). */
export const PDF_BRANDING_MARGINS_MM: PdfBrandingMargins = {
  left: 15,
  right: 15,
  top: 15,
  bottom: 28,
};

/** Margens padrão em cm (contratos). */
export const PDF_BRANDING_MARGINS_CM: PdfBrandingMargins = {
  left: 2,
  right: 2,
  top: 3,
  bottom: 2,
};

export type PdfBrandingLoaded = {
  images: BrandingPdfImages;
  missing: string[];
  unit: PdfUnit;
  margins: PdfBrandingMargins;
  headerSize: { w: number; h: number } | null;
  footerSize: { w: number; h: number } | null;
  watermarkWidth: number;
};

function detectPdfUnit(doc: jsPDF): PdfUnit {
  const w = doc.internal.pageSize.getWidth();
  return w > 50 ? 'mm' : 'cm';
}

/** Escala visual do cabeçalho (~84,5% do tamanho base; +30% sobre 0,65). */
const PDF_HEADER_DISPLAY_SCALE = 0.845;

/** Referência física A4 — igual em faturas (mm) e contratos (cm convertido). */
const PDF_HEADER_MAX_HEIGHT_MM = 15;
const PDF_HEADER_TOP_OFFSET_MM = 10;
const PDF_FOOTER_MAX_HEIGHT_MM = 20;

function mmToUnit(mm: number, unit: PdfUnit): number {
  return unit === 'mm' ? mm : mm / 10;
}

function contentWidthToMm(contentWidth: number, unit: PdfUnit): number {
  return unit === 'mm' ? contentWidth : contentWidth * 10;
}

function defaultWatermarkWidth(unit: PdfUnit): number {
  return unit === 'mm' ? 100 : 10;
}

async function computeHeaderSize(
  headerBase64: string | null,
  contentWidth: number,
  unit: PdfUnit,
): Promise<{ w: number; h: number } | null> {
  if (!headerBase64) return null;
  const dims = await getImageDimensions(headerBase64);
  const sizeMm = calcPdfImageSize(
    dims,
    contentWidthToMm(contentWidth, unit),
    PDF_HEADER_MAX_HEIGHT_MM,
  );
  return {
    w: mmToUnit(sizeMm.w, unit),
    h: mmToUnit(sizeMm.h, unit),
  };
}

async function computeFooterSize(
  footerBase64: string | null,
  contentWidth: number,
  unit: PdfUnit,
): Promise<{ w: number; h: number } | null> {
  if (!footerBase64) return null;
  const dims = await getImageDimensions(footerBase64);
  const sizeMm = calcPdfImageSize(
    dims,
    contentWidthToMm(contentWidth, unit),
    PDF_FOOTER_MAX_HEIGHT_MM,
  );
  return {
    w: mmToUnit(sizeMm.w, unit),
    h: mmToUnit(sizeMm.h, unit),
  };
}

export { brandingUrlsFromLocal } from '@/lib/branding/urls';

/** Carrega imagens e calcula tamanhos para o documento. */
export async function loadPdfBranding(
  doc: jsPDF,
  urls: BrandingImageUrls,
  margins?: PdfBrandingMargins,
  watermarkOpacity = 0.15,
  preloadedImages?: BrandingPdfImages | null,
): Promise<PdfBrandingLoaded> {
  const unit = detectPdfUnit(doc);
  const m = margins ?? (unit === 'mm' ? PDF_BRANDING_MARGINS_MM : PDF_BRANDING_MARGINS_CM);
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - m.left - m.right;

  const images =
    preloadedImages ?? (await fetchBrandingImagesForPdf(urls, watermarkOpacity));
  const missing = brandingPdfMissingSlots(urls, images);

  const [headerRaw, footerSize] = await Promise.all([
    computeHeaderSize(images.headerBase64, contentWidth, unit),
    computeFooterSize(images.footerBase64, contentWidth, unit),
  ]);

  const headerSize = headerRaw
    ? {
        w: headerRaw.w * PDF_HEADER_DISPLAY_SCALE,
        h: headerRaw.h * PDF_HEADER_DISPLAY_SCALE,
      }
    : null;

  return {
    images,
    missing,
    unit,
    margins: m,
    headerSize,
    footerSize,
    watermarkWidth: defaultWatermarkWidth(unit),
  };
}

/** Marca d'água na página atual — chamar ANTES do texto (fica visualmente atrás). */
export function drawWatermarkOnPage(doc: jsPDF, branding: PdfBrandingLoaded): void {
  const { watermarkBase64 } = branding.images;
  if (!watermarkBase64) return;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const w = branding.watermarkWidth;
  let h = w;
  try {
    const imgProps = doc.getImageProperties(watermarkBase64);
    if (imgProps.width > 0 && imgProps.height > 0) {
      h = w / (imgProps.width / imgProps.height);
    }
  } catch {
    /* mantém quadrado se metadados falharem */
  }
  try {
    doc.addImage(
      watermarkBase64,
      'PNG',
      (pageWidth - w) / 2,
      (pageHeight - h) / 2,
      w,
      h,
    );
  } catch (e) {
    console.warn('[pdf-branding] marca d\'água não desenhada:', e);
  }
}

/** Y inicial do conteúdo (abaixo do cabeçalho na 1ª página). */
export function getContentStartY(
  branding: PdfBrandingLoaded,
  headerTopOffset?: number,
): number {
  const { margins, headerSize, unit } = branding;
  const top = headerTopOffset ?? mmToUnit(PDF_HEADER_TOP_OFFSET_MM, unit);
  if (headerSize) {
    return top + headerSize.h + mmToUnit(5, unit);
  }
  return margins.top + mmToUnit(5, unit);
}

/** Limite inferior útil para quebra de página (acima do rodapé). */
export function getContentBottomLimit(doc: jsPDF, branding: PdfBrandingLoaded): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerH = branding.footerSize?.h ?? 0;
  const pad = branding.unit === 'mm' ? 8 : 0.5;
  return pageHeight - branding.margins.bottom - footerH - pad;
}

/** Nova página + marca d'água; retorna Y inicial do conteúdo (abaixo do cabeçalho). */
export function addBrandedPage(
  doc: jsPDF,
  branding: PdfBrandingLoaded,
  headerTopOffset?: number,
): number {
  doc.addPage();
  drawWatermarkOnPage(doc, branding);
  return getContentStartY(branding, headerTopOffset);
}

/** Cabeçalho, rodapé e numeração em todas as páginas (chamar ao final). */
export function finalizePdfBranding(
  doc: jsPDF,
  branding: PdfBrandingLoaded,
  options?: {
    pageNumberBottomMargin?: number;
    headerX?: number;
    headerY?: number;
    footerBottomPad?: number;
  },
): void {
  const { images, headerSize, footerSize, margins, unit } = branding;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margins.left - margins.right;
  const headerX = options?.headerX ?? margins.left;
  const headerY = options?.headerY ?? mmToUnit(PDF_HEADER_TOP_OFFSET_MM, unit);
  const footerPad = options?.footerBottomPad ?? (unit === 'mm' ? 5 : 0.3);
  const pageNumMargin = options?.pageNumberBottomMargin ?? (unit === 'mm' ? 10 : 0.8);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (images.headerBase64 && headerSize) {
      try {
        doc.addImage(
          images.headerBase64,
          'PNG',
          headerX,
          headerY,
          headerSize.w,
          headerSize.h,
        );
      } catch (e) {
        console.warn('[pdf-branding] cabeçalho não desenhado na página', i, e);
      }
    }
    if (images.footerBase64 && footerSize) {
      const footerW = footerSize.w;
      const footerH = footerSize.h;
      const fx = margins.left + (contentWidth - footerW) / 2;
      try {
        doc.addImage(
          images.footerBase64,
          'PNG',
          fx,
          pageHeight - footerH - footerPad,
          footerW,
          footerH,
        );
      } catch (e) {
        console.warn('[pdf-branding] rodapé não desenhado na página', i, e);
      }
    }
  }

  addPageNumbers(doc, pageNumMargin);
}

/** Numeração página/total no canto inferior direito. */
export function addPageNumbers(doc: jsPDF, bottomMargin: number = 10): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${i}/${pageCount}`, pageWidth - bottomMargin, pageHeight - bottomMargin, {
      align: 'right',
    });
  }
}

export type BrandingPdfToastReporter = (payload: {
  variant?: 'default' | 'destructive';
  title: string;
  description: string;
}) => void;

/** Toast padronizado quando URLs existem mas imagens não carregaram. */
export type MmBrandedPdfSession = {
  doc: jsPDF;
  branding: PdfBrandingLoaded;
  margins: PdfBrandingMargins;
  contentWidth: number;
  /** Y inicial após marca d'água (1ª página). */
  startY: number;
  ensureSpace: (currentY: number, neededMm: number) => number;
  finalize: () => void;
};

/** Sessão padrão A4 em mm para relatórios financeiros e similares. */
export async function createMmBrandedPdfSession(
  urls: BrandingImageUrls,
  margins: PdfBrandingMargins = PDF_BRANDING_MARGINS_MM,
  preloadedImages?: BrandingPdfImages | null,
): Promise<MmBrandedPdfSession> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const branding = await loadPdfBranding(doc, urls, margins, 0.15, preloadedImages);
  drawWatermarkOnPage(doc, branding);
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margins.left - margins.right;
  const startY = getContentStartY(branding);

  const ensureSpace = (currentY: number, neededMm: number): number => {
    if (currentY + neededMm > getContentBottomLimit(doc, branding)) {
      doc.addPage();
      drawWatermarkOnPage(doc, branding);
      return getContentStartY(branding);
    }
    return currentY;
  };

  return {
    doc,
    branding,
    margins,
    contentWidth,
    startY,
    ensureSpace,
    finalize: () => finalizePdfBranding(doc, branding),
  };
}

export function reportBrandingPdfIssues(
  urls: BrandingImageUrls,
  loaded: BrandingPdfImages,
  toast?: BrandingPdfToastReporter,
): string[] {
  const missing = brandingPdfMissingSlots(urls, loaded);
  if (missing.length > 0 && toast) {
    toast({
      variant: 'destructive',
      title: 'Identidade visual incompleta no PDF',
      description: `Não foi possível carregar: ${missing.join(', ')}. Verifique Configurações → Identidade visual e recarregue a página.`,
    });
  }
  return missing;
}

/** Bloqueia exportação oficial sem identidade visual completa (fail-closed). */
export function guardBrandingPdfExport(
  opts: {
    isPdfImagesLoading: boolean;
    hasBrandingUrls?: boolean;
    toast?: BrandingPdfToastReporter;
    formatLabel?: string;
    brandingUrls?: BrandingImageUrls | null;
    pdfImages?: BrandingPdfImages | null;
    brandingData?: {
      headerImageUrl?: string | null;
      footerImageUrl?: string | null;
      watermarkImageUrl?: string | null;
    } | null;
  },
): boolean {
  const formatLabel = opts.formatLabel ?? 'PDF';
  const urls =
    opts.brandingUrls ??
    (opts.brandingData ? brandingUrlsFromLocal(opts.brandingData) : null);

  if (opts.isPdfImagesLoading) {
    opts.toast?.({
      title: 'Aguarde',
      description: `Carregando imagens da identidade visual para o ${formatLabel}… Recarregue a página (F5) se demorar mais de alguns segundos.`,
    });
    return false;
  }

  if (!urls || !hasCompleteBrandingUrls(urls)) {
    opts.toast?.({
      variant: 'destructive',
      title: 'Identidade visual obrigatória',
      description: BRANDING_REQUIRED_MESSAGE,
    });
    return false;
  }

  if (!opts.pdfImages || !hasCompleteBrandingImages(opts.pdfImages)) {
    const missing = getBrandingMissingSlots(urls, opts.pdfImages ?? {
      headerBase64: null,
      footerBase64: null,
      watermarkBase64: null,
    });
    opts.toast?.({
      variant: 'destructive',
      title: 'Identidade visual indisponível',
      description:
        missing.length > 0
          ? `Não foi possível carregar: ${missing.join(', ')}. Verifique ${BRANDING_SETUP_PATH}, recarregue a página (F5) e tente de novo. Em dev local, confira GOOGLE_APPLICATION_CREDENTIALS se o problema persistir.`
          : BRANDING_REQUIRED_MESSAGE,
    });
    return false;
  }

  return true;
}

/** Atalho para páginas com `useLocalBranding()`. */
export function guardBrandingExportFromHook(opts: {
  brandingData:
    | { headerImageUrl?: string | null; footerImageUrl?: string | null; watermarkImageUrl?: string | null }
    | null
    | undefined;
  pdfImages?: BrandingPdfImages | null;
  isPdfImagesLoading: boolean;
  hasBrandingUrls?: boolean;
  toast?: BrandingPdfToastReporter;
  formatLabel?: string;
}): boolean {
  return guardBrandingPdfExport({
    isPdfImagesLoading: opts.isPdfImagesLoading,
    toast: opts.toast,
    formatLabel: opts.formatLabel,
    brandingData: opts.brandingData,
    pdfImages: opts.pdfImages,
  });
}

/** Alias para PDF e Word (.docx) — mesma pré-carga via `useLocalBranding().pdfImages`. */
export const guardBrandingDocumentExport = guardBrandingPdfExport;
