import type { MmBrandedPdfSession } from "@/lib/pdf-branding-layout";
import { writeBrandedPdfParagraph, writeBrandedPdfTitle } from "@/lib/ia-menu-branded-pdf";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";
import type { FactualMinimapSet } from "@/lib/geospatial/render-minimap-client";

export type AppendWaveAFactualPdfOptions = {
  /** Título principal centrado (relatório factual isolado). */
  includeReportTitle?: boolean;
  /** Nota final; `null` omite. */
  closingNote?: string | null;
  /** Mini-mapas PNG (Passo 3 / M1.12). */
  minimaps?: FactualMinimapSet | null;
};

function appendMinimapImage(
  session: MmBrandedPdfSession,
  dataUrl: string,
  caption: string,
  y: number,
  maxWidthMm = 170,
  maxHeightMm = 55,
): number {
  const { doc, margins, contentWidth } = session;
  let cursor = session.ensureSpace(y, maxHeightMm + 12);
  try {
    const props = doc.getImageProperties(dataUrl);
    const ratio = props.width / props.height;
    let wMm = maxWidthMm;
    let hMm = wMm / ratio;
    if (hMm > maxHeightMm) {
      hMm = maxHeightMm;
      wMm = hMm * ratio;
    }
    const x = margins.left + (contentWidth - wMm) / 2;
    doc.addImage(dataUrl, "PNG", x, cursor, wMm, hMm);
    cursor += hMm + 4;
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

export function appendWaveAFactualPdf(
  session: MmBrandedPdfSession,
  result: WaveAAnalysisResult,
  options?: AppendWaveAFactualPdfOptions,
): void {
  const { doc } = session;
  const pageW = doc.internal.pageSize.getWidth();
  const includeTitle = options?.includeReportTitle !== false;
  let y = session.startY;

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
    doc.text("IDE-Sisema MG · Análise SIG (9 camadas, incl. CECAV/cavidades)", pageW / 2, y, {
      align: "center",
    });
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
  y = writeBrandedPdfParagraph(session, result.factualSummary, 9, y);

  const minimaps = options?.minimaps;
  if (minimaps?.locationPng) {
    y = writeBrandedPdfTitle(session, "Mapa de localização", 11, y);
    y = appendMinimapImage(
      session,
      minimaps.locationPng,
      "Perímetro do empreendimento (esquemático)",
      y,
    );
  }

  for (const layer of result.layers) {
    y = session.ensureSpace(y, 40);
    y = writeBrandedPdfTitle(session, layer.title, 12, y);
    y = writeBrandedPdfParagraph(
      session,
      `${layer.summary} [${layer.status}]`,
      9,
      y,
    );

    if (layer.stats.length === 0) {
      y = writeBrandedPdfParagraph(
        session,
        "Sem interseção mensurável ou serviço indisponível.",
        9,
        y,
      );
    } else {
      for (const row of layer.stats) {
        const pct =
          row.pctOfPerimeter != null ? `${row.pctOfPerimeter}%` : "—";
        const ha = row.areaHa != null ? `${row.areaHa.toFixed(2)} ha` : "—";
        const km = row.lengthKm != null ? `${row.lengthKm.toFixed(2)} km` : "";
        const line = `• ${row.label}: ${ha} | ${pct} do empreendimento${km ? ` | ${km}` : ""}`;
        y = writeBrandedPdfParagraph(session, line, 9, y);
      }
    }
    if (layer.source) {
      y = writeBrandedPdfParagraph(
        session,
        `Fonte: ${layer.source.layerName} (${layer.source.method})`,
        8,
        y,
      );
    }
    const layerPng = minimaps?.layerPngs?.[layer.layerId];
    if (layerPng) {
      y = appendMinimapImage(
        session,
        layerPng,
        `Mapa esquemático — ${layer.title}`,
        y + 2,
        150,
        42,
      );
    }
    y += 2;
  }

  const closing =
    options?.closingNote === null
      ? null
      : (options?.closingNote ??
        "Documento factual (SIG). Complementação interpretativa disponível na Etapa 2.");
  if (closing) {
    writeBrandedPdfParagraph(session, closing, 8, y);
  }
}
