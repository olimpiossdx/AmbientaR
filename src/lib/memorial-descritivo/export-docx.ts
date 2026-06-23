import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { slugifyFileName } from "./format-br";
import type { MemorialMetadata } from "./types";

function paragraphsFromMemorialText(text: string): Paragraph[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const isTitle = line === "MEMORIAL DESCRITIVO";
      const isDivider = line.startsWith("___");
      return new Paragraph({
        children: [
          new TextRun({
            text: line,
            bold: isTitle,
            size: isTitle ? 28 : isDivider ? 20 : 22,
          }),
        ],
        spacing: { after: isTitle ? 240 : 120 },
      });
    });
}

export type MemorialDocxExportResult = {
  blob: Blob;
  fileName: string;
};

export async function generateMemorialExportDocxBlob(params: {
  memorialText: string;
  metadata: MemorialMetadata;
}): Promise<MemorialDocxExportResult> {
  const { memorialText, metadata } = params;
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphsFromMemorialText(memorialText),
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  const date = new Date().toISOString().slice(0, 10);
  const slug = slugifyFileName(metadata.imovel || "imovel");
  return {
    blob: buffer,
    fileName: `memorial-descritivo-${slug}-${date}.docx`,
  };
}
