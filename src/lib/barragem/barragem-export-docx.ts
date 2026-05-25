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
import type { ProjetoTecnicoBarragem } from '@/lib/types';
import { buildBarragemExportBaseName } from '@/lib/barragem/barragem-export-filename';
import { buildBarragemExportSections } from '@/lib/barragem/barragem-export-sections';

export type BarragemDocxExportResult = {
  blob: Blob;
  fileName: string;
};

function coverParagraphs(
  Paragraph: typeof import('docx').Paragraph,
  TextRun: typeof import('docx').TextRun,
  AlignmentType: typeof import('docx').AlignmentType,
  projeto: ProjetoTecnicoBarragem,
): InstanceType<typeof Paragraph>[] {
  const center = { alignment: AlignmentType.CENTER };
  const font = DOCX_BRANDING_FONT;
  const lines = [
    'PROJETO TÉCNICO DE BARRAGEM',
    '',
    projeto.requerente?.nome || '—',
    projeto.empreendimento?.nome || '—',
    [projeto.empreendimento?.municipio, projeto.empreendimento?.uf].filter(Boolean).join(' - ') ||
      '—',
    projeto.dataEmissao || new Date().toLocaleDateString('pt-BR'),
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
            size: text === lines[0] ? 32 : 24,
            bold: text === lines[0],
          }),
        ],
      }),
  );
}

/** Word com cabeçalho, rodapé e marca d'água (identidade visual da consultoria). */
export async function generateBarragemExportDocxBlobBranded(
  projeto: ProjetoTecnicoBarragem,
  pdfImages: BrandingPdfImages,
): Promise<BarragemDocxExportResult> {
  const {
    AlignmentType,
    Document,
    Packer,
    PageBreak,
    Paragraph,
    TextRun,
  } = await import('docx');

  const sections = buildBarragemExportSections(projeto);
  const branded = await buildBrandedDocxSectionSetup(pdfImages);

  const children: InstanceType<typeof Paragraph>[] = [
    ...coverParagraphs(Paragraph, TextRun, AlignmentType, projeto),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: 'Índice',
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
  return { blob, fileName: `${buildBarragemExportBaseName(projeto)}.docx` };
}

/** Word a partir do template DOCX em Configurações (slug barragens). */
export async function generateBarragemExportDocxFromTemplate(params: {
  projeto: ProjetoTecnicoBarragem;
  firestore: Firestore;
  auth: Auth | null | undefined;
  templateUrl?: string;
}): Promise<BarragemDocxExportResult> {
  const { projeto, firestore, auth, templateUrl } = params;
  const projectId = projeto.empreendimento?.projectId?.trim();

  if (!projectId) {
    throw new Error(
      'Vincule um empreendimento cadastrado ao projeto para exportar o Word com o template oficial.',
    );
  }

  const context = await getAmbientalContextByEmpreendimentoId(firestore, projectId);
  const headers = await getBearerApiHeaders(auth, {
    'Content-Type': 'application/json',
  });

  const res = await fetch('/api/barragens/export-docx', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      projetoId: projeto.id,
      context,
      projeto,
      templateUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? res.statusText ?? 'Erro ao gerar Word.',
    );
  }

  const blob = await res.blob();
  return { blob, fileName: `${buildBarragemExportBaseName(projeto)}.docx` };
}
