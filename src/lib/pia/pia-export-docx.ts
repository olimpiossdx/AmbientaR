'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import {
  buildBrandedDocxSectionSetup,
  DOCX_BRANDING_FONT,
} from '@/lib/branding-docx';
import {
  buildPiaExportSections,
  buildSectionManifest,
} from '@/lib/pia/pia-export-manifest';
import { buildPiaExportBaseName } from '@/lib/pia/pia-export-filename';
import type { PiaRecord } from '@/lib/pia/pia-record';

export type PiaDocxExportResult = {
  blob: Blob;
  fileName: string;
  sectionManifest: string[];
};

function coverParagraphs(
  Paragraph: typeof import('docx').Paragraph,
  TextRun: typeof import('docx').TextRun,
  AlignmentType: typeof import('docx').AlignmentType,
  record: PiaRecord,
): InstanceType<typeof Paragraph>[] {
  const center = { alignment: AlignmentType.CENTER };
  const size = 24;
  const font = DOCX_BRANDING_FONT;
  const lines = [
    'PROJETO DE INTERVENÇÃO AMBIENTAL',
    '',
    record.requerente?.nome || '—',
    record.empreendimento?.nome || '—',
    new Date().toLocaleDateString('pt-BR'),
    `Modalidade: ${record.type}`,
  ];
  return lines.map(
    (text) =>
      new Paragraph({
        ...center,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text,
            font,
            size: text === lines[0] ? 32 : size,
            bold: text === lines[0],
          }),
        ],
      }),
  );
}

export async function generatePiaExportDocxBlob(
  record: PiaRecord,
  pdfImages: BrandingPdfImages,
): Promise<PiaDocxExportResult> {
  const {
    AlignmentType,
    Document,
    Packer,
    PageBreak,
    Paragraph,
    TextRun,
  } = await import('docx');

  const sections = buildPiaExportSections(record);
  const manifest = buildSectionManifest(sections);
  const branded = await buildBrandedDocxSectionSetup(pdfImages);

  const children: InstanceType<typeof Paragraph>[] = [
    ...coverParagraphs(Paragraph, TextRun, AlignmentType, record),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: 'Sumário',
          font: DOCX_BRANDING_FONT,
          size: 28,
          bold: true,
        }),
      ],
    }),
  ];

  for (const sec of sections) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: sec.title,
            font: DOCX_BRANDING_FONT,
            size: 22,
          }),
        ],
      }),
    );
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  for (const sec of sections) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
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
    const paragraphs = sec.body.split(/\n+/).filter((p) => p.trim());
    for (const para of paragraphs) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 160 },
          children: [
            new TextRun({
              text: para,
              font: DOCX_BRANDING_FONT,
              size: 24,
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
  const fileName = `${buildPiaExportBaseName(record)}.docx`;
  return { blob, fileName, sectionManifest: manifest };
}

export async function downloadPiaExportDocx(
  record: PiaRecord,
  pdfImages: BrandingPdfImages,
): Promise<PiaDocxExportResult> {
  const result = await generatePiaExportDocxBlob(record, pdfImages);
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return result;
}
