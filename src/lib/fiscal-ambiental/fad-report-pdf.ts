import type { jsPDF } from "jspdf";
import { CHANGE_TYPE_LABELS } from "./intelligence-labels";
import { FINDING_TYPE_LABELS, SEVERITY_LABELS } from "./fiscal-finding-labels";
import { FAD_ATTRIBUTION } from "./constants";
import { FAD_REPORT_DISCLAIMER, REPORT_METHODOLOGY, REPORT_TYPE_LABELS } from "./report-labels";
import type {
  FadChangeAnalysis,
  FadFiscalFinding,
  FadMosaic,
  FadReportType,
  FadTimelineEvent,
  FadWorkspace,
} from "./types";

export type FadReportData = {
  workspace: FadWorkspace;
  type: FadReportType;
  mosaics: FadMosaic[];
  timeline: FadTimelineEvent[];
  analyses: FadChangeAnalysis[];
  findings: FadFiscalFinding[];
  generatedAt: string;
};

const ML = 20;
const MR = 20;
const MT = 22;
const MB = 20;

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need > pageH - MB) {
    doc.addPage();
    return MT;
  }
  return y;
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, ML, y);
  return y + 8;
}

function addParagraph(doc: jsPDF, y: number, text: string, maxWidth = 170): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    y = ensureSpace(doc, y, 6);
    doc.text(line, ML, y);
    y += 5;
  }
  return y + 3;
}

function addTable(
  doc: jsPDF,
  y: number,
  headers: string[],
  rows: string[][],
): number {
  const colW = 170 / headers.length;
  y = ensureSpace(doc, y, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  headers.forEach((h, i) => doc.text(h, ML + i * colW, y));
  y += 6;
  doc.setFont("helvetica", "normal");
  for (const row of rows) {
    y = ensureSpace(doc, y, 6);
    row.forEach((cell, i) => {
      const clipped = doc.splitTextToSize(cell, colW - 2)[0] ?? cell;
      doc.text(clipped, ML + i * colW, y);
    });
    y += 5;
  }
  return y + 4;
}

export async function buildFadReportPdf(data: FadReportData): Promise<Buffer> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = MT;

  // Capa
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Fiscal Ambiental Digital", pageW / 2, y + 20, { align: "center" });
  doc.setFontSize(14);
  doc.text(REPORT_TYPE_LABELS[data.type], pageW / 2, y + 32, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(data.workspace.name, pageW / 2, y + 44, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Emitido em: ${data.generatedAt.slice(0, 10)}`, pageW / 2, y + 54, { align: "center" });
  doc.text(`Fonte: ${FAD_ATTRIBUTION}`, pageW / 2, y + 60, { align: "center" });

  doc.addPage();
  y = MT;

  // Identificação
  y = addSectionTitle(doc, y, "1. Identificação");
  y = addParagraph(doc, y, `Imóvel: ${data.workspace.name}`);
  if (data.workspace.areaHa != null) {
    y = addParagraph(doc, y, `Área aproximada (AOI): ${data.workspace.areaHa} ha`);
  }
  if (data.workspace.carCode) {
    y = addParagraph(doc, y, `CAR: ${data.workspace.carCode}`);
  }
  y = addParagraph(doc, y, `Workspace: ${data.workspace.id}`);

  // Metodologia
  y = addSectionTitle(doc, y, "2. Metodologia");
  y = addParagraph(doc, y, REPORT_METHODOLOGY);

  const includeAcervo = data.type === "acervo" || data.type === "consolidado";
  const includeMudancas = data.type === "mudancas" || data.type === "consolidado";
  const includeFiscal = data.type === "fiscalizacao" || data.type === "consolidado";
  const includeTimeline = data.type === "consolidado";

  if (includeAcervo) {
    y = addSectionTitle(doc, y, "3. Acervo satelital");
    const ready = data.mosaics.filter((m) => m.status === "ready");
    y = addParagraph(
      doc,
      y,
      `Total de imagens prontas: ${ready.length}. ` +
        (data.workspace.archiveSummary?.yearMin
          ? `Período: ${data.workspace.archiveSummary.yearMin}–${data.workspace.archiveSummary.yearMax}.`
          : ""),
    );
    if (ready.length) {
      y = addTable(
        doc,
        y,
        ["Data", "Resolução (m)", "Qualidade"],
        ready.slice(0, 30).map((m) => [
          m.requestedDate,
          m.resolutionM != null ? String(m.resolutionM) : "—",
          m.quality ?? "—",
        ]),
      );
      if (ready.length > 30) {
        y = addParagraph(doc, y, `(+ ${ready.length - 30} imagens não listadas)`);
      }
    }
  }

  if (includeTimeline && data.timeline.length) {
    y = addSectionTitle(doc, y, "4. Linha do tempo (resumo)");
    y = addTable(
      doc,
      y,
      ["Data", "Evento"],
      data.timeline.slice(0, 20).map((e) => [e.occurredAt.slice(0, 10), e.title]),
    );
  }

  if (includeMudancas) {
    y = addSectionTitle(doc, y, includeTimeline ? "5. Análises de mudanças" : "3. Análises de mudanças");
    const ready = data.analyses.filter((a) => a.status === "ready");
    if (!ready.length) {
      y = addParagraph(doc, y, "Nenhuma análise de mudanças registada.");
    } else {
      for (const a of ready) {
        y = addParagraph(
          doc,
          y,
          `Período ${a.beforeDate} → ${a.afterDate}: perda ${a.summary.lossHa} ha, ` +
            `ganho ${a.summary.gainHa} ha, solo exposto ${a.summary.bareHa} ha ` +
            `(confiança ${Math.round(a.confidence * 100)}%).`,
        );
        if (a.polygons.length) {
          y = addTable(
            doc,
            y,
            ["Tipo", "Área (ha)"],
            a.polygons.slice(0, 10).map((p) => [
              CHANGE_TYPE_LABELS[p.type],
              String(p.areaHa),
            ]),
          );
        }
      }
    }
  }

  if (includeFiscal) {
    const sec = includeMudancas ? (includeTimeline ? "6" : "4") : "3";
    y = addSectionTitle(doc, y, `${sec}. Achados preventivos`);
    const open = data.findings.filter((f) => f.status !== "dismissed");
    if (!open.length) {
      y = addParagraph(doc, y, "Nenhum achado aberto ou em análise.");
    } else {
      y = addTable(
        doc,
        y,
        ["Tipo", "Severidade", "Status", "Área (ha)"],
        open.map((f) => [
          FINDING_TYPE_LABELS[f.type],
          SEVERITY_LABELS[f.severity],
          f.status,
          f.areaHa != null ? String(f.areaHa) : "—",
        ]),
      );
    }
  }

  // Conclusão auxiliar
  y = addSectionTitle(doc, y, "Conclusão auxiliar");
  y = addParagraph(
    doc,
    y,
    "Os resultados apresentados constituem apoio técnico à tomada de decisão e à " +
      "organização de evidências visuais. Recomenda-se confirmação em campo quando " +
      "houver achados de maior severidade.",
  );

  // Ressalva
  y = addSectionTitle(doc, y, "Ressalva");
  doc.setFont("helvetica", "italic");
  y = addParagraph(doc, y, FAD_REPORT_DISCLAIMER);

  const ab = doc.output("arraybuffer");
  return Buffer.from(ab);
}
