import type { RiscoPorGeometria } from "@/lib/types/analise-socioambiental";
import {
  brandedPdfNewPage,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from "@/lib/ia-menu-branded-pdf";
import type { MmBrandedPdfSession } from "@/lib/pdf-branding-layout";
import { criterioResultadoFillColor } from "@/lib/socioambiental/criterio-resultado-display";

export async function renderRiscoPorGeometriaPdfSection(
  session: MmBrandedPdfSession,
  geometrias: RiscoPorGeometria[],
): Promise<number> {
  let y = brandedPdfNewPage(session);
  y = writeBrandedPdfTitle(session, "Anexo — Risco por geometria", 12, y);
  y = writeBrandedPdfParagraph(
    session,
    "Tabelas de sobreposição e proximidade por imóvel/gleba (Extrato Risco Socioambiental).",
    9,
    y,
  );

  for (const geometria of geometrias) {
    if (y > session.doc.internal.pageSize.getHeight() - 80) {
      y = brandedPdfNewPage(session);
    }
    y = session.ensureSpace(y, 24);
    y = writeBrandedPdfTitle(
      session,
      `${geometria.rotulo} — ${geometria.areaHa.toFixed(2)} ha`,
      11,
      y,
    );

    if (geometria.linhas.length === 0) {
      y = writeBrandedPdfParagraph(
        session,
        "Nenhum risco espacial identificado.",
        9,
        y,
      );
      continue;
    }

    const { default: autoTable } = await import("jspdf-autotable");
    autoTable(session.doc, {
      startY: y,
      margin: { left: session.margins.left, right: session.margins.right },
      head: [["Tipo de risco", "Sobrep. (ha)", "%", "Prox. (m)", "Resultado"]],
      body: geometria.linhas.map((l) => [
        l.tipoRisco,
        l.sobreposicaoHa > 0.01 ? l.sobreposicaoHa.toFixed(2) : "0",
        l.sobreposicaoPct > 0.01 ? l.sobreposicaoPct.toFixed(2) : "0",
        l.proximidadeM != null ? String(l.proximidadeM) : "—",
        l.resultado,
      ]),
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 62 },
        1: { cellWidth: 22, halign: "right" },
        2: { cellWidth: 16, halign: "right" },
        3: { cellWidth: 22, halign: "right" },
        4: { cellWidth: 24, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const resultado = String(data.cell.raw ?? "");
          data.cell.styles.fillColor = criterioResultadoFillColor(resultado);
          data.cell.styles.textColor = 255;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const doc = session.doc as import("jspdf").jsPDF & {
      lastAutoTable?: { finalY: number };
    };
    y = (doc.lastAutoTable?.finalY ?? y) + 10;
  }

  return y;
}
