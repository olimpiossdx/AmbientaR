'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import {
  buildBrandedDocxSectionSetup,
  DOCX_BRANDING_FONT,
} from '@/lib/branding-docx';
import {
  buildDefesaExportFileName,
  type DefesaExportRecord,
} from '@/lib/defesa/defesa-export-pdf';

export type DefesaDocxExportResult = {
  blob: Blob;
  fileName: string;
};

const DOCX_FONT_SIZE_HALF_PT = 24;
const DOCX_LINE_SPACING = 360;

export async function generateDefesaExportDocxBlob(
  content: string,
  defesa: DefesaExportRecord,
  pdfImages: BrandingPdfImages,
): Promise<DefesaDocxExportResult> {
  const {
    AlignmentType,
    Document,
    Packer,
    Paragraph,
    TextRun,
  } = await import('docx');

  const branded = await buildBrandedDocxSectionSetup(pdfImages);
  const bodyParagraphs: InstanceType<typeof Paragraph>[] = [];

  bodyParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
      children: [
        new TextRun({
          text: `Defesa administrativa — ${defesa.processNumber}`,
          font: DOCX_BRANDING_FONT,
          size: 28,
          bold: true,
        }),
      ],
    }),
  );

  const blocks = content.split(/\n\n+/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (
      trimmed.length < 80 &&
      /^[A-Z0-9\s\-–—().]+$/.test(trimmed) &&
      trimmed === trimmed.toUpperCase()
    ) {
      bodyParagraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [
            new TextRun({
              text: trimmed,
              font: DOCX_BRANDING_FONT,
              size: 26,
              bold: true,
            }),
          ],
        }),
      );
      continue;
    }
    for (const line of trimmed.split('\n')) {
      if (!line.trim()) continue;
      bodyParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: DOCX_LINE_SPACING, after: 160 },
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
  return {
    blob,
    fileName: buildDefesaExportFileName(defesa).replace(/\.pdf$/i, '.docx'),
  };
}
