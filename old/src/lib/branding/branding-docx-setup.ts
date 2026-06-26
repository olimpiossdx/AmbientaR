import type { BrandingPdfImages } from '@/lib/branding-pdf';
import { calcPdfImageSize } from '@/lib/branding-pdf';
import { docxImageTypeFromDataUrl } from '@/lib/branding/image-data-url';
import {
  getImageDimensionsFromDataUrl,
  type ImageDimensions,
} from '@/lib/branding/image-dimensions';

/** Largura útil A4 com margens 15 mm (igual ao PDF de ofícios e relatórios IA). */
export const DOCX_BRANDING_CONTENT_WIDTH_MM = 180;
const DOCX_HEADER_MAX_HEIGHT_MM = 15;
const DOCX_FOOTER_MAX_HEIGHT_MM = 20;
const DOCX_WATERMARK_WIDTH_MM = 100;
export const DOCX_BRANDING_FONT = 'Times New Roman';

export function mmToDocxPx(mm: number): number {
  return Math.round((mm * 96) / 25.4);
}

export function pngDataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function imageSizePx(
  dataUrl: string | null,
  maxWidthMm: number,
  maxHeightMm: number,
): Promise<{ width: number; height: number } | null> {
  if (!dataUrl) return null;
  const dims: ImageDimensions = getImageDimensionsFromDataUrl(dataUrl);
  const sizeMm = calcPdfImageSize(dims, maxWidthMm, maxHeightMm);
  return {
    width: mmToDocxPx(sizeMm.w),
    height: mmToDocxPx(sizeMm.h),
  };
}

export type BrandedDocxSectionSetup = {
  headers?: { default: import('docx').Header };
  footers: { default: import('docx').Footer };
  pageMargins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export type BuildBrandedDocxSectionOptions = {
  marginMm?: number;
  bottomMarginMm?: number;
  showPageNumbers?: boolean;
  pageNumberFont?: string;
};

/**
 * Cabeçalho, marca d'água (flutuante atrás do texto) e rodapé para Document (docx).
 * Funciona no browser e no servidor Node (APIs de exportação).
 */
export async function buildBrandedDocxSectionSetup(
  pdfImages: BrandingPdfImages,
  options?: BuildBrandedDocxSectionOptions,
): Promise<BrandedDocxSectionSetup> {
  const {
    AlignmentType,
    Footer,
    Header,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    ImageRun,
    PageNumber,
    Paragraph,
    TextRun,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
    convertMillimetersToTwip,
  } = await import('docx');

  const marginMm = options?.marginMm ?? 15;
  const bottomMarginMm = options?.bottomMarginMm ?? 28;
  const showPageNumbers = options?.showPageNumbers !== false;
  const pageNumberFont = options?.pageNumberFont ?? DOCX_BRANDING_FONT;

  const headerSize = await imageSizePx(
    pdfImages.headerBase64,
    DOCX_BRANDING_CONTENT_WIDTH_MM,
    DOCX_HEADER_MAX_HEIGHT_MM,
  );
  const footerSize = await imageSizePx(
    pdfImages.footerBase64,
    DOCX_BRANDING_CONTENT_WIDTH_MM,
    DOCX_FOOTER_MAX_HEIGHT_MM,
  );
  const watermarkUrl = pdfImages.watermarkBase64;
  let watermarkSize: { width: number; height: number } | null = null;
  if (watermarkUrl) {
    const dims = getImageDimensionsFromDataUrl(watermarkUrl);
    const sizeMm = calcPdfImageSize(
      dims,
      DOCX_WATERMARK_WIDTH_MM,
      DOCX_WATERMARK_WIDTH_MM * 1.5,
    );
    watermarkSize = {
      width: mmToDocxPx(sizeMm.w),
      height: mmToDocxPx(sizeMm.h),
    };
  }

  const headerChildren: Array<InstanceType<typeof Paragraph>> = [];
  if (pdfImages.headerBase64 && headerSize) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 80 },
        children: [
          new ImageRun({
            type: docxImageTypeFromDataUrl(pdfImages.headerBase64),
            data: pngDataUrlToUint8Array(pdfImages.headerBase64),
            transformation: headerSize,
          }),
        ],
      }),
    );
  }

  if (watermarkUrl && watermarkSize) {
    headerChildren.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: docxImageTypeFromDataUrl(watermarkUrl),
            data: pngDataUrlToUint8Array(watermarkUrl),
            transformation: watermarkSize,
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                align: HorizontalPositionAlign.CENTER,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                align: VerticalPositionAlign.CENTER,
              },
              behindDocument: true,
              allowOverlap: true,
            },
          }),
        ],
      }),
    );
  }

  const footerChildren: Array<InstanceType<typeof Paragraph>> = [];
  if (pdfImages.footerBase64 && footerSize) {
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new ImageRun({
            type: docxImageTypeFromDataUrl(pdfImages.footerBase64),
            data: pngDataUrlToUint8Array(pdfImages.footerBase64),
            transformation: footerSize,
          }),
        ],
      }),
    );
  }
  if (showPageNumbers) {
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            font: pageNumberFont,
            size: 16,
            children: [PageNumber.CURRENT, '/', PageNumber.TOTAL_PAGES],
          }),
        ],
      }),
    );
  }

  return {
    headers:
      headerChildren.length > 0
        ? { default: new Header({ children: headerChildren }) }
        : undefined,
    footers: { default: new Footer({ children: footerChildren }) },
    pageMargins: {
      top: convertMillimetersToTwip(marginMm),
      right: convertMillimetersToTwip(marginMm),
      bottom: convertMillimetersToTwip(bottomMarginMm),
      left: convertMillimetersToTwip(marginMm),
    },
  };
}
