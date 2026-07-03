'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import type { LocalBranding } from '@/hooks/use-local-branding';
import { hasCompleteBrandingUrls } from '@/lib/branding/requirements';
import {
  prepareIaMenuBrandedPdfSession,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from '@/lib/ia-menu-branded-pdf';
import type { MmBrandedPdfSession } from '@/lib/pdf-branding-layout';
import type { PeaProgram } from '@/lib/pea/types';
import {
  buildPeaExportBaseName,
  buildPeaExportSections,
  type ExportSection,
} from '@/lib/pea/pea-export-sections';

export type PeaPdfExportResult = {
  blob: Blob;
  fileName: string;
};

function fmt(v: string | undefined | null): string {
  return v != null && String(v).trim() !== '' ? String(v).trim() : '—';
}

function renderSection(
  session: MmBrandedPdfSession,
  title: string,
  body: string,
  startY: number,
): number {
  let y = writeBrandedPdfTitle(session, title, 12, startY);
  const parts = body.split(/\n+/).filter((p) => p.trim());
  if (parts.length === 0) {
    y = writeBrandedPdfParagraph(session, '—', 10, y);
    return y + 4;
  }
  for (const line of parts) {
    y = writeBrandedPdfParagraph(session, line, 10, y);
  }
  return y + 4;
}

function renderAllSections(session: MmBrandedPdfSession, sections: ExportSection[], startY: number): number {
  let y = startY;
  for (const sec of sections) {
    y = session.ensureSpace(y + 6, 36);
    y = renderSection(session, sec.title, sec.body, y);
  }
  return y;
}

export async function generatePeaExportPdfBlob(
  pea: PeaProgram,
  brandingData: LocalBranding | null | undefined,
  pdfImages?: BrandingPdfImages | null,
): Promise<PeaPdfExportResult> {
  const session = await prepareIaMenuBrandedPdfSession({
    brandingData,
    pdfImages,
    hasBrandingUrls: hasCompleteBrandingUrls(brandingData),
  });
  if (!session) {
    throw new Error('Configure a identidade visual em Configurações para exportar PDF.');
  }

  const { doc } = session;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = pageHeight * 0.28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const title = 'PROGRAMA DE EDUCAÇÃO AMBIENTAL (PEA)';
  for (const line of doc.splitTextToSize(title, session.contentWidth)) {
    doc.text(line, session.margins.left, y);
    y += 8;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  y += 6;
  for (const line of [
    fmt(pea.empreendimento.nome),
    fmt(pea.requerente.nome),
    `Status: ${fmt(pea.status)}`,
    new Date().toLocaleDateString('pt-BR'),
  ]) {
    doc.text(line, session.margins.left, y);
    y += 7;
  }

  y = session.ensureSpace(y + 10, 40);
  y = renderAllSections(session, buildPeaExportSections(pea), y);

  const blob = doc.output('blob');
  return { blob, fileName: `${buildPeaExportBaseName(pea)}.pdf` };
}
