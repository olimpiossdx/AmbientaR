'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import {
  buildBrandedDocxSectionSetup,
  DOCX_BRANDING_FONT,
} from '@/lib/branding-docx';
import type { PeaProgram } from '@/lib/pea/types';
import {
  buildPeaExportBaseName,
  buildPeaExportSections,
} from '@/lib/pea/pea-export-sections';

export type PeaDocxExportResult = {
  blob: Blob;
  fileName: string;
};

export async function generatePeaExportDocxBlob(
  pea: PeaProgram,
  pdfImages: BrandingPdfImages,
): Promise<PeaDocxExportResult> {
  const {
    AlignmentType,
    Document,
    Packer,
    PageBreak,
    Paragraph,
    TextRun,
  } = await import('docx');

  const sections = buildPeaExportSections(pea);
  const branded = await buildBrandedDocxSectionSetup(pdfImages);
  const font = DOCX_BRANDING_FONT;

  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'PROGRAMA DE EDUCAÇÃO AMBIENTAL (PEA)',
          font,
          size: 32,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: pea.empreendimento.nome || '—',
          font,
          size: 24,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
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
    const parts = sec.body.split(/\n+/).filter((p) => p.trim());
    if (parts.length === 0) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: '—', font, size: 22 })],
        }),
      );
    } else {
      for (const p of parts) {
        children.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: p, font, size: 22 })],
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
        children,
      },
    ],
  });

  const buf = await Packer.toBlob(doc);
  return {
    blob: buf,
    fileName: `${buildPeaExportBaseName(pea)}.docx`,
  };
}
