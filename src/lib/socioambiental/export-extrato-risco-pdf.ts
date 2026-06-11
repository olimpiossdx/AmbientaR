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
  RiscoPorGeometria,
  VereditoSocioambientalGlobal,
} from "@/lib/types/analise-socioambiental";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";
import type { CarHistoricoAvaliacao } from "@/lib/geospatial/car-snapshot-compare";
import { VEREDITO_LABELS } from "@/lib/socioambiental/veredito-socioambiental";
import { renderRiscoPorGeometriaPdfSection } from "@/lib/socioambiental/risco-pdf-tables";
import { renderCarHistoricoPdfSection } from "@/lib/socioambiental/merge-relatorio";
import type { ListasAgenteResult } from "@/lib/socioambiental/listas-agente-types";

export type ExtratoRiscoPdfInput = {
  titulo: string;
  dataEmissao?: string;
  car?: string;
  agenteNome?: string;
  agenteDocumento?: string;
  vereditoGlobal?: VereditoSocioambientalGlobal;
  riscoPorGeometria: RiscoPorGeometria[];
  carHistorico?: CarHistoricoAvaliacao | null;
  listasAgente?: ListasAgenteResult | null;
  wave?: WaveAAnalysisResult;
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

export async function generateExtratoRiscoPdfBlob(
  input: ExtratoRiscoPdfInput,
  branding: {
    brandingData: LocalBranding | null | undefined;
    pdfImages?: BrandingPdfImages | null;
    isPdfImagesLoading?: boolean;
    hasBrandingUrls?: boolean;
    toast?: BrandingPdfToastReporter;
  },
): Promise<{ blob: Blob; fileName: string } | null> {
  const session = await prepareIaMenuBrandedPdfSession(branding);
  if (!session) return null;

  const { doc } = session;
  const pageW = doc.internal.pageSize.getWidth();
  let y = session.startY;
  const emissao =
    input.dataEmissao ?? new Date().toISOString().slice(0, 10);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Extrato Risco Socioambiental", pageW / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(input.titulo, pageW / 2, y, { align: "center" });
  y += 14;

  const infoLines = [
    `Data de emissão: ${emissao}`,
    input.car ? `CAR: ${input.car}` : null,
    input.agenteNome ? `Agente: ${input.agenteNome}` : null,
    input.agenteDocumento
      ? `CPF/CNPJ: ${input.agenteDocumento}`
      : null,
    input.vereditoGlobal
      ? `Veredito global: ${VEREDITO_LABELS[input.vereditoGlobal]}`
      : null,
  ].filter(Boolean) as string[];

  for (const line of infoLines) {
    y = writeBrandedPdfParagraph(session, line, 10, y);
  }
  y += 4;

  if (input.listasAgente?.hits.length) {
    y = writeBrandedPdfTitle(session, "Cheque por documento", 11, y);
    for (const hit of input.listasAgente.hits) {
      y = writeBrandedPdfParagraph(
        session,
        `• ${hit.criterioId.replace(/_/g, " ")}: ${hit.resultado} — ${hit.detalhe}`,
        9,
        y,
      );
    }
    y += 4;
  }

  y = await renderRiscoPorGeometriaPdfSection(session, input.riscoPorGeometria);

  if (input.carHistorico) {
    y = await renderCarHistoricoPdfSection(session, input.carHistorico);
  }

  if (input.wave?.fontesConsultadas?.length) {
    y = brandedPdfNewPage(session);
    y = writeBrandedPdfTitle(session, "Tabela de referência", 12, y);
    for (const fonte of input.wave.fontesConsultadas.slice(0, 20)) {
      y = writeBrandedPdfParagraph(
        session,
        `• ${fonte.nome}: ${fonte.url}`,
        8,
        y,
      );
    }
  }

  y = writeBrandedPdfParagraph(
    session,
    "Documento gerado por consulta automatizada. Não substitui vistoria de campo nem parecer conclusivo sem validação por profissional habilitado.",
    8,
    y,
  );

  const slug = slugify(input.titulo) || "risco";
  const fileName = `Extrato_Risco_Socioambiental_${slug}_${emissao}.pdf`;
  session.finalize();
  const blob = session.doc.output("blob") as Blob;
  return { blob, fileName };
}

export async function downloadExtratoRiscoPdf(
  input: ExtratoRiscoPdfInput,
  branding: Parameters<typeof generateExtratoRiscoPdfBlob>[1],
): Promise<boolean> {
  const result = await generateExtratoRiscoPdfBlob(input, branding);
  if (!result) return false;
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.fileName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
