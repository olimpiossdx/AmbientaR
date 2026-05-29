import {
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import {
  CARTOGRAPHIC_PAGE_SIZE,
  type CartographicBranding,
  type CartographicSheetMeta,
} from "@/lib/geospatial/cartographic-layout";
import {
  resolveWaveCartographicSheets,
  type ResolveCartographicSheetsOptions,
} from "@/lib/geospatial/resolve-cartographic-sheets";
import type { GeoLayerResult, WaveAAnalysisResult } from "@/lib/types/geo-wave-a";

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

function layerStatsParagraphs(layer: GeoLayerResult): Paragraph[] {
  const lines: string[] = [`${layer.summary} [${layer.status}]`];
  if (layer.stats.length === 0) {
    lines.push("Sem interseção mensurável ou serviço indisponível.");
  } else {
    for (const row of layer.stats) {
      const pct = row.pctOfPerimeter != null ? `${row.pctOfPerimeter}%` : "—";
      const ha = row.areaHa != null ? `${row.areaHa.toFixed(2)} ha` : "—";
      const km = row.lengthKm != null ? ` | ${row.lengthKm.toFixed(2)} km` : "";
      lines.push(`• ${row.label}: ${ha} | ${pct} do empreendimento${km}`);
    }
  }
  if (layer.source) {
    lines.push(`Fonte: ${layer.source.layerName} (${layer.source.method})`);
  }
  return lines.map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, size: 20 })],
      }),
  );
}

export async function buildCartographicDocxBlob(
  wave: WaveAAnalysisResult,
  options?: ResolveCartographicSheetsOptions & {
    layerId?: string | "all";
  },
): Promise<Blob> {
  const sheets = await resolveWaveCartographicSheets(wave, options);

  const filtered =
    options?.layerId && options.layerId !== "all"
      ? sheets.filter((sheet) => sheet.layerId === options.layerId)
      : sheets;

  if (!filtered.length) {
    throw new Error("Não foi possível gerar mapas para o documento Word.");
  }

  const layerById = new Map(wave.layers.map((layer) => [layer.layerId, layer]));

  const children: Paragraph[] = [
    new Paragraph({
      text: "Relatório geoespacial — mapas e dados factuais (SIG MG)",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Área: ${wave.perimeter.areaHa.toFixed(2)} ha · ${filtered.length} folha(s)`,
          size: 22,
        }),
      ],
    }),
  ];

  if (!options?.layerId || options.layerId === "all") {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: wave.factualSummary, size: 20 })],
      }),
    );
  }

  for (const sheet of filtered) {
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
              height: Math.round(
                (680 * CARTOGRAPHIC_PAGE_SIZE.height) / CARTOGRAPHIC_PAGE_SIZE.width,
              ),
            },
            type: "png",
          }),
        ],
      }),
    );

    const layer = layerById.get(sheet.layerId);
    if (layer) {
      children.push(...layerStatsParagraphs(layer));
    } else if (sheet.layerId === "_localizacao") {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Perímetro do empreendimento · ${wave.perimeter.areaHa.toFixed(2)} ha`,
              size: 20,
            }),
          ],
        }),
      );
    }
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Fontes: IDE-Sisema MG, IBGE (biomas/limites) e bases estaduais MG quando aplicável. Layout de referência Pimenta Consultoria Ambiental.",
          italics: true,
          size: 18,
        }),
      ],
    }),
  );

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}
