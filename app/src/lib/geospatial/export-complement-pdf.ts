import type { MmBrandedPdfSession } from "@/lib/pdf-branding-layout";
import {
  brandedPdfNewPage,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from "@/lib/ia-menu-branded-pdf";
import { appendWaveAFactualPdf } from "@/lib/geospatial/export-wave-a-pdf";
import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import type { CartographicPngMap } from "@/lib/geospatial/render-minimap-client";

export type AppendGeoAnalysisComplementPdfOptions = {
  cartographicPngs?: CartographicPngMap | null;
  /** Exportar só uma camada factual (+ complemento completo se `all`). */
  layerId?: string | "all";
};

/** PDF Etapa 2: anexo factual (SIG) + complemento interpretativo (IA). */
export function appendGeoAnalysisComplementPdf(
  session: MmBrandedPdfSession,
  wave: WaveAAnalysisResult,
  complement: GeoAnalysisComplementOutput,
  options?: AppendGeoAnalysisComplementPdfOptions,
): void {
  const { doc } = session;
  const pageW = doc.internal.pageSize.getWidth();
  const layerId = options?.layerId ?? "all";
  let y = session.startY;

  y = session.ensureSpace(y, 20);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório geoespacial — Etapa 2", pageW / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    layerId === "all"
      ? "Anexo A: dados factuais (SIG) · Anexo B: complementação técnica (rascunho IA)"
      : `Camada: ${wave.layers.find((l) => l.layerId === layerId)?.title ?? layerId}`,
    pageW / 2,
    y,
    { align: "center" },
  );
  y += 12;

  y = writeBrandedPdfTitle(session, "Anexo A — Dados factuais (IDE-Sisema MG)", 13, y);
  y = writeBrandedPdfParagraph(
    session,
    "Mapas cartográficos (layout consultoria) seguidos dos dados de interseção automática. A secção B não altera estes números.",
    9,
    y,
  );

  y = appendWaveAFactualPdf(session, wave, {
    includeReportTitle: false,
    closingNote: null,
    startY: y,
    cartographicPngs: options?.cartographicPngs,
    layerId,
  });

  if (layerId !== "all") {
    return;
  }

  y = brandedPdfNewPage(session);
  y = writeBrandedPdfTitle(session, "Anexo B — Complementação técnica (rascunho IA)", 13, y);
  y = writeBrandedPdfParagraph(session, complement.resumoExecutivo, 10, y);

  for (const section of complement.sections) {
    y = writeBrandedPdfTitle(session, section.title, 12, y);
    y = writeBrandedPdfParagraph(session, section.bodyMarkdown, 10, y);
  }

  writeBrandedPdfParagraph(session, complement.disclaimer, 8, y);
}
