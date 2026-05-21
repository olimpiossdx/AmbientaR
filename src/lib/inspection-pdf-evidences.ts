/**
 * Evidências fotográficas / PDF no laudo de vistoria (agrupadas por seção).
 */

import type jsPDF from 'jspdf';
import type { FieldInspectionChecklistRow } from '@/lib/field-inspection-checklist';
import {
  INSPECTION_EVIDENCE_H_MM,
  INSPECTION_EVIDENCE_W_MM,
  resolveInspectionEvidenceForPdf,
} from '@/lib/inspection-attachment-media';
import type { MmBrandedPdfSession } from '@/lib/pdf-branding-layout';

const MARGIN_X = 15;
const CAPTION_MM = 5;
const BLOCK_GAP_MM = 6;
const REF_BOX_H_MM = 28;

type EvidenceSource = {
  itemLabel: string;
  urls: string[];
};

function fitInPhotoBox(
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

async function drawPdfReferenceCard(
  doc: jsPDF,
  session: MmBrandedPdfSession,
  y: number,
  caption: string,
  url: string,
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxW = pageWidth - MARGIN_X * 2;
  let cy = session.ensureSpace(y, REF_BOX_H_MM + CAPTION_MM + 4);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  for (const line of doc.splitTextToSize(caption, maxW)) {
    cy = session.ensureSpace(cy, 5);
    doc.text(line, MARGIN_X, cy);
    cy += CAPTION_MM;
  }

  cy = session.ensureSpace(cy, REF_BOX_H_MM + 4);
  doc.setDrawColor(180, 180, 180);
  doc.setFillColor(245, 245, 245);
  doc.rect(MARGIN_X, cy, INSPECTION_EVIDENCE_W_MM, REF_BOX_H_MM, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Anexo PDF', MARGIN_X + 4, cy + 10);
  let ty = cy + 16;
  for (const line of doc.splitTextToSize(
    'Documento em PDF — consultar arquivo digital vinculado à vistoria.',
    INSPECTION_EVIDENCE_W_MM - 8,
  )) {
    doc.text(line, MARGIN_X + 4, ty);
    ty += 4;
  }
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  const shortUrl = url.length > 72 ? `${url.slice(0, 69)}…` : url;
  for (const line of doc.splitTextToSize(shortUrl, maxW - 8).slice(0, 2)) {
    doc.text(line, MARGIN_X + 4, ty);
    ty += 3;
  }
  doc.setTextColor(0, 0, 0);

  return cy + REF_BOX_H_MM + BLOCK_GAP_MM;
}

async function drawPhotoInBox(
  doc: jsPDF,
  session: MmBrandedPdfSession,
  y: number,
  caption: string,
  dataUrl: string,
  format: 'PNG' | 'JPEG',
  sourceUrl: string,
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxW = pageWidth - MARGIN_X * 2;
  let cy = session.ensureSpace(y, INSPECTION_EVIDENCE_H_MM + CAPTION_MM + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  for (const line of doc.splitTextToSize(caption, maxW)) {
    cy = session.ensureSpace(cy, 5);
    doc.text(line, MARGIN_X, cy);
    cy += CAPTION_MM;
  }

  const props = getImagePropertiesFromDataUrl(doc, dataUrl);
  const { w, h } = fitInPhotoBox(
    props.width,
    props.height,
    INSPECTION_EVIDENCE_W_MM,
    INSPECTION_EVIDENCE_H_MM,
  );
  const offsetX = MARGIN_X + (INSPECTION_EVIDENCE_W_MM - w) / 2;

  cy = session.ensureSpace(cy, INSPECTION_EVIDENCE_H_MM + 4);
  try {
    doc.addImage(dataUrl, format, offsetX, cy, w, h, undefined, 'FAST');
  } catch (e) {
    console.warn('[inspection-pdf] evidência não desenhada:', e);
    return drawPdfReferenceCard(doc, session, cy, caption, sourceUrl);
  }

  return cy + INSPECTION_EVIDENCE_H_MM + BLOCK_GAP_MM;
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
      const resolved = await resolveInspectionEvidenceForPdf(url);
      if (resolved && resolved !== 'pdf_reference') {
        yPos = await drawPhotoInBox(
          doc,
          session,
          yPos,
          caption,
          resolved.dataUrl,
          resolved.format,
          url,
        );
      } else {
        yPos = await drawPdfReferenceCard(doc, session, yPos, caption, url);
      }
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
