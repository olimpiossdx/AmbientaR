'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import type { LocalBranding } from '@/hooks/use-local-branding';
import {
  prepareIaMenuBrandedPdfSession,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from '@/lib/ia-menu-branded-pdf';
import { hasCompleteBrandingUrls } from '@/lib/branding/requirements';

export type DefesaExportRecord = {
  id: string;
  processNumber: string;
};

export type DefesaPdfExportResult = {
  blob: Blob;
  fileName: string;
};

export function buildDefesaExportFileName(defesa: DefesaExportRecord): string {
  const safe = defesa.processNumber.replace(/\//g, '-').replace(/\s+/g, '_');
  return `defesa_${safe}.pdf`;
}

export async function generateDefesaExportPdfBlob(
  content: string,
  defesa: DefesaExportRecord,
  brandingData: LocalBranding | null | undefined,
  pdfImages?: BrandingPdfImages | null,
): Promise<DefesaPdfExportResult> {
  const session = await prepareIaMenuBrandedPdfSession({
    brandingData,
    pdfImages,
    hasBrandingUrls: hasCompleteBrandingUrls(brandingData),
  });
  if (!session) {
    throw new Error('Identidade visual indisponível para exportar PDF.');
  }

  let y = writeBrandedPdfTitle(
    session,
    `Defesa administrativa — ${defesa.processNumber}`,
    14,
    session.startY,
  );
  y += 4;

  const blocks = content.split(/\n\n+/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (
      trimmed.length < 80 &&
      /^[A-Z0-9\s\-–—().]+$/.test(trimmed) &&
      trimmed === trimmed.toUpperCase()
    ) {
      y = writeBrandedPdfTitle(session, trimmed, 12, y);
    } else {
      for (const line of trimmed.split('\n')) {
        if (line.trim()) {
          y = writeBrandedPdfParagraph(session, line, 10, y);
        }
      }
    }
    y += 2;
  }

  session.finalize();
  const blob = session.doc.output('blob');
  return { blob, fileName: buildDefesaExportFileName(defesa) };
}
