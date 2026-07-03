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
  AlertaExtratoUnificado,
  DetalheAnalise,
  ModoRelatorioSocioambiental,
  ProdesModoCriterio,
  ResultadoCriterio,
  RiscoPorGeometria,
  VereditoSocioambientalGlobal,
} from "@/lib/types/analise-socioambiental";
import {
  renderAlertasUnificadosPdfSection,
  renderCarHistoricoPdfSection,
} from "@/lib/socioambiental/merge-relatorio";
import type { CarHistoricoAvaliacao } from "@/lib/geospatial/car-snapshot-compare";
import type { ListasAgenteResult } from "@/lib/socioambiental/listas-agente-types";
import { renderRiscoPorGeometriaPdfSection } from "@/lib/socioambiental/risco-pdf-tables";
import type {
  GeoAnalysisComplementOutput,
  GeoLayerResult,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import { SOCIOAMBIENTAL_REPORT_BLOCKS } from "@/lib/socioambiental/report-blocks-catalog";
import { criterioResultadoFillColor } from "@/lib/socioambiental/criterio-resultado-display";
import { modoRelatorioLabel } from "@/lib/socioambiental/socioambiental-wizard-state";
import { VEREDITO_LABELS } from "@/lib/socioambiental/veredito-socioambiental";
import { buildSocioambientalSemaphoreMapPng } from "@/lib/socioambiental/socioambiental-semaphore-map";
import type { SocioambientalReportBlockId } from "@/lib/socioambiental/socioambiental-criteria-catalog";

export type SocioambientalExtratoPdfInput = {
  titulo: string;
  dataEmissao?: string;
  areaHa?: number;
  car?: string;
  municipio?: string;
  uf?: string;
  biomaLabel?: string;
  metodoLocalizacao?: string;
  perimetroFonte?: string;
  confiancaLocalizacao?: string;
  carResolvidoAutomaticamente?: boolean;
  gpsAccuracyM?: number;
  pacoteBlocos?: string[];
  modoRelatorio?: ModoRelatorioSocioambiental;
  vereditoGlobal?: VereditoSocioambientalGlobal;
  prodesModo?: ProdesModoCriterio;
  criteriosResultados: ResultadoCriterio[];
  detalhesAnalise?: DetalheAnalise[];
  layers: GeoLayerResult[];
  wave?: WaveAAnalysisResult;
  riscoPorGeometria?: RiscoPorGeometria[];
  alertasUnificados?: AlertaExtratoUnificado[];
  carHistorico?: CarHistoricoAvaliacao | null;
  listasAgente?: ListasAgenteResult | null;
  pdfExternoUrl?: string;
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
        data.cell.styles.fillColor = criterioResultadoFillColor(resultado);
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

async function renderSemaphoreMap(
  session: NonNullable<Awaited<ReturnType<typeof prepareIaMenuBrandedPdfSession>>>,
  input: SocioambientalExtratoPdfInput,
  startY: number,
): Promise<number> {
  if (!input.wave) return startY;

  let y = brandedPdfNewPage(session);
  y = writeBrandedPdfTitle(session, "Mapa de restrições socioambientais", 12, y);
  y = writeBrandedPdfParagraph(
    session,
    "Vermelho: Inapto (sobreposição bloqueante). Amarelo: Alerta (buffer 3 km ou proximidade).",
    9,
    y,
  );

  const png = await buildSocioambientalSemaphoreMapPng({
    wave: input.wave,
    criterios: input.criteriosResultados,
    blockIds: (input.pacoteBlocos ?? []) as SocioambientalReportBlockId[],
    prodesModo: input.prodesModo,
    propertyName: input.titulo,
  });

  if (!png) {
    return writeBrandedPdfParagraph(
      session,
      "Mapa indisponível (perímetro inválido ou falha na geração).",
      9,
      y,
    );
  }

  const { doc, margins, contentWidth } = session;
  const maxWidthMm = contentWidth;
  const maxHeightMm = 125;
  y = session.ensureSpace(y, maxHeightMm + 8);
  try {
    const props = doc.getImageProperties(png);
    const ratio = props.width / props.height;
    let wMm = Math.min(maxWidthMm, contentWidth);
    let hMm = wMm / ratio;
    if (hMm > maxHeightMm) {
      hMm = maxHeightMm;
      wMm = hMm * ratio;
    }
    const x = margins.left + (contentWidth - wMm) / 2;
    doc.addImage(png, "PNG", x, y, wMm, hMm);
    y += hMm + 6;
  } catch {
    y = writeBrandedPdfParagraph(session, "Falha ao incorporar mapa no PDF.", 9, y);
  }

  return y;
}

async function renderFontesTable(
  session: NonNullable<Awaited<ReturnType<typeof prepareIaMenuBrandedPdfSession>>>,
  input: SocioambientalExtratoPdfInput,
  startY: number,
): Promise<number> {
  const rows: [string, string, string][] = [];
  const seen = new Set<string>();

  for (const fonte of input.wave?.fontesConsultadas ?? []) {
    const key = `${fonte.nome}|${fonte.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push([fonte.nome, fonte.url, fonte.tipo]);
  }

  for (const layer of input.layers) {
    if (!layer.source) continue;
    const key = `${layer.source.name}|${layer.source.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push([
      layer.source.name,
      layer.source.url,
      layer.source.method ?? "ogc",
    ]);
  }

  if (!rows.length) return startY;

  let y = session.ensureSpace(startY, 20);
  y = writeBrandedPdfTitle(session, "Tabela de referência (fontes)", 12, y);

  const { default: autoTable } = await import("jspdf-autotable");
  autoTable(session.doc, {
    startY: y,
    margin: { left: session.margins.left, right: session.margins.right },
    head: [["Fonte", "URL / método", "Tipo"]],
    body: rows.slice(0, 40),
    styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 22 },
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
  const isCompleto = input.modoRelatorio === "extrato_completo";
  const tituloDocumento = isCompleto
    ? "Extrato Socioambiental completo"
    : "Extrato de Análise Socioambiental";

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(tituloDocumento, pageW / 2, y, {
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
    input.metodoLocalizacao
      ? `Localização: ${input.metodoLocalizacao}${input.confiancaLocalizacao ? ` (${input.confiancaLocalizacao})` : ""}`
      : null,
    input.perimetroFonte ? `Perímetro: ${input.perimetroFonte}` : null,
    input.carResolvidoAutomaticamente
      ? "CAR resolvido automaticamente a partir de coordenadas/GPS"
      : null,
    input.gpsAccuracyM != null
      ? `Precisão GPS: ±${Math.round(input.gpsAccuracyM)} m`
      : null,
    input.biomaLabel ? `Bioma (preset): ${input.biomaLabel}` : null,
    input.pacoteBlocos?.length
      ? `Pacote: ${blockTitlesFromIds(input.pacoteBlocos)}`
      : null,
    input.modoRelatorio
      ? `Modo: ${modoRelatorioLabel(input.modoRelatorio)}`
      : null,
    input.vereditoGlobal
      ? `Veredito global: ${VEREDITO_LABELS[input.vereditoGlobal]}`
      : null,
    input.prodesModo
      ? `PRODES: ${input.prodesModo === "por_ano" ? "por ano" : "agregado"}`
      : null,
    input.pdfExternoUrl
      ? `PDF externo de referência: ${input.pdfExternoUrl}`
      : null,
  ].filter(Boolean) as string[];

  for (const line of infoLines) {
    y = writeBrandedPdfParagraph(session, line, 10, y);
  }
  y += 4;

  y = await renderCriteriaTable(session, input.criteriosResultados, y);

  y = await renderSemaphoreMap(session, input, y);

  if (isCompleto && input.riscoPorGeometria?.length) {
    y = await renderRiscoPorGeometriaPdfSection(session, input.riscoPorGeometria);
  }

  if (isCompleto && input.alertasUnificados) {
    y = await renderAlertasUnificadosPdfSection(session, input.alertasUnificados);
  }

  if (isCompleto && input.carHistorico) {
    y = await renderCarHistoricoPdfSection(session, input.carHistorico);
  }

  if (!isCompleto && input.detalhesAnalise?.length) {
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

  if (!isCompleto && input.layers.length > 0) {
    y = await renderLayersSection(session, input.layers, y);
  }

  y = await renderFontesTable(session, input, y);

  if (!isCompleto && input.riscoPorGeometria?.length) {
    y = await renderRiscoPorGeometriaPdfSection(session, input.riscoPorGeometria);
  }

  y = writeBrandedPdfParagraph(
    session,
    "Documento gerado por consulta automatizada a bases públicas (SIG). Não substitui vistoria de campo nem parecer conclusivo sem validação por profissional habilitado.",
    8,
    y,
  );

  if (input.complement) {
    renderComplementSection(session, input.complement, y);
  }

  const slug = slugify(input.titulo) || "extrato";
  const fileName = isCompleto
    ? `Extrato_Completo_${slug}_${emissao}.pdf`
    : `Extrato_Socioambiental_${slug}_${emissao}.pdf`;
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
