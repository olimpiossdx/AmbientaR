/**
 * PDFs do menu IA — mesma identidade visual do Financeiro
 * (cabeçalho, marca d'água, rodapé via pdf-branding-layout).
 */

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import type { LocalBranding } from '@/hooks/use-local-branding';
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  drawWatermarkOnPage,
  guardBrandingExportFromHook,
  reportBrandingPdfIssues,
  type BrandingPdfToastReporter,
  type MmBrandedPdfSession,
} from '@/lib/pdf-branding-layout';

export type IaMenuBrandingContext = {
  brandingData: LocalBranding | null | undefined;
  pdfImages?: BrandingPdfImages | null;
  isPdfImagesLoading?: boolean;
  hasBrandingUrls?: boolean;
  toast?: BrandingPdfToastReporter;
};

export async function prepareIaMenuBrandedPdfSession(
  ctx: IaMenuBrandingContext,
): Promise<MmBrandedPdfSession | null> {
  if (
    !guardBrandingExportFromHook({
      brandingData: ctx.brandingData,
      pdfImages: ctx.pdfImages,
      isPdfImagesLoading: !!ctx.isPdfImagesLoading,
      hasBrandingUrls: !!ctx.hasBrandingUrls,
      toast: ctx.toast,
    })
  ) {
    return null;
  }
  const urls = brandingUrlsFromLocal(ctx.brandingData);
  const session = await createMmBrandedPdfSession(urls, undefined, ctx.pdfImages);
  reportBrandingPdfIssues(urls, session.branding.images, ctx.toast);
  return session;
}

export function writeBrandedPdfTitle(
  session: MmBrandedPdfSession,
  text: string,
  fontSize = 14,
  startY?: number,
): number {
  const { doc, margins, contentWidth } = session;
  let y = session.ensureSpace(startY ?? session.startY, fontSize + 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, contentWidth);
  for (const line of lines) {
    y = session.ensureSpace(y, 7);
    doc.text(line, margins.left, y);
    y += 7;
  }
  return y + 2;
}

export function writeBrandedPdfParagraph(
  session: MmBrandedPdfSession,
  text: string,
  fontSize = 10,
  startY?: number,
): number {
  const { doc, margins, contentWidth } = session;
  let y = startY ?? session.startY;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, contentWidth);
  for (const line of lines) {
    y = session.ensureSpace(y, 5);
    doc.text(line, margins.left, y);
    y += 5;
  }
  return y + 2;
}

export function writeBrandedPdfSection(
  session: MmBrandedPdfSession,
  title: string,
  body: string,
  startY: number,
): number {
  let y = writeBrandedPdfTitle(session, title, 12, startY);
  return writeBrandedPdfParagraph(session, body, 10, y);
}

/** Nova página com marca d'água (quando precisar de controlo manual). */
export function brandedPdfNewPage(session: MmBrandedPdfSession): number {
  const { doc } = session;
  doc.addPage();
  drawWatermarkOnPage(doc, session.branding);
  return session.startY;
}

export function saveIaMenuBrandedPdf(
  session: MmBrandedPdfSession,
  fileName: string,
): void {
  session.finalize();
  session.doc.save(fileName);
}
