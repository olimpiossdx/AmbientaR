"use client";

import type { Oficio } from "@/lib/types";
import type { BrandingPdfImages } from "@/lib/branding-pdf";
import {
  buildBrandedDocxSectionSetup,
  DOCX_BRANDING_FONT,
} from "@/lib/branding-docx";
import {
  getOficioConsolidatedTextForExport,
  getOficioExportBaseName,
  isOficioOpeningMetadata,
  shouldLeftAlignSection,
  splitOficioContentSections,
} from "@/lib/oficio-export-layout";

const DOCX_FONT_SIZE_HALF_PT = 24;
const DOCX_LINE_SPACING = 360;

export async function exportOficioDocx(
  oficio: Oficio,
  pdfImages: BrandingPdfImages,
  text?: string,
): Promise<void> {
  const {
    AlignmentType,
    Document,
    Packer,
    Paragraph,
    TextRun,
  } = await import("docx");

  const content = text ?? getOficioConsolidatedTextForExport(oficio);
  const branded = await buildBrandedDocxSectionSetup(pdfImages);

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
              children: [
                new TextRun({
                  text: "",
                  font: DOCX_BRANDING_FONT,
                  size: DOCX_FONT_SIZE_HALF_PT,
                }),
              ],
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
                font: DOCX_BRANDING_FONT,
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
                font: DOCX_BRANDING_FONT,
                size: DOCX_FONT_SIZE_HALF_PT,
              }),
            ],
          }),
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: branded.pageMargins,
          },
        },
        headers: branded.headers,
        footers: branded.footers,
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
