'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import type { LocalBranding } from '@/hooks/use-local-branding';
import {
  drawWatermarkOnPage,
  getContentStartY,
  type MmBrandedPdfSession,
} from '@/lib/pdf-branding-layout';
import {
  prepareIaMenuBrandedPdfSession,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from '@/lib/ia-menu-branded-pdf';
import { buildPiaExportBundle } from '@/lib/pia/pia-export-context';
import type { PiaExportSection } from '@/lib/pia/pia-export-manifest';
import { buildPiaExportBaseName } from '@/lib/pia/pia-export-filename';
import type { PiaInventorySnapshot } from '@/lib/pia/pia-inventory-snapshot';
import type { PiaRecord } from '@/lib/pia/pia-record';

export type PiaPdfExportResult = {
  blob: Blob;
  fileName: string;
  sectionManifest: string[];
};

type TocEntry = { title: string; page: number; level: 1 | 2 };

function renderCover(session: MmBrandedPdfSession, record: PiaRecord): number {
  const { doc, margins, contentWidth } = session;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = pageHeight * 0.32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize('PROJETO DE INTERVENÇÃO AMBIENTAL', contentWidth);
  for (const line of titleLines) {
    doc.text(line, pageWidthCenter(doc), y, { align: 'center' });
    y += 10;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  y += 8;
  const lines = [
    record.requerente?.nome || '—',
    record.empreendimento?.nome || '—',
    new Date().toLocaleDateString('pt-BR'),
    `Modalidade: ${record.type}`,
  ];
  for (const line of lines) {
    doc.text(line, pageWidthCenter(doc), y, { align: 'center' });
    y += 7;
  }

  return y;
}

function pageWidthCenter(doc: import('jspdf').jsPDF): number {
  return doc.internal.pageSize.getWidth() / 2;
}

async function renderFloraSpeciesTable(
  session: MmBrandedPdfSession,
  inventory: PiaInventorySnapshot,
  startY: number,
): Promise<number> {
  if (inventory.species.length === 0) return startY;
  const { default: autoTable } = await import('jspdf-autotable');
  let y = session.ensureSpace(startY, 20);
  y = writeBrandedPdfTitle(session, '5.2.2 Composição florística (inventário)', 11, y);

  autoTable(session.doc, {
    startY: y,
    margin: { left: session.margins.left, right: session.margins.right },
    head: [['Nome científico', 'Nome comum', 'Família', 'N']],
    body: inventory.species.map((s) => [
      s.nomeCientifico,
      s.nomeComum,
      s.familia,
      String(s.nIndividuos),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [46, 125, 50], textColor: 255 },
  });

  const doc = session.doc as import('jspdf').jsPDF & {
    lastAutoTable?: { finalY: number };
  };
  return (doc.lastAutoTable?.finalY ?? y) + 8;
}

async function renderBodySections(
  session: MmBrandedPdfSession,
  sections: PiaExportSection[],
  startY: number,
  inventory: PiaInventorySnapshot | null,
): Promise<{ endY: number; toc: TocEntry[] }> {
  const toc: TocEntry[] = [];
  let y = startY;

  for (const section of sections) {
    const pageBefore = session.doc.getNumberOfPages();
    y = writeBrandedPdfTitle(session, section.title, 12, y);
    toc.push({ title: section.title, page: pageBefore, level: section.level });
    y = writeBrandedPdfParagraph(session, section.body, 10, y);
    if (section.id === '5' && inventory && inventory.species.length > 0) {
      y = await renderFloraSpeciesTable(session, inventory, y);
    }
    y += 4;
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
  y = writeBrandedPdfTitle(session, 'Sumário', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  for (const entry of entries) {
    y = session.ensureSpace(y, 6);
    const indent = entry.level === 2 ? 4 : 0;
    const title = entry.title.length > 72 ? `${entry.title.slice(0, 69)}…` : entry.title;
    const dots = '.'.repeat(Math.max(2, 60 - title.length));
    const line = `${' '.repeat(indent)}${title} ${dots} ${entry.page}`;
    const wrapped = doc.splitTextToSize(line, contentWidth - indent);
    for (const w of wrapped) {
      y = session.ensureSpace(y, 5);
      doc.text(w, margins.left + indent, y);
      y += 5;
    }
  }
}

export async function generatePiaExportPdfBlob(
  record: PiaRecord,
  branding?: LocalBranding | null,
  preloadedImages?: BrandingPdfImages | null,
  inventory?: PiaInventorySnapshot | null,
): Promise<PiaPdfExportResult> {
  const session = await prepareIaMenuBrandedPdfSession({
    brandingData: branding,
    pdfImages: preloadedImages,
    hasBrandingUrls: !!(
      branding?.headerImageUrl ||
      branding?.footerImageUrl ||
      branding?.watermarkImageUrl
    ),
  });

  if (!session) {
    throw new Error(
      'Não foi possível preparar o PDF com identidade visual. Aguarde o carregamento ou verifique Configurações → Identidade visual.',
    );
  }

  return generateWithSession(record, session, inventory ?? null);
}

async function generateWithSession(
  record: PiaRecord,
  session: MmBrandedPdfSession,
  inventory: PiaInventorySnapshot | null,
): Promise<PiaPdfExportResult> {
  const { sections, sectionManifest: manifest } = buildPiaExportBundle({
    record,
    inventory,
  });

  renderCover(session, record);

  session.doc.addPage();
  drawWatermarkOnPage(session.doc, session.branding);
  const tocPage = session.doc.getNumberOfPages();

  session.doc.addPage();
  drawWatermarkOnPage(session.doc, session.branding);
  const bodyStartY = getContentStartY(session.branding);
  const { toc } = await renderBodySections(session, sections, bodyStartY, inventory);

  writeTableOfContents(session, tocPage, toc);

  session.finalize();
  const blob = session.doc.output('blob');
  const fileName = `${buildPiaExportBaseName(record)}.pdf`;

  return { blob, fileName, sectionManifest: manifest };
}

/** Download imediato no browser (sem persistir). */
export async function downloadPiaExportPdf(
  record: PiaRecord,
  branding?: LocalBranding | null,
  preloadedImages?: BrandingPdfImages | null,
  inventory?: PiaInventorySnapshot | null,
): Promise<PiaPdfExportResult> {
  const result = await generatePiaExportPdfBlob(
    record,
    branding,
    preloadedImages,
    inventory,
  );
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return result;
}
