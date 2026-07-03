'use client';

import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { BrandingPdfImages } from '@/lib/branding-pdf';
import {
  buildBrandedDocxSectionSetup,
  DOCX_BRANDING_FONT,
} from '@/lib/branding-docx';
import { getAmbientalContextByEmpreendimentoId } from '@/lib/ambiental-context';
import { getBearerApiHeaders } from '@/lib/api-client-auth';
import type { PiscinaoOffStream } from '@/lib/types';
import { buildPiscinaoExportBaseName } from '@/lib/piscinao-off-stream/export-filename';
import { buildPiscinaoExportSections } from '@/lib/piscinao-off-stream/export-sections';
import {
  PISCINAO_COVER_TITLE_TOP_MM,
  PISCINAO_REPORT_TITLE,
  PISCINAO_TOC_HEADING,
  buildPiscinaoCoverMetaLines,
} from '@/lib/piscinao-off-stream/export-layout';

export type PiscinaoDocxExportResult = { blob: Blob; fileName: string };

function coverParagraphs(
  Paragraph: typeof import('docx').Paragraph,
  TextRun: typeof import('docx').TextRun,
  AlignmentType: typeof import('docx').AlignmentType,
  convertMillimetersToTwip: typeof import('docx').convertMillimetersToTwip,
  cadastro: PiscinaoOffStream,
): InstanceType<typeof Paragraph>[] {
  const font = DOCX_BRANDING_FONT;
  const marginTopMm = 15;
  const titleBeforeMm = Math.max(0, PISCINAO_COVER_TITLE_TOP_MM - marginTopMm);
  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: convertMillimetersToTwip(titleBeforeMm), after: 280 },
      children: [new TextRun({ text: PISCINAO_REPORT_TITLE, font, size: 32, bold: true })],
    }),
  ];
  for (const text of buildPiscinaoCoverMetaLines(cadastro)) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 160 },
        children: [new TextRun({ text, font, size: 22 })],
      }),
    );
  }
  return children;
}

export async function generatePiscinaoExportDocxBlobBranded(
  cadastro: PiscinaoOffStream,
  pdfImages: BrandingPdfImages,
): Promise<PiscinaoDocxExportResult> {
  const {
    AlignmentType,
    Document,
    Packer,
    PageBreak,
    Paragraph,
    TextRun,
    convertMillimetersToTwip,
  } = await import('docx');

  const sections = buildPiscinaoExportSections(cadastro);
  const branded = await buildBrandedDocxSectionSetup(pdfImages);
  const children: InstanceType<typeof Paragraph>[] = [
    ...coverParagraphs(Paragraph, TextRun, AlignmentType, convertMillimetersToTwip, cadastro),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({ text: PISCINAO_TOC_HEADING, font: DOCX_BRANDING_FONT, size: 28, bold: true }),
      ],
    }),
  ];

  for (const sec of sections) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: sec.title, font: DOCX_BRANDING_FONT, size: 22 })],
      }),
    );
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  for (const sec of sections) {
    if (sec.pageBreakBefore) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({ text: sec.title, font: DOCX_BRANDING_FONT, size: 26, bold: true }),
        ],
      }),
    );
    for (const para of sec.body.split(/\n+/).filter((p) => p.trim())) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: para.trim(), font: DOCX_BRANDING_FONT, size: 22 })],
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

  const blob = await Packer.toBlob(doc);
  return { blob, fileName: `${buildPiscinaoExportBaseName(cadastro)}.docx` };
}

export async function generatePiscinaoExportDocxFromTemplate(params: {
  cadastro: PiscinaoOffStream;
  firestore: Firestore;
  auth: Auth | null | undefined;
  templateUrl?: string;
}): Promise<PiscinaoDocxExportResult> {
  const { cadastro, firestore, auth, templateUrl } = params;
  const projectId = cadastro.empreendimento?.projectId?.trim();

  if (!projectId) {
    throw new Error(
      'Vincule um empreendimento cadastrado para exportar o Word com o template oficial.',
    );
  }

  const context = await getAmbientalContextByEmpreendimentoId(firestore, projectId);
  const headers = await getBearerApiHeaders(auth, { 'Content-Type': 'application/json' });

  const res = await fetch('/api/piscinao-off-stream/export-docx', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      cadastroId: cadastro.id,
      context,
      cadastro,
      templateUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText ?? 'Erro ao gerar Word.');
  }

  const blob = await res.blob();
  return { blob, fileName: `${buildPiscinaoExportBaseName(cadastro)}.docx` };
}
