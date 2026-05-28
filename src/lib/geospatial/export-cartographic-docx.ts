import {
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import {
  buildWaveACartographicSheets,
  CARTOGRAPHIC_PAGE_SIZE,
  type CartographicBranding,
  type CartographicSheetMeta,
} from "@/lib/geospatial/cartographic-layout";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";

/** Converte SVG → PNG Uint8Array (Node ou browser com canvas). */
async function svgToPngBytes(svg: string): Promise<Uint8Array> {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const { svgStringToPngDataUrl } = await import(
      "@/lib/geospatial/render-minimap-client"
    );
    const dataUrl = await svgStringToPngDataUrl(
      svg,
      CARTOGRAPHIC_PAGE_SIZE.width,
      CARTOGRAPHIC_PAGE_SIZE.height,
    );
    const base64 = dataUrl.split(",")[1] ?? "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  throw new Error("DOCX cartográfico requer ambiente com canvas (browser).");
}

export async function buildCartographicDocxBlob(
  wave: WaveAAnalysisResult,
  options?: {
    propertyName?: string;
    projectAuthor?: string;
    branding?: CartographicBranding;
    meta?: CartographicSheetMeta;
  },
): Promise<Blob> {
  const sheets = buildWaveACartographicSheets(wave, {
    propertyName: options?.propertyName,
    branding: options?.branding,
    meta: {
      ...options?.meta,
      projectAuthor: options?.projectAuthor ?? options?.meta?.projectAuthor,
    },
  });

  if (!sheets.length) {
    throw new Error("Não foi possível gerar mapas para o documento Word.");
  }

  const children: Paragraph[] = [
    new Paragraph({
      text: "Mapas cartográficos — Análise geoespacial MG",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Área: ${wave.perimeter.areaHa.toFixed(2)} ha · ${sheets.length} folha(s)`,
          size: 22,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: wave.factualSummary,
          size: 20,
        }),
      ],
    }),
  ];

  for (const sheet of sheets) {
    const png = await svgToPngBytes(sheet.svg);
    children.push(
      new Paragraph({
        text: sheet.title,
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [
          new ImageRun({
            data: png,
            transformation: {
              width: 680,
              height: Math.round((680 * CARTOGRAPHIC_PAGE_SIZE.height) / CARTOGRAPHIC_PAGE_SIZE.width),
            },
            type: "png",
          }),
        ],
      }),
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Fonte: IDE-Sisema MG. Layout de referência Pimenta Consultoria Ambiental.",
          italics: true,
          size: 18,
        }),
      ],
    }),
  );

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}
