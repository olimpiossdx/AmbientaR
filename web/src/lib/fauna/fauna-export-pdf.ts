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
  getContentStartY,
  type MmBrandedPdfSession,
} from '@/lib/pdf-branding-layout';
import type { FaunaStudy } from '@/lib/types';
import { buildFaunaExportBaseName } from '@/lib/fauna/fauna-export-filename';
import { buildFaunaExportSections } from '@/lib/fauna/fauna-export-sections';
import {
  buildFaunaCoverMetaLines,
  FAUNA_REPORT_TITLE,
} from '@/lib/fauna/fauna-export-layout';

export type FaunaPdfExportResult = {
  blob: Blob;
  fileName: string;
};

function renderCover(session: MmBrandedPdfSession, study: FaunaStudy): void {
  const { doc, margins, contentWidth } = session;
  let y = getContentStartY(session.branding);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  for (const line of doc.splitTextToSize(FAUNA_REPORT_TITLE, contentWidth)) {
    doc.text(line, margins.left, y);
    y += 8;
  }

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  for (const line of buildFaunaCoverMetaLines(study)) {
    doc.text(line, margins.left, y);
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

export async function generateFaunaExportPdfBlob(
  study: FaunaStudy,
  brandingData: LocalBranding | null | undefined,
  pdfImages?: BrandingPdfImages | null,
): Promise<FaunaPdfExportResult> {
  const session = await prepareIaMenuBrandedPdfSession({
    brandingData,
    pdfImages,
    hasBrandingUrls: hasCompleteBrandingUrls(brandingData),
  });
  if (!session) {
    throw new Error('Configure a identidade visual em Configurações para exportar PDF.');
  }

  const sections = buildFaunaExportSections(study);
  renderCover(session, study);

  let y = getContentStartY(session.branding) + 50;
  for (const sec of sections) {
    if (sec.pageBreakBefore) {
      y = session.ensureSpace(y + 8, 40);
    }
    y = session.ensureSpace(y + 6, 36);
    y = renderSection(session, sec.title, sec.body, y);
  }

  session.finalize();
  const blob = session.doc.output('blob');
  return {
    blob,
    fileName: `${buildFaunaExportBaseName(study)}.pdf`,
  };
}
