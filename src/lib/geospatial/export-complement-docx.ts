import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { GeoAnalysisComplementOutput } from "@/lib/types/geo-wave-a";

export async function buildComplementDocxBlob(
  complement: GeoAnalysisComplementOutput,
  meta?: { areaHa?: number; generatedAtUtc?: string },
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({
      text: "Complementação técnica — Análise geoespacial",
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

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBlob(doc);
}
