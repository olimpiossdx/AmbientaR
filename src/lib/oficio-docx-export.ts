"use client";

import type { Oficio } from "@/lib/types";
import type { BrandingPdfImages } from "@/lib/branding-pdf";
import { calcPdfImageSize, getImageDimensions } from "@/lib/branding-pdf";
import {
  getOficioConsolidatedTextForExport,
  getOficioExportBaseName,
  isOficioOpeningMetadata,
  shouldLeftAlignSection,
  splitOficioContentSections,
} from "@/lib/oficio-export-layout";

/** Largura útil A4 com margens 15 mm (igual ao PDF de ofícios). */
const DOCX_CONTENT_WIDTH_MM = 180;
const DOCX_HEADER_MAX_HEIGHT_MM = 15;
const DOCX_FOOTER_MAX_HEIGHT_MM = 20;
const DOCX_WATERMARK_WIDTH_MM = 100;
const DOCX_FONT = "Times New Roman";
const DOCX_FONT_SIZE_HALF_PT = 24;
const DOCX_LINE_SPACING = 360;

function mmToDocxPx(mm: number): number {
  return Math.round((mm * 96) / 25.4);
}

function pngDataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
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
  const dims = await getImageDimensions(dataUrl);
  const sizeMm = calcPdfImageSize(dims, maxWidthMm, maxHeightMm);
  return {
    width: mmToDocxPx(sizeMm.w),
    height: mmToDocxPx(sizeMm.h),
  };
}

export async function exportOficioDocx(
  oficio: Oficio,
  pdfImages: BrandingPdfImages,
  text?: string,
): Promise<void> {
  const {
    AlignmentType,
    Document,
    Footer,
    Header,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    ImageRun,
    Packer,
    PageNumber,
    Paragraph,
    TextRun,
    VerticalPositionAlign,
    VerticalPositionRelativeFrom,
    convertMillimetersToTwip,
  } = await import("docx");

  const content = text ?? getOficioConsolidatedTextForExport(oficio);

  const headerSize = await imageSizePx(
    pdfImages.headerBase64,
    DOCX_CONTENT_WIDTH_MM,
    DOCX_HEADER_MAX_HEIGHT_MM,
  );
  const footerSize = await imageSizePx(
    pdfImages.footerBase64,
    DOCX_CONTENT_WIDTH_MM,
    DOCX_FOOTER_MAX_HEIGHT_MM,
  );
  const watermarkUrl = pdfImages.watermarkBase64;
  let watermarkSize: { width: number; height: number } | null = null;
  if (watermarkUrl) {
    const dims = await getImageDimensions(watermarkUrl);
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
            type: "png",
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
            type: "png",
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
            type: "png",
            data: pngDataUrlToUint8Array(pdfImages.footerBase64),
            transformation: footerSize,
          }),
        ],
      }),
    );
  }
  footerChildren.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          font: DOCX_FONT,
          size: 16,
          children: [PageNumber.CURRENT, "/", PageNumber.TOTAL_PAGES],
        }),
      ],
    }),
  );

  const bodyParagraphs: Array<InstanceType<typeof Paragraph>> = [];
  const sections = splitOficioContentSections(content);

  for (const section of sections) {
    if (shouldLeftAlignSection(section)) {
      const lines = section.split("\n");
      const extraAfter = isOficioOpeningMetadata(section) ? 280 : 140;
      for (const raw of lines) {
        const line = raw.trimEnd();
        if (!line.trim()) {
          bodyParagraphs.push(
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: "", font: DOCX_FONT, size: DOCX_FONT_SIZE_HALF_PT })],
            }),
          );
          continue;
        }
        bodyParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: DOCX_LINE_SPACING, after: extraAfter },
            children: [
              new TextRun({
                text: line,
                font: DOCX_FONT,
                size: DOCX_FONT_SIZE_HALF_PT,
              }),
            ],
          }),
        );
      }
    } else {
      const paragraphs = section
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      for (const para of paragraphs) {
        bodyParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: DOCX_LINE_SPACING, after: 200 },
            children: [
              new TextRun({
                text: para,
                font: DOCX_FONT,
                size: DOCX_FONT_SIZE_HALF_PT,
              }),
            ],
          }),
        );
      }
    }
  }

  const marginMm = 15;
  const marginTwip = convertMillimetersToTwip(marginMm);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: marginTwip,
              right: marginTwip,
              bottom: convertMillimetersToTwip(28),
              left: marginTwip,
            },
          },
        },
        headers:
          headerChildren.length > 0
            ? { default: new Header({ children: headerChildren }) }
            : undefined,
        footers: { default: new Footer({ children: footerChildren }) },
        children: bodyParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${getOficioExportBaseName(oficio)}.docx`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** @deprecated Use exportOficioDocx */
export const exportOficioWord = exportOficioDocx;
