import type { MmBrandedPdfSession } from "@/lib/pdf-branding-layout";
import { drawWatermarkOnPage } from "@/lib/pdf-branding-layout";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";

export function appendWaveAFactualPdf(
  session: MmBrandedPdfSession,
  result: WaveAAnalysisResult,
): void {
  const { doc, margins } = session;
  const pageW = doc.internal.pageSize.getWidth();
  let y = session.startY;
  const onPdfPage = () => drawWatermarkOnPage(doc, session.branding);
  const contentW = pageW - margins.left - margins.right;

  const ensureSpace = (needed: number) => {
    if (y > 280 - needed) {
      doc.addPage();
      onPdfPage();
      y = session.startY;
    }
  };

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório factual — Análise geoespacial MG", pageW / 2, y, {
    align: "center",
  });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("IDE-Sisema MG · Ondas A, B e C (8 camadas)", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(11);
  doc.text(`Área do empreendimento: ${result.perimeter.areaHa.toFixed(2)} ha`, margins.left, y);
  y += 6;
  doc.text(`Gerado em (UTC): ${result.generatedAtUtc}`, margins.left, y);
  y += 8;

  doc.setFontSize(9);
  const summaryLines = doc.splitTextToSize(result.factualSummary, contentW);
  doc.text(summaryLines, margins.left, y);
  y += summaryLines.length * 4.5 + 6;

  for (const layer of result.layers) {
    ensureSpace(40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(layer.title, margins.left, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const sumLines = doc.splitTextToSize(
      `${layer.summary} [${layer.status}]`,
      contentW,
    );
    doc.text(sumLines, margins.left, y);
    y += sumLines.length * 4 + 2;

    doc.setFont("helvetica", "normal");
    if (layer.stats.length === 0) {
      ensureSpace(8);
      doc.text("Sem interseção mensurável ou serviço indisponível.", margins.left, y);
      y += 8;
    } else {
      for (const row of layer.stats) {
        ensureSpace(6);
        const pct =
          row.pctOfPerimeter != null ? `${row.pctOfPerimeter}%` : "—";
        const ha = row.areaHa != null ? `${row.areaHa.toFixed(2)} ha` : "—";
        const km = row.lengthKm != null ? `${row.lengthKm.toFixed(2)} km` : "";
        const line = `• ${row.label}: ${ha} | ${pct} do empreendimento${km ? ` | ${km}` : ""}`;
        const lines = doc.splitTextToSize(line, contentW);
        doc.text(lines, margins.left, y);
        y += lines.length * 4.2;
      }
    }
    if (layer.source) {
      ensureSpace(6);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Fonte: ${layer.source.layerName} (${layer.source.method})`,
        margins.left,
        y,
      );
      doc.setTextColor(0);
      y += 5;
    }
    y += 4;
  }

  ensureSpace(20);
  doc.setFontSize(8);
  doc.text(
    "Documento factual (SIG). Complementação interpretativa disponível em Relatórios de IA (Etapa 2).",
    margins.left,
    y,
  );
}
