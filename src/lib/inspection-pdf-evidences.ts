/**
 * Evidências no laudo: fotos em 10×15 cm; PDF rasterizado em largura útil A4.
 */

import type jsPDF from 'jspdf';
import type { FieldInspectionChecklistRow } from '@/lib/field-inspection-checklist';
import {
  INSPECTION_EVIDENCE_H_MM,
  INSPECTION_EVIDENCE_W_MM,
  resolveInspectionAttachmentForReport,
  type InspectionPdfPageImage,
} from '@/lib/inspection-attachment-media';
import type { MmBrandedPdfSession } from '@/lib/pdf-branding-layout';
import {
  drawWatermarkOnPage,
  getContentBottomLimit,
} from '@/lib/pdf-branding-layout';

const MARGIN_X = 15;
const CAPTION_MM = 5;
const BLOCK_GAP_MM = 6;
const REF_BOX_H_MM = 32;
/** Espaço mínimo livre para abrir nova página antes de encolher o PDF. */
const PDF_PAGE_MIN_AVAILABLE_H_MM = 100;

type EvidenceSource = {
  itemLabel: string;
  urls: string[];
};

function reportContentWidthMm(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth() - MARGIN_X * 2;
}

function getImagePropertiesFromDataUrl(
  doc: jsPDF,
  dataUrl: string,
): { width: number; height: number } {
  try {
    return doc.getImageProperties(dataUrl);
  } catch {
    return { width: 4, height: 3 };
  }
}

/** Encaixa imagem dentro de uma caixa fixa (proporção preservada). */
function fitInsideBox(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
): { w: number; h: number } {
  if (!imgW || !imgH) return { w: boxW, h: boxH };
  const ratio = imgW / imgH;
  let w = boxW;
  let h = w / ratio;
  if (h > boxH) {
    h = boxH;
    w = h * ratio;
  }
  return { w, h };
}

function drawCaption(
  doc: jsPDF,
  session: MmBrandedPdfSession,
  y: number,
  text: string,
): number {
  const maxW = reportContentWidthMm(doc);
  let cy = session.ensureSpace(y, CAPTION_MM + 4);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  for (const line of doc.splitTextToSize(text, maxW)) {
    cy = session.ensureSpace(cy, 5);
    doc.text(line, MARGIN_X, cy);
    cy += CAPTION_MM;
  }
  return cy;
}

