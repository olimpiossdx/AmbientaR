'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import {
  buildBrandedDocxSectionSetup,
  DOCX_BRANDING_FONT,
} from '@/lib/branding-docx';
import type { FaunaStudy } from '@/lib/types';
import { buildFaunaExportBaseName } from '@/lib/fauna/fauna-export-filename';
import { buildFaunaExportSections } from '@/lib/fauna/fauna-export-sections';
import {
  buildFaunaCoverMetaLines,
  FAUNA_REPORT_TITLE,
} from '@/lib/fauna/fauna-export-layout';

export type FaunaDocxExportResult = {
  blob: Blob;
  fileName: string;
};

function coverParagraphs(
  Paragraph: typeof import('docx').Paragraph,
  TextRun: typeof import('docx').TextRun,
  AlignmentType: typeof import('docx').AlignmentType,
  convertMillimetersToTwip: typeof import('docx').convertMillimetersToTwip,
  study: FaunaStudy,
): InstanceType<typeof Paragraph>[] {
  const font = DOCX_BRANDING_FONT;
  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: convertMillimetersToTwip(15), after: 280 },
      children: [
        new TextRun({
          text: FAUNA_REPORT_TITLE,
          font,
          size: 32,
          bold: true,
        }),
      ],
    }),
  ];

  for (const text of buildFaunaCoverMetaLines(study)) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text,
            font,
            size: 22,
          }),
        ],
      }),
    );
  }

  return children;
}

/** Word com cabeçalho, rodapé e marca d'água (identidade visual da consultoria). */
export async function generateFaunaExportDocxBlobBranded(
  study: FaunaStudy,
  pdfImages: BrandingPdfImages,
): Promise<FaunaDocxExportResult> {
  const {
    AlignmentType,
    Document,
    Packer,
    PageBreak,
    Paragraph,
    TextRun,
    convertMillimetersToTwip,
  } = await import('docx');

  const sections = buildFaunaExportSections(study);
  const branded = await buildBrandedDocxSectionSetup(pdfImages);

  const children: InstanceType<typeof Paragraph>[] = [
    ...coverParagraphs(
      Paragraph,
      TextRun,
      AlignmentType,
      convertMillimetersToTwip,
      study,
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  for (const sec of sections) {
    if (sec.pageBreakBefore) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    children.push(
      new Paragraph({
        spacing: { before: sec.pageBreakBefore ? 0 : undefined, after: 160 },
        children: [
          new TextRun({
            text: sec.title,
            font: DOCX_BRANDING_FONT,
            size: 26,
            bold: true,
          }),
        ],
      }),
    );
    for (const para of sec.body.split(/\n+/).filter((p) => p.trim())) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: para.trim(),
              font: DOCX_BRANDING_FONT,
              size: 22,
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
          page: { margin: branded.pageMargins },
        },
        headers: branded.headers,
        footers: branded.footers,
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return { blob, fileName: `${buildFaunaExportBaseName(study)}.docx` };
}
