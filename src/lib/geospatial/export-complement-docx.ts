import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { BrandingPdfImages } from "@/lib/branding-pdf";
import { buildBrandedDocxSectionSetup } from "@/lib/branding-docx";
import type {
  GeoAnalysisComplementOutput,
  GeoLayerResult,
} from "@/lib/types/geo-wave-a";

export async function buildComplementDocxBlob(
  complement: GeoAnalysisComplementOutput,
  meta?: {
    areaHa?: number;
    generatedAtUtc?: string;
    factualSummary?: string;
    layers?: GeoLayerResult[];
  },
  pdfImages?: BrandingPdfImages | null,
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({
      text: "Etapa 2 — Análise geoespacial (factual + complemento IA)",
      heading: HeadingLevel.HEADING_1,
    }),
  ];

  if (meta?.areaHa != null) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Área do empreendimento: ${meta.areaHa.toFixed(2)} ha`,
            size: 22,
          }),
        ],
      }),
    );
  }

  if (meta?.factualSummary) {
    children.push(
      new Paragraph({
        text: "Resumo factual (SIG)",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ children: [new TextRun(meta.factualSummary)] }),
    );
  }

  if (meta?.layers?.length) {
    children.push(
      new Paragraph({
        text: "Camadas consultadas",
        heading: HeadingLevel.HEADING_2,
      }),
    );
    for (const layer of meta.layers) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${layer.title} [${layer.status}]: ${layer.summary}`,
              size: 20,
            }),
          ],
        }),
      );
    }
  }

  children.push(
    new Paragraph({
      text: "Complementação técnica (rascunho IA)",
      heading: HeadingLevel.HEADING_2,
    }),
  );

  children.push(
    new Paragraph({
      text: complement.resumoExecutivo,
      heading: HeadingLevel.HEADING_2,
    }),
  );

  for (const section of complement.sections) {
    children.push(
      new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2 }),
    );
    for (const block of section.bodyMarkdown.split(/\n\n+/)) {
      const trimmed = block.trim();
      if (!trimmed) continue;
      children.push(new Paragraph({ children: [new TextRun(trimmed)] }));
    }
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: complement.disclaimer,
          italics: true,
          size: 20,
        }),
      ],
    }),
  );

  const images = pdfImages ?? {
    headerBase64: null,
    footerBase64: null,
    watermarkBase64: null,
  };
  const branded = await buildBrandedDocxSectionSetup(images, {
    showPageNumbers: true,
    pageNumberFont: "Helvetica",
  });

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

  return Packer.toBlob(doc);
}