async function drawPdfReferenceCard(
  doc: jsPDF,
  session: MmBrandedPdfSession,
  y: number,
  caption: string,
  url: string,
): Promise<number> {
  const contentW = reportContentWidthMm(doc);
  let cy = drawCaption(doc, session, y, caption);

  cy = session.ensureSpace(cy, REF_BOX_H_MM + 4);
  doc.setDrawColor(180, 180, 180);
  doc.setFillColor(248, 248, 248);
  doc.rect(MARGIN_X, cy, contentW, REF_BOX_H_MM, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Não foi possível exibir o documento neste PDF.', MARGIN_X + 4, cy + 10);
  let ty = cy + 16;
  for (const line of doc.splitTextToSize(
    'Consulte o arquivo digital vinculado à vistoria no sistema.',
    contentW - 8,
  )) {
    doc.text(line, MARGIN_X + 4, ty);
    ty += 4;
  }
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  const shortUrl = url.length > 90 ? `${url.slice(0, 87)}…` : url;
  for (const line of doc.splitTextToSize(shortUrl, contentW - 8).slice(0, 2)) {
    doc.text(line, MARGIN_X + 4, ty);
    ty += 3;
  }
  doc.setTextColor(0, 0, 0);

  return cy + REF_BOX_H_MM + BLOCK_GAP_MM;
}

/** Foto no tamanho de revelação 10×15 cm (70×105 mm). */
async function drawPhotoRevelationSize(
  doc: jsPDF,
  session: MmBrandedPdfSession,
  y: number,
  caption: string,
  dataUrl: string,
  format: 'PNG' | 'JPEG',
  sourceUrl: string,
): Promise<number> {
  const props = getImagePropertiesFromDataUrl(doc, dataUrl);
  const { w, h } = fitInsideBox(
    props.width,
    props.height,
    INSPECTION_EVIDENCE_W_MM,
    INSPECTION_EVIDENCE_H_MM,
  );
  const offsetX = MARGIN_X + (INSPECTION_EVIDENCE_W_MM - w) / 2;

  let cy = drawCaption(doc, session, y, caption);
  cy = session.ensureSpace(cy, INSPECTION_EVIDENCE_H_MM + 6);

  try {
    doc.addImage(dataUrl, format, offsetX, cy, w, h, undefined, 'FAST');
  } catch (e) {
    console.warn('[inspection-pdf] foto não desenhada:', e);
    return drawPdfReferenceCard(doc, session, cy, caption, sourceUrl);
  }

  return cy + INSPECTION_EVIDENCE_H_MM + BLOCK_GAP_MM;
}

/**
 * Página de PDF rasterizada em tamanho próximo de uma folha A4 no laudo:
 * largura útil da página, altura proporcional (nova página se necessário).
 */
async function drawPdfPageInReport(
  doc: jsPDF,
  session: MmBrandedPdfSession,
  y: number,
  caption: string,
  dataUrl: string,
  sourceUrl: string,
): Promise<number> {
  const contentW = reportContentWidthMm(doc);
  const bottom = getContentBottomLimit(doc, session.branding);

  let cy = drawCaption(doc, session, y, caption);
  let availableH = bottom - cy - 10;

  const props = getImagePropertiesFromDataUrl(doc, dataUrl);
  /** Prioriza largura total (documento A4 legível, ~4× a miniatura anterior). */
  let w = contentW;
  let h = props.width > 0 ? (props.height / props.width) * w : contentW * 1.414;

  if (h > availableH && availableH < PDF_PAGE_MIN_AVAILABLE_H_MM) {
    doc.addPage();
    drawWatermarkOnPage(doc, session.branding);
    cy = session.startY;
    cy = drawCaption(doc, session, cy, caption);
    availableH = bottom - cy - 10;
    w = contentW;
    h = props.width > 0 ? (props.height / props.width) * w : contentW * 1.414;
  }

  if (h > availableH) {
    const scale = availableH / h;
    h = availableH;
    w = w * scale;
  }

  cy = session.ensureSpace(cy, h + 8);

  try {
    doc.addImage(dataUrl, 'JPEG', MARGIN_X, cy, w, h, undefined, 'MEDIUM');
  } catch (e) {
    console.warn('[inspection-pdf] página PDF não desenhada:', e);
    return drawPdfReferenceCard(doc, session, cy, caption, sourceUrl);
  }

  return cy + h + BLOCK_GAP_MM;
}

function buildPageCaption(base: string, page: InspectionPdfPageImage): string {
  const suffix =
    page.totalPages > 1
      ? ` (pág. ${page.pageNumber} de ${page.totalPages})`
      : '';
  let caption = `${base}${suffix}`;
  if (page.truncated) {
    caption += ' — demais páginas no arquivo digital';
  }
  return caption;
}

async function drawResolvedAttachment(
  doc: jsPDF,
  session: MmBrandedPdfSession,
  y: number,
  caption: string,
  url: string,
): Promise<number> {
  const resolved = await resolveInspectionAttachmentForReport(url);
  if (resolved.kind === 'pages') {
    let cy = y;
    for (const page of resolved.pages) {
      const cap = buildPageCaption(caption, page);
      cy = await drawPdfPageInReport(
        doc,
        session,
        cy,
        cap,
        page.dataUrl,
        url,
      );
    }
    return cy;
  }
  if (resolved.kind === 'image') {
    return drawPhotoRevelationSize(
      doc,
      session,
      y,
      caption,
      resolved.dataUrl,
      resolved.format,
      url,
    );
  }
  return drawPdfReferenceCard(doc, session, y, caption, url);
}

/**
 * Imprime evidências ao final de uma seção do checklist (itens NC com anexos).
 */
export async function appendChecklistSectionEvidences(
  doc: jsPDF,
  session: MmBrandedPdfSession,
  sectionTitle: string,
  rows: FieldInspectionChecklistRow[],
  startY: number,
): Promise<number> {
  const sources: EvidenceSource[] = rows
    .filter((r) => r.status === 'nao_conforme' && (r.imageUrls?.length ?? 0) > 0)
    .map((r) => ({
      itemLabel: r.label,
      urls: r.imageUrls ?? [],
    }));

  if (sources.length === 0) return startY;

  let yPos = session.ensureSpace(startY, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Evidências anexadas — ${sectionTitle}`, MARGIN_X, yPos);
  yPos += 8;

  for (const source of sources) {
    let attachmentIndex = 0;
    for (const url of source.urls) {
      attachmentIndex += 1;
      const caption = `${source.itemLabel} — Anexo ${attachmentIndex}`;
      yPos = await drawResolvedAttachment(doc, session, yPos, caption, url);
    }
  }

  return yPos + 4;
}

/** Evidências das inconformidades legadas (sem checklist). */
export async function appendLegacyInconformidadeEvidences(
  doc: jsPDF,
  session: MmBrandedPdfSession,
  inconformidades: { description: string; imageUrls?: string[] }[],
  startY: number,
): Promise<number> {
  const rows: FieldInspectionChecklistRow[] = inconformidades
    .filter((i) => (i.imageUrls?.length ?? 0) > 0)
    .map((i, idx) => ({
      sectionId: 'legacy',
      itemId: `inc-${idx}`,
      label: i.description.slice(0, 120) || `Inconformidade ${idx + 1}`,
      status: 'nao_conforme' as const,
      imageUrls: i.imageUrls ?? [],
    }));

  if (rows.length === 0) return startY;

  return appendChecklistSectionEvidences(
    doc,
    session,
    'Inconformidades registradas',
    rows,
    startY,
  );
}

/** Registros e documentos adicionais (`laudoAttachmentUrls`). */
export async function appendLaudoAttachmentEvidences(
  doc: jsPDF,
  session: MmBrandedPdfSession,
  urls: string[],
  startY: number,
): Promise<number> {
  const list = urls.filter((u) => u?.trim());
  if (list.length === 0) return startY;

  let yPos = session.ensureSpace(startY, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Registros e documentos adicionais', MARGIN_X, yPos);
  yPos += 8;

  for (let i = 0; i < list.length; i += 1) {
    const caption = `Documento adicional ${i + 1}`;
    yPos = await drawResolvedAttachment(doc, session, yPos, caption, list[i]);
  }

  return yPos + 4;
}
