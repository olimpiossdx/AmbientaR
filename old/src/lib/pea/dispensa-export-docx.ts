'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import {
  buildBrandedDocxSectionSetup,
  DOCX_BRANDING_FONT,
} from '@/lib/branding-docx';
import type { DispensaPeaRecord } from '@/lib/pea/types';
import {
  buildDispensaExportBaseName,
  buildDispensaExportSections,
} from '@/lib/pea/pea-export-sections';

export type DispensaDocxExportResult = {
  blob: Blob;
  fileName: string;
};

export async function generateDispensaPeaExportDocxBlob(
  record: DispensaPeaRecord,
  pdfImages: BrandingPdfImages,
): Promise<DispensaDocxExportResult> {
  const {
    AlignmentType,
    Document,
    Packer,
    Paragraph,
    TextRun,
  } = await import('docx');

  const sections = buildDispensaExportSections(record);
  const branded = await buildBrandedDocxSectionSetup(pdfImages);
  const font = DOCX_BRANDING_FONT;

  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: 'SOLICITAÇÃO DE DISPENSA DO PEA',
          font,
          size: 32,
          bold: true,
        }),
      ],
    }),
  ];

  for (const sec of sections) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({ text: sec.title, font, size: 26, bold: true }),
        ],
      }),
    );
    for (const p of sec.body.split(/\n+/).filter((x) => x.trim())) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: p, font, size: 22 })],
        }),
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: branded.pageMargins } },
        headers: branded.headers,
        footers: branded.footers,
        children,
      },
    ],
  });

  const buf = await Packer.toBlob(doc);
  return {
    blob: buf,
    fileName: `${buildDispensaExportBaseName(record)}.docx`,
  };
}
