'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import type { LocalBranding } from '@/hooks/use-local-branding';
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
import type { ProjetoTecnicoBarragem } from '@/lib/types';
import { buildBarragemExportBaseName } from '@/lib/barragem/barragem-export-filename';
import {
  buildBarragemExportSections,
  type BarragemExportSection,
} from '@/lib/barragem/barragem-export-sections';
import {
  BARRAGEM_COVER_TITLE_TOP_MM,
  BARRAGEM_REPORT_TITLE,
  BARRAGEM_TOC_HEADING,
  buildBarragemCoverMetaLines,
} from '@/lib/barragem/barragem-export-layout';

export type BarragemPdfExportResult = {
  blob: Blob;
  fileName: string;
};

type TocEntry = { title: string; page: number };

function renderCover(session: MmBrandedPdfSession, projeto: ProjetoTecnicoBarragem): void {
  const { doc, margins, contentWidth } = session;
  const rightX = margins.left + contentWidth;

  let y = BARRAGEM_COVER_TITLE_TOP_MM;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  for (const line of doc.splitTextToSize(BARRAGEM_REPORT_TITLE, contentWidth)) {
    doc.text(line, margins.left, y);
    y += 8;
  }

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  for (const line of buildBarragemCoverMetaLines(projeto)) {
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
  sections: BarragemExportSection[],
  startY: number,
): { endY: number; toc: TocEntry[] } {
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

  return { endY: y, toc };
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
  y = writeBrandedPdfTitle(session, BARRAGEM_TOC_HEADING, 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  for (const entry of entries) {
    y = session.ensureSpace(y, 6);
    const title =
      entry.title.length > 72 ? `${entry.title.slice(0, 69)}…` : entry.title;
    const dots = '.'.repeat(Math.max(2, 52 - title.length));
    const line = `${title} ${dots} ${entry.page}`;
    for (const w of doc.splitTextToSize(line, contentWidth)) {
      y = session.ensureSpace(y, 5);
      doc.text(w, margins.left, y);
      y += 5;
    }
  }
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

  const sections = buildBarragemExportSections(projeto);

  renderCover(session, projeto);

  addBrandedPage(session.doc, session.branding);
  const tocPage = session.doc.getNumberOfPages();

  addBrandedPage(session.doc, session.branding);
  const bodyStartY = getContentStartY(session.branding);
  const { toc } = renderBodySections(session, sections, bodyStartY);

  writeTableOfContents(session, tocPage, toc);

  session.finalize();
  const blob = session.doc.output('blob');
  return {
    blob,
    fileName: `${buildBarragemExportBaseName(projeto)}.pdf`,
  };
}
