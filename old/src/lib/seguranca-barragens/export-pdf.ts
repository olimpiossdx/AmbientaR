'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import type { LocalBranding } from '@/hooks/use-local-branding';
import { hasCompleteBrandingUrls } from '@/lib/branding/requirements';
import {
  prepareIaMenuBrandedPdfSession,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from '@/lib/ia-menu-branded-pdf';
import {
  addBrandedPage,
  drawWatermarkOnPage,
  getContentStartY,
  type MmBrandedPdfSession,
} from '@/lib/pdf-branding-layout';
import type { EstudoSegurancaBarragem } from '@/lib/types';
import { buildSegurancaExportBaseName } from '@/lib/seguranca-barragens/export-filename';
import {
  buildSegurancaExportSections,
  type SegurancaExportSection,
} from '@/lib/seguranca-barragens/export-sections';
import {
  SEGURANCA_COVER_TITLE_TOP_MM,
  SEGURANCA_REPORT_TITLE,
  SEGURANCA_TOC_HEADING,
  buildSegurancaCoverMetaLines,
} from '@/lib/seguranca-barragens/export-layout';

export type SegurancaPdfExportResult = { blob: Blob; fileName: string };

type TocEntry = { title: string; page: number };

function renderCover(session: MmBrandedPdfSession, estudo: EstudoSegurancaBarragem): void {
  const { doc, margins, contentWidth } = session;
  const rightX = margins.left + contentWidth;
  let y = SEGURANCA_COVER_TITLE_TOP_MM;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  for (const line of doc.splitTextToSize(SEGURANCA_REPORT_TITLE, contentWidth)) {
    doc.text(line, margins.left, y);
    y += 8;
  }
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  for (const line of buildSegurancaCoverMetaLines(estudo)) {
    doc.text(line, rightX, y, { align: 'right' });
    y += 7;
  }
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

function renderBodySections(
  session: MmBrandedPdfSession,
  sections: SegurancaExportSection[],
  startY: number,
): { toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  let y = startY;
  for (const sec of sections) {
    if (sec.pageBreakBefore) {
      y = addBrandedPage(session.doc, session.branding);
    }
    const pageBefore = session.doc.getNumberOfPages();
    y = session.ensureSpace(y + 6, 36);
    y = renderSection(session, sec.title, sec.body, y);
    toc.push({ title: sec.title, page: pageBefore });
  }
  return { toc };
}

function writeTableOfContents(
  session: MmBrandedPdfSession,
  tocPage: number,
  entries: TocEntry[],
): void {
  const { doc, margins, contentWidth } = session;
  doc.setPage(tocPage);
  drawWatermarkOnPage(doc, session.branding);
  let y = getContentStartY(session.branding);
  y = writeBrandedPdfTitle(session, SEGURANCA_TOC_HEADING, 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const entry of entries) {
    y = session.ensureSpace(y, 6);
    const title = entry.title.length > 72 ? `${entry.title.slice(0, 69)}…` : entry.title;
    const dots = '.'.repeat(Math.max(2, 52 - title.length));
    const line = `${title} ${dots} ${entry.page}`;
    for (const w of doc.splitTextToSize(line, contentWidth)) {
      y = session.ensureSpace(y, 5);
      doc.text(w, margins.left, y);
      y += 5;
    }
  }
}

export async function generateSegurancaExportPdfBlob(
  estudo: EstudoSegurancaBarragem,
  brandingData: LocalBranding | null | undefined,
  pdfImages?: BrandingPdfImages | null,
): Promise<SegurancaPdfExportResult> {
  const session = await prepareIaMenuBrandedPdfSession({
    brandingData,
    pdfImages,
    hasBrandingUrls: hasCompleteBrandingUrls(brandingData),
  });
  if (!session) {
    throw new Error('Configure a identidade visual em Configurações para exportar PDF.');
  }

  const sections = buildSegurancaExportSections(estudo);
  renderCover(session, estudo);
  addBrandedPage(session.doc, session.branding);
  const tocPage = session.doc.getNumberOfPages();
  addBrandedPage(session.doc, session.branding);
  const { toc } = renderBodySections(session, sections, getContentStartY(session.branding));
  writeTableOfContents(session, tocPage, toc);
  session.finalize();
  return {
    blob: session.doc.output('blob'),
    fileName: `${buildSegurancaExportBaseName(estudo)}.pdf`,
  };
}
