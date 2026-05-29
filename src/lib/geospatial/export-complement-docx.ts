import {
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { BrandingPdfImages } from "@/lib/branding-pdf";
import { buildBrandedDocxSectionSetup } from "@/lib/branding-docx";
import {
  CARTOGRAPHIC_PAGE_SIZE,
  type CartographicBranding,
  type CartographicSheetMeta,
} from "@/lib/geospatial/cartographic-layout";
import type {
  GeoAnalysisComplementOutput,
  GeoLayerResult,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import type { CartographicPngMap } from "@/lib/geospatial/render-minimap-client";

function pngDataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function mapImageParagraph(pngDataUrl: string): Paragraph {
  return new Paragraph({
    children: [
      new ImageRun({
        data: pngDataUrlToBytes(pngDataUrl),
        transformation: {
          width: 680,
          height: Math.round(
            (680 * CARTOGRAPHIC_PAGE_SIZE.height) / CARTOGRAPHIC_PAGE_SIZE.width,
          ),
        },
        type: "png",
      }),
    ],
  });
}

function layerStatsParagraphs(layer: GeoLayerResult): Paragraph[] {
  const out: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: `${layer.title} [${layer.status}]: ${layer.summary}`,
          size: 20,
        }),
      ],
    }),
  ];
  for (const row of layer.stats) {
    const pct = row.pctOfPerimeter != null ? `${row.pctOfPerimeter}%` : "—";
    const ha = row.areaHa != null ? `${row.areaHa.toFixed(2)} ha` : "—";
    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${row.label}: ${ha} | ${pct} do empreendimento`,
            size: 20,
          }),
        ],
      }),
    );
  }
  return out;
}

export async function buildComplementDocxBlob(
  complement: GeoAnalysisComplementOutput,
  meta?: {
    areaHa?: number;
    generatedAtUtc?: string;
    factualSummary?: string;
    layers?: GeoLayerResult[];
    wave?: WaveAAnalysisResult;
    cartographicPngs?: CartographicPngMap;
    propertyName?: string;
    projectAuthor?: string;
    branding?: CartographicBranding;
    sheetMeta?: CartographicSheetMeta;
    layerId?: string | "all";
  },
  pdfImages?: BrandingPdfImages | null,
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({
      text: "Etapa 2 — Análise geoespacial (mapas + factual + complemento IA)",
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

  if (meta?.factualSummary && (!meta.layerId || meta.layerId === "all")) {
    children.push(
      new Paragraph({
        text: "Resumo factual (SIG)",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ children: [new TextRun(meta.factualSummary)] }),
    );
  }

  const carto = meta?.cartographicPngs;
  const layers =
    meta?.layerId && meta.layerId !== "all"
      ? (meta.layers ?? []).filter((layer) => layer.layerId === meta.layerId)
      : (meta?.layers ?? []);

  if (layers.length) {
    children.push(
      new Paragraph({
        text: "Camadas consultadas (mapa + dados)",
        heading: HeadingLevel.HEADING_2,
      }),
    );

    if (carto?.["_localizacao"] && (!meta?.layerId || meta.layerId === "all")) {
      children.push(
        new Paragraph({ text: "Localização do empreendimento", heading: HeadingLevel.HEADING_3 }),
        mapImageParagraph(carto["_localizacao"]),
      );
    }

    for (const layer of layers) {
      const png = carto?.[layer.layerId];
      if (png) {
        children.push(
          new Paragraph({ text: layer.title, heading: HeadingLevel.HEADING_3 }),
          mapImageParagraph(png),
        );
      }
      children.push(...layerStatsParagraphs(layer));
    }
  }

  if (!meta?.layerId || meta.layerId === "all") {
    children.push(
      new Paragraph({
        text: "Complementação técnica (rascunho IA)",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        text: complement.resumoExecutivo,
        heading: HeadingLevel.HEADING_3,
      }),
    );

    for (const section of complement.sections) {
      children.push(
        new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_3 }),
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
  }

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
