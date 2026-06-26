import type { MmBrandedPdfSession } from "@/lib/pdf-branding-layout";
import { writeBrandedPdfParagraph, writeBrandedPdfTitle } from "@/lib/ia-menu-branded-pdf";
import { CARTOGRAPHIC_PAGE_SIZE } from "@/lib/geospatial/cartographic-layout";
import { WAVE_ALL_LAYER_COUNT } from "@/lib/geospatial/geo-constants";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";
import type {
  CartographicPngMap,
  FactualMinimapSet,
} from "@/lib/geospatial/render-minimap-client";

export type AppendWaveAFactualPdfOptions = {
  /** Título principal centrado (relatório factual isolado). */
  includeReportTitle?: boolean;
  /** Nota final; `null` omite. */
  closingNote?: string | null;
  /** Mini-mapas PNG esquemáticos (fallback). */
  minimaps?: FactualMinimapSet | null;
  /** Mapas cartográficos GeoSIG (preferidos sobre mini-mapas). */
  cartographicPngs?: CartographicPngMap | null;
  /** Y inicial; omissão = topo útil da página (session.startY). */
  startY?: number;
  /** `all` (padrão) ou layerId / `_localizacao` para exportação individual. */
  layerId?: string | "all";
};

function appendMapImage(
  session: MmBrandedPdfSession,
  dataUrl: string,
  caption: string,
  y: number,
  maxWidthMm: number,
  maxHeightMm: number,
): number {
  const { doc, margins, contentWidth } = session;
  let cursor = session.ensureSpace(y, maxHeightMm + 10);
  try {
    const props = doc.getImageProperties(dataUrl);
    const ratio = props.width / props.height;
    let wMm = Math.min(maxWidthMm, contentWidth);
    let hMm = wMm / ratio;
    if (hMm > maxHeightMm) {
      hMm = maxHeightMm;
      wMm = hMm * ratio;
    }
    const x = margins.left + (contentWidth - wMm) / 2;
    doc.addImage(dataUrl, "PNG", x, cursor, wMm, hMm);
    cursor += hMm + 3;
  } catch {
    cursor = writeBrandedPdfParagraph(
      session,
      `${caption} (mapa indisponível nesta exportação)`,
      8,
      cursor,
    );
    return cursor;
  }
  return writeBrandedPdfParagraph(session, caption, 8, cursor);
}

function appendCartographicMapImage(
  session: MmBrandedPdfSession,
  dataUrl: string,
  caption: string,
  y: number,
): number {
  const { contentWidth } = session;
  const ratio = CARTOGRAPHIC_PAGE_SIZE.height / CARTOGRAPHIC_PAGE_SIZE.width;
  const maxWidthMm = contentWidth;
  const maxHeightMm = Math.min(maxWidthMm * ratio, 125);
  return appendMapImage(session, dataUrl, caption, y, maxWidthMm, maxHeightMm);
}

function appendMinimapImage(
  session: MmBrandedPdfSession,
  dataUrl: string,
  caption: string,
  y: number,
  maxWidthMm = 170,
  maxHeightMm = 55,
): number {
  return appendMapImage(session, dataUrl, caption, y, maxWidthMm, maxHeightMm);
}

function formatLayerStats(
  session: MmBrandedPdfSession,
  layer: WaveAAnalysisResult["layers"][number],
  y: number,
): number {
  if (layer.stats.length === 0) {
    return writeBrandedPdfParagraph(
      session,
      "Sem interseção mensurável ou serviço indisponível.",
      9,
      y,
    );
  }
  let cursor = y;
  for (const row of layer.stats) {
    const pct = row.pctOfPerimeter != null ? `${row.pctOfPerimeter}%` : "—";
    const ha = row.areaHa != null ? `${row.areaHa.toFixed(2)} ha` : "—";
    const km = row.lengthKm != null ? `${row.lengthKm.toFixed(2)} km` : "";
    const line = `• ${row.label}: ${ha} | ${pct} do empreendimento${km ? ` | ${km}` : ""}`;
    cursor = writeBrandedPdfParagraph(session, line, 9, cursor);
  }
  return cursor;
}

