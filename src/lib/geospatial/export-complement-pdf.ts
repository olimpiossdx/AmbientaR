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

/** PDF Etapa 2: anexo factual (SIG) + complemento interpretativo (IA). */
export function appendGeoAnalysisComplementPdf(
  session: MmBrandedPdfSession,
  wave: WaveAAnalysisResult,
  complement: GeoAnalysisComplementOutput,
): void {
  const { doc } = session;
  const pageW = doc.internal.pageSize.getWidth();
  let y = session.startY;

  y = session.ensureSpace(y, 20);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório geoespacial — Etapa 2", pageW / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Anexo A: dados factuais (SIG) · Anexo B: complementação técnica (rascunho IA)",
    pageW / 2,
    y,
    { align: "center" },
  );
  y += 12;

  y = writeBrandedPdfTitle(session, "Anexo A — Dados factuais (IDE-Sisema MG)", 13, y);
  y = writeBrandedPdfParagraph(
    session,
    "Percentagens e áreas abaixo provêm exclusivamente da interseção automática. A secção B não altera estes números.",
    9,
    y,
  );

  appendWaveAFactualPdf(session, wave, {
    includeReportTitle: false,
    closingNote: null,
  });

  y = brandedPdfNewPage(session);
  y = writeBrandedPdfTitle(session, "Anexo B — Complementação técnica (rascunho IA)", 13, y);
  y = writeBrandedPdfParagraph(session, complement.resumoExecutivo, 10, y);

  for (const section of complement.sections) {
    y = writeBrandedPdfTitle(session, section.title, 12, y);
    y = writeBrandedPdfParagraph(session, section.bodyMarkdown, 10, y);
  }

  writeBrandedPdfParagraph(session, complement.disclaimer, 8, y);
}
