"use client";

import type { BrandingPdfImages } from "@/lib/branding-pdf";
import type { LocalBranding } from "@/hooks/use-local-branding";
import {
  prepareIaMenuBrandedPdfSession,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
  brandedPdfNewPage,
} from "@/lib/ia-menu-branded-pdf";
import type { BrandingPdfToastReporter } from "@/lib/pdf-branding-layout";
import type {
  DetalheAnalise,
  ResultadoCriterio,
} from "@/lib/types/analise-socioambiental";
import type {
  GeoAnalysisComplementOutput,
  GeoLayerResult,
} from "@/lib/types/geo-wave-a";
import { SOCIOAMBIENTAL_REPORT_BLOCKS } from "@/lib/socioambiental/report-blocks-catalog";

export type SocioambientalExtratoPdfInput = {
  titulo: string;
  dataEmissao?: string;
  areaHa?: number;
  car?: string;
  municipio?: string;
  uf?: string;
  biomaLabel?: string;
  pacoteBlocos?: string[];
  criteriosResultados: ResultadoCriterio[];
  detalhesAnalise?: DetalheAnalise[];
  layers: GeoLayerResult[];
  complement?: GeoAnalysisComplementOutput | null;
};

export type SocioambientalPdfExportResult = {
  blob: Blob;
  fileName: string;
};

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36)
    .toLowerCase();
}

function resultadoFillColor(resultado: string): [number, number, number] {
  if (resultado === "Apto") return [34, 139, 34];
  if (resultado === "Inapto") return [185, 28, 28];
  return [100, 116, 139];
}

function blockTitlesFromIds(ids: string[] | undefined): string {
  if (!ids?.length) return "—";
  return ids
    .map((id) => SOCIOAMBIENTAL_REPORT_BLOCKS.find((b) => b.id === id)?.title ?? id)
    .join("; ");
}

