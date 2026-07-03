import type { Procuracao } from '@/lib/types';
import type { LocalBranding } from '@/hooks/use-local-branding';
import type jsPDF from 'jspdf';
import type { BrandingPdfImages } from '@/lib/branding-pdf';
import { downloadJsPdf } from '@/lib/pdf-export-utils';
import {
  brandingUrlsFromLocal,
  drawWatermarkOnPage,
  finalizePdfBranding,
  getContentStartY,
  loadPdfBranding,
  reportBrandingPdfIssues,
  type BrandingPdfToastReporter,
} from '@/lib/pdf-branding-layout';
import {
  buildProcuracaoBodyText,
  formatProcuracaoSignatureBlock,
} from '@/lib/procuracao/format-procuracao';

const ML = 3;
const MR = 2;
const MT = 3;
const MB = 2;
const LH = 0.42;

function drawJustifiedLine(doc: jsPDF, line: string, x: number, y: number, maxWidth: number) {
  const words = line.split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= 1) {
    doc.text(line, x, y);
    return;
  }
  const totalTextWidth = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
  const totalSpace = maxWidth - totalTextWidth;
  const spacePerGap = totalSpace / (words.length - 1);
  let cx = x;
  for (let i = 0; i < words.length; i++) {
    doc.text(words[i], cx, y);
    cx += doc.getTextWidth(words[i]) + spacePerGap;
  }
}

function addText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  pageHeight: number,
  marginBottom: number,
  onNewPage?: () => void,
  contentStartY = MT,
): number {
  const paragraphs = text.split('\n');
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      if (y > pageHeight - marginBottom) {
        doc.addPage();
        y = contentStartY;
        onNewPage?.();
      }
      y += LH;
      continue;
    }
    const lines: string[] = doc.splitTextToSize(paragraph, maxWidth);
    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight - marginBottom) {
        doc.addPage();
        y = contentStartY;
        onNewPage?.();
      }
      const isLastLine = i === lines.length - 1;
      const trimmed = lines[i].trim();
      if (!isLastLine && trimmed.length > 0 && trimmed.includes(' ')) {
        drawJustifiedLine(doc, trimmed, x, y, maxWidth);
      } else {
        doc.text(trimmed, x, y);
      }
      y += LH;
    }
  }
  return y;
}

export type ProcuracaoPdfOptions = {
  branding?: LocalBranding | null;
  preloadedImages?: BrandingPdfImages | null;
  onBrandingIssue?: BrandingPdfToastReporter;
};

function safeFilename(nome: string | undefined): string {
  return `Procuracao_${(nome || 'Outorgante').replace(/\s+/g, '_').slice(0, 48)}.pdf`;
}

export async function buildProcuracaoPdfDoc(
  proc: Procuracao,
  brandingData?: LocalBranding | null,
  options?: Omit<ProcuracaoPdfOptions, 'branding'>,
): Promise<jsPDF> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'cm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - ML - MR;

  const urls = brandingUrlsFromLocal(brandingData);
  const pdfBranding = await loadPdfBranding(
    doc,
    urls,
    { left: ML, right: MR, top: MT, bottom: MB },
    0.15,
    options?.preloadedImages,
  );
  reportBrandingPdfIssues(urls, pdfBranding.images, options?.onBrandingIssue);
  const drawWatermarkOnCurrentPage = () => drawWatermarkOnPage(doc, pdfBranding);
  const pageContentStartY = getContentStartY(pdfBranding);
  drawWatermarkOnCurrentPage();

  let y = pageContentStartY;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PROCURAÇÃO', pageWidth / 2, y, { align: 'center' });
  y += 1;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const body = buildProcuracaoBodyText(proc);
  y = addText(
    doc,
    body,
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );

  y += 1.5;
  if (y > pageHeight - MB - 2) {
    doc.addPage();
    y = pageContentStartY;
    drawWatermarkOnCurrentPage();
  }

  const sigBlock = formatProcuracaoSignatureBlock(proc);
  const sigLines = sigBlock.split('\n');
  const sigX = pageWidth - MR - 6;
  for (const line of sigLines) {
    doc.text('_'.repeat(40), sigX, y, { align: 'right' });
    y += 0.6;
    doc.text(line, pageWidth - MR, y, { align: 'right' });
    y += LH;
  }

  finalizePdfBranding(doc, pdfBranding);
  return doc;
}

export async function procuracaoPdfBlob(
  proc: Procuracao,
  brandingData?: LocalBranding | null,
  options?: ProcuracaoPdfOptions,
): Promise<Blob> {
  const doc = await buildProcuracaoPdfDoc(proc, brandingData ?? options?.branding, options);
  return doc.output('blob');
}

export async function downloadProcuracaoPdf(
  proc: Procuracao,
  brandingData?: LocalBranding | null,
  options?: ProcuracaoPdfOptions,
): Promise<void> {
  const doc = await buildProcuracaoPdfDoc(proc, brandingData ?? options?.branding, options);
  downloadJsPdf(doc, safeFilename(proc.outorgante?.nome));
}
