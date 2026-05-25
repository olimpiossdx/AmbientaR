'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import type { LocalBranding } from '@/hooks/use-local-branding';
import {
  prepareIaMenuBrandedPdfSession,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from '@/lib/ia-menu-branded-pdf';
import type { MmBrandedPdfSession } from '@/lib/pdf-branding-layout';
import type { ProjetoTecnicoBarragem } from '@/lib/types';
import { buildBarragemExportBaseName } from '@/lib/barragem/barragem-export-filename';
import { buildBarragemExportSections } from '@/lib/barragem/barragem-export-sections';

export type BarragemPdfExportResult = {
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
  for (const para of body.split(/\n+/).filter((p) => p.trim())) {
    y = writeBrandedPdfParagraph(session, para.trim(), 10, y);
  }
  return y + 4;
}

export async function generateBarragemExportPdfBlob(
  projeto: ProjetoTecnicoBarragem,
  brandingData: LocalBranding | null | undefined,
  pdfImages?: BrandingPdfImages | null,
): Promise<BarragemPdfExportResult> {
  const session = await prepareIaMenuBrandedPdfSession({
    brandingData,
    pdfImages,
    hasBrandingUrls: !!(
      brandingData?.headerImageUrl ||
      brandingData?.footerImageUrl ||
      brandingData?.watermarkImageUrl
    ),
  });
  if (!session) {
    throw new Error('Configure a identidade visual em Configurações para exportar PDF.');
  }

  const { doc } = session;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = pageHeight * 0.28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const title = 'PROJETO TÉCNICO DE BARRAGEM';
  for (const line of doc.splitTextToSize(title, session.contentWidth)) {
    doc.text(line, session.margins.left, y);
    y += 8;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  y += 6;
  for (const line of [
    fmt(projeto.empreendimento?.nome),
    fmt(projeto.requerente?.nome),
    [projeto.empreendimento?.municipio, projeto.empreendimento?.uf]
      .filter(Boolean)
      .join(' - ') || '—',
    `Status: ${fmt(projeto.status ?? 'Rascunho')}`,
    projeto.dataEmissao || new Date().toLocaleDateString('pt-BR'),
  ]) {
    doc.text(line, session.margins.left, y);
    y += 7;
  }

  y = session.ensureSpace(y + 8, 40);

  if (projeto.apresentacao?.trim()) {
    y = renderSection(session, 'Apresentação', projeto.apresentacao, y);
  }

  for (const sec of buildBarragemExportSections(projeto)) {
    if (sec.title === 'Apresentação') continue;
    y = session.ensureSpace(y, 30);
    y = renderSection(session, sec.title, sec.body, y);
  }

  const blob = doc.output('blob');
  return {
    blob,
    fileName: `${buildBarragemExportBaseName(projeto)}.pdf`,
  };
}