export function appendWaveAFactualPdf(
  session: MmBrandedPdfSession,
  result: WaveAAnalysisResult,
  options?: AppendWaveAFactualPdfOptions,
): number {
  const { doc } = session;
  const pageW = doc.internal.pageSize.getWidth();
  const includeTitle = options?.includeReportTitle !== false;
  const layerFilter = options?.layerId ?? "all";
  const cartographic = options?.cartographicPngs;
  const minimaps = options?.minimaps;
  let y = options?.startY ?? session.startY;

  const layers =
    layerFilter === "all"
      ? result.layers
      : result.layers.filter((layer) => layer.layerId === layerFilter);

  if (includeTitle) {
    y = session.ensureSpace(y, 20);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório factual — Análise geoespacial MG", pageW / 2, y, {
      align: "center",
    });
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `IDE-Sisema MG · Análise SIG (${WAVE_ALL_LAYER_COUNT} camadas, incl. federal e diagnóstico)`,
      pageW / 2,
      y,
      {
        align: "center",
      },
    );
    y += 10;
  }

  y = writeBrandedPdfParagraph(
    session,
    `Área do empreendimento: ${result.perimeter.areaHa.toFixed(2)} ha`,
    11,
    y,
  );
  y = writeBrandedPdfParagraph(
    session,
    `Gerado em (UTC): ${result.generatedAtUtc}`,
    11,
    y,
  );

  if (layerFilter === "all") {
    y = writeBrandedPdfParagraph(session, result.factualSummary, 9, y);
  }

  const showLocation =
    layerFilter === "all" || layerFilter === "_localizacao";
  if (showLocation) {
    const locationPng =
      cartographic?.["_localizacao"] ?? minimaps?.locationPng ?? null;
    if (locationPng) {
      y = writeBrandedPdfTitle(session, "Mapa de localização", 11, y);
      y = cartographic?.["_localizacao"]
        ? appendCartographicMapImage(
            session,
            locationPng,
            "Localização do empreendimento (layout cartográfico)",
            y,
          )
        : appendMinimapImage(
            session,
            locationPng,
            "Perímetro do empreendimento (esquemático)",
            y,
          );
    }
  }

  if (layerFilter === "_localizacao") {
    return y;
  }

  for (const layer of layers) {
    y = session.ensureSpace(y, 50);
    y = writeBrandedPdfTitle(session, layer.title, 12, y);

    const cartoPng = cartographic?.[layer.layerId];
    if (cartoPng) {
      y = appendCartographicMapImage(
        session,
        cartoPng,
        `Mapa cartográfico — ${layer.title}`,
        y,
      );
    } else {
      const layerPng = minimaps?.layerPngs?.[layer.layerId];
      if (layerPng) {
        y = appendMinimapImage(
          session,
          layerPng,
          `Mapa esquemático — ${layer.title}`,
          y,
          150,
          42,
        );
      }
    }

    y = writeBrandedPdfParagraph(
      session,
      `${layer.summary} [${layer.status}]`,
      9,
      y,
    );
    y = formatLayerStats(session, layer, y);

    if (layer.source) {
      y = writeBrandedPdfParagraph(
        session,
        `Fonte: ${layer.source.layerName} (${layer.source.method}) · IDE-Sisema MG / bases IBGE quando aplicável`,
        8,
        y,
      );
    }
    y += 2;
  }

  const closing =
    options?.closingNote === null
      ? null
      : (options?.closingNote ??
        "Documento factual (SIG). Complementação interpretativa disponível na Etapa 2.");
  if (closing && layerFilter === "all") {
    y = writeBrandedPdfParagraph(session, closing, 8, y);
  }
  return y;
}