async function renderCriteriaTable(
  session: Awaited<ReturnType<typeof prepareIaMenuBrandedPdfSession>>,
  criterios: ResultadoCriterio[],
  startY: number,
): Promise<number> {
  if (!session) return startY;
  const { default: autoTable } = await import("jspdf-autotable");
  let y = writeBrandedPdfTitle(session, "Critérios socioambientais", 12, startY);

  autoTable(session.doc, {
    startY: y,
    margin: { left: session.margins.left, right: session.margins.right },
    head: [["Critério", "Resultado", "Observação"]],
    body: criterios.map((c) => [
      c.criterio,
      c.resultado,
      c.detalhe ?? "—",
    ]),
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [22, 101, 52], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        const resultado = String(data.cell.raw ?? "");
        data.cell.styles.fillColor = resultadoFillColor(resultado);
        data.cell.styles.textColor = 255;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const doc = session.doc as import("jspdf").jsPDF & {
    lastAutoTable?: { finalY: number };
  };
  return (doc.lastAutoTable?.finalY ?? y) + 8;
}

async function renderLayersSection(
  session: NonNullable<Awaited<ReturnType<typeof prepareIaMenuBrandedPdfSession>>>,
  layers: GeoLayerResult[],
  startY: number,
): Promise<number> {
  let y = session.ensureSpace(startY, 16);
  y = writeBrandedPdfTitle(session, "Detalhamento por camada consultada", 12, y);

  for (const layer of layers) {
    y = session.ensureSpace(y, 14);
    y = writeBrandedPdfTitle(session, layer.title, 10, y);
    const status =
      layer.status === "ok"
        ? "Consulta OK"
        : layer.status === "partial"
          ? "Parcial"
          : "Indisponível";
    y = writeBrandedPdfParagraph(
      session,
      `${status}. ${layer.summary}`,
      9,
      y,
    );
    if (layer.stats.length > 0) {
      for (const row of layer.stats.slice(0, 6)) {
        const ha = row.areaHa != null ? `${row.areaHa.toFixed(2)} ha` : "—";
        const pct =
          row.pctOfPerimeter != null ? `${row.pctOfPerimeter}%` : "—";
        y = writeBrandedPdfParagraph(
          session,
          `• ${row.label}: ${ha} (${pct} do imóvel)`,
          8,
          y,
        );
      }
    }
    y += 2;
    if (y > session.doc.internal.pageSize.getHeight() - 40) {
      y = brandedPdfNewPage(session);
    }
  }
  return y;
}

function renderComplementSection(
  session: NonNullable<Awaited<ReturnType<typeof prepareIaMenuBrandedPdfSession>>>,
  complement: GeoAnalysisComplementOutput,
  startY: number,
): number {
  let y = brandedPdfNewPage(session);
  y = writeBrandedPdfTitle(session, "Parecer técnico (rascunho IA)", 13, y);
  y = writeBrandedPdfParagraph(session, complement.resumoExecutivo, 10, y);
  for (const section of complement.sections) {
    y = writeBrandedPdfTitle(session, section.title, 11, y);
    y = writeBrandedPdfParagraph(session, section.bodyMarkdown, 9, y);
  }
  return writeBrandedPdfParagraph(session, complement.disclaimer, 8, y);
}

export async function generateSocioambientalExtratoPdfBlob(
  input: SocioambientalExtratoPdfInput,
  branding: {
    brandingData: LocalBranding | null | undefined;
    pdfImages?: BrandingPdfImages | null;
    isPdfImagesLoading?: boolean;
    hasBrandingUrls?: boolean;
    toast?: BrandingPdfToastReporter;
  },
): Promise<SocioambientalPdfExportResult | null> {
  const session = await prepareIaMenuBrandedPdfSession(branding);
  if (!session) return null;

  const { doc } = session;
  const pageW = doc.internal.pageSize.getWidth();
  let y = session.startY;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Extrato de Análise Socioambiental", pageW / 2, y, {
    align: "center",
  });
  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(input.titulo, pageW / 2, y, { align: "center" });
  y += 14;

  const emissao =
    input.dataEmissao ?? new Date().toISOString().slice(0, 10);
  const infoLines = [
    `Data de emissão: ${emissao}`,
    input.areaHa != null ? `Área calculada: ${input.areaHa.toFixed(2)} ha` : null,
    input.car ? `CAR: ${input.car}` : null,
    input.municipio
      ? `Município: ${input.municipio}${input.uf ? `/${input.uf}` : ""}`
      : null,
    input.biomaLabel ? `Bioma (preset): ${input.biomaLabel}` : null,
    input.pacoteBlocos?.length
      ? `Pacote: ${blockTitlesFromIds(input.pacoteBlocos)}`
      : null,
  ].filter(Boolean) as string[];

  for (const line of infoLines) {
    y = writeBrandedPdfParagraph(session, line, 10, y);
  }
  y += 4;

  y = await renderCriteriaTable(session, input.criteriosResultados, y);

  if (input.detalhesAnalise?.length) {
    y = writeBrandedPdfTitle(session, "Detalhes das restrições", 12, y);
    for (const d of input.detalhesAnalise.slice(0, 20)) {
      const parts = [
        d.criterio,
        d.tamanhoDeteccoesHa != null
          ? `${d.tamanhoDeteccoesHa.toFixed(2)} ha`
          : null,
        d.observacao,
      ].filter(Boolean);
      y = writeBrandedPdfParagraph(session, `• ${parts.join(" — ")}`, 9, y);
    }
    y += 4;
  }

  if (input.layers.length > 0) {
    y = await renderLayersSection(session, input.layers, y);
  }

  if (input.complement) {
    renderComplementSection(session, input.complement, y);
  }

  const slug = slugify(input.titulo) || "extrato";
  const fileName = `Extrato_Socioambiental_${slug}_${emissao}.pdf`;
  session.finalize();
  const blob = session.doc.output("blob") as Blob;
  return { blob, fileName };
}

export async function downloadSocioambientalExtratoPdf(
  input: SocioambientalExtratoPdfInput,
  branding: Parameters<typeof generateSocioambientalExtratoPdfBlob>[1],
): Promise<boolean> {
  const result = await generateSocioambientalExtratoPdfBlob(input, branding);
  if (!result) return false;
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.fileName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
