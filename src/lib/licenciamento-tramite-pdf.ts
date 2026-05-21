/**
 * PDF de resumo do trâmite (módulo Licenciamento / coleção `requests`).
 */

import type jsPDF from "jspdf";
import type { LicenciamentoTramiteReportContext } from "@/lib/licenciamento-tramite-report";
import { buildLicenciamentoTramiteReportLines } from "@/lib/licenciamento-tramite-report";
import { LICENCIAMENTO_MENU_LABEL } from "@/lib/licenciamento-menu";
import type { MmBrandedPdfSession } from "@/lib/pdf-branding-layout";

const MARGIN_X = 15;
const LINE_HEIGHT = 5;

function appendWrappedLines(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  session: MmBrandedPdfSession,
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  let cy = y;
  for (const line of lines) {
    cy = session.ensureSpace(cy, LINE_HEIGHT + 1);
    doc.text(line, x, cy);
    cy += LINE_HEIGHT;
  }
  return cy;
}

/** Monta o corpo do PDF na sessão com identidade visual. */
export async function buildLicenciamentoTramitePdf(
  doc: jsPDF,
  ctx: LicenciamentoTramiteReportContext,
  session: MmBrandedPdfSession,
  startY: number,
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN_X * 2;
  let y = session.ensureSpace(startY, 24);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${LICENCIAMENTO_MENU_LABEL} — Resumo do trâmite`, pageWidth / 2, y, {
    align: "center",
  });
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const bodyLines = buildLicenciamentoTramiteReportLines(ctx);
  for (const line of bodyLines) {
    if (line === "") {
      y += 3;
      continue;
    }
    const isSection =
      !line.startsWith("  ") &&
      !line.startsWith("—") &&
      line.endsWith(":") &&
      !line.includes("—");
    if (isSection) {
      y = session.ensureSpace(y, LINE_HEIGHT + 4);
      doc.setFont("helvetica", "bold");
      y = appendWrappedLines(doc, line, MARGIN_X, y, contentWidth, session);
      doc.setFont("helvetica", "normal");
      y += 2;
      continue;
    }
    y = appendWrappedLines(doc, line, MARGIN_X, y, contentWidth, session);
  }

  return y;
}
