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
  getContentStartY,
  type MmBrandedPdfSession,
} from '@/lib/pdf-branding-layout';
import { slugifyFileName } from './format-br';
import type { MemorialMetadata } from './types';

export type MemorialPdfExportResult = {
  blob: Blob;
  fileName: string;
};

function renderMemorialBody(
  session: MmBrandedPdfSession,
  memorialText: string,
  startY: number,
): number {
  let y = startY;
  const lines = memorialText.split(/\n+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y += 4;
      continue;
    }
    if (trimmed === 'MEMORIAL DESCRITIVO') {
      y = writeBrandedPdfTitle(session, trimmed, 16, y);
      continue;
    }
    if (trimmed.startsWith('___')) {
      y = session.ensureSpace(y + 8, 12);
      y += 12;
      continue;
    }
    y = writeBrandedPdfParagraph(session, trimmed, 10, y);
  }
  return y;
}

export async function generateMemorialExportPdfBlob(
  memorialText: string,
  metadata: MemorialMetadata,
  brandingData: LocalBranding | null | undefined,
  pdfImages?: BrandingPdfImages | null,
): Promise<MemorialPdfExportResult> {
  const session = await prepareIaMenuBrandedPdfSession({
    brandingData,
    pdfImages,
    hasBrandingUrls: hasCompleteBrandingUrls(brandingData),
  });
  if (!session) {
    throw new Error('Configure a identidade visual em Configurações para exportar PDF.');
  }

  addBrandedPage(session.doc, session.branding);
  const startY = getContentStartY(session.branding);
  renderMemorialBody(session, memorialText, startY);

  session.finalize();
  const blob = session.doc.output('blob');
  const date = new Date().toISOString().slice(0, 10);
  const slug = slugifyFileName(metadata.imovel || 'imovel');
  return {
    blob,
    fileName: `memorial-descritivo-${slug}-${date}.pdf`,
  };
}
