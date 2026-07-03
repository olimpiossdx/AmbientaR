'use client';

import type { BrandingPdfImages } from '@/lib/branding-pdf';
import type { LocalBranding } from '@/hooks/use-local-branding';
import { hasCompleteBrandingUrls } from '@/lib/branding/requirements';
import {
  prepareIaMenuBrandedPdfSession,
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from '@/lib/ia-menu-branded-pdf';
import type { MmBrandedPdfSession } from '@/lib/pdf-branding-layout';
import type { DocxTemplateSlug } from '@/lib/docx-template-slugs';
import {
  getStudyExportBaseName,
  STUDY_DOCUMENT_TYPE_LABEL,
  type StudyExportRecord,
} from '@/lib/studies/study-export-record';

export type StudyPdfExportResult = {
  blob: Blob;
  fileName: string;
};

function fmt(v: string | undefined | null): string {
  return v != null && String(v).trim() !== '' ? String(v).trim() : '—';
}

function renderSection(
  session: MmBrandedPdfSession,
  title: string,
  lines: string[],
  startY: number,
): number {
  let y = writeBrandedPdfTitle(session, title, 12, startY);
  for (const line of lines) {
    if (!line.trim()) continue;
    y = writeBrandedPdfParagraph(session, line, 10, y);
  }
  return y + 4;
}

export async function generateStudyExportPdfBlob(
  record: StudyExportRecord,
  templateSlug: DocxTemplateSlug,
  brandingData: LocalBranding | null | undefined,
  pdfImages?: BrandingPdfImages | null,
): Promise<StudyPdfExportResult> {
  const session = await prepareIaMenuBrandedPdfSession({
    brandingData,
    pdfImages,
    hasBrandingUrls: hasCompleteBrandingUrls(brandingData),
  });
  if (!session) {
    throw new Error('Configure cabeçalho, rodapé e marca d\'água em Configurações → Identidade visual.');
  }

  const { doc } = session;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = pageHeight * 0.28;

  const typeLabel = STUDY_DOCUMENT_TYPE_LABEL[templateSlug] ?? templateSlug.toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(typeLabel, session.contentWidth);
  for (const line of titleLines) {
    doc.text(line, session.margins.left, y);
    y += 8;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  y += 6;
  for (const line of [
    fmt(record.empreendimento?.nome as string | undefined),
    fmt(record.empreendedor?.nome),
    `Status: ${fmt(record.status ?? 'Rascunho')}`,
    new Date().toLocaleDateString('pt-BR'),
  ]) {
    doc.text(line, session.margins.left, y);
    y += 7;
  }

  y = session.ensureSpace(y + 8, 40);
  y = renderSection(session, 'Identificação', [
    `Empreendedor: ${fmt(record.empreendedor?.nome)}`,
    `CPF/CNPJ: ${fmt(record.empreendedor?.cpfCnpj)}`,
    `Empreendimento: ${fmt(record.empreendimento?.nome as string | undefined)}`,
    `Município: ${fmt(record.empreendimento?.municipio as string | undefined)}`,
    `UF: ${fmt(record.empreendimento?.uf as string | undefined)}`,
  ], y);

  if (record.activity || record.subActivity) {
    y = session.ensureSpace(y, 30);
    y = renderSection(session, 'Atividade / listagem', [
      record.activity ? `Listagem: ${fmt(record.activity)}` : '',
      record.subActivity ? `Subatividade: ${fmt(record.subActivity)}` : '',
    ].filter(Boolean), y);
  }

  if (record.termoReferencia) {
    y = session.ensureSpace(y, 30);
    y = renderSection(session, 'Termo de referência', [
      `Título: ${fmt(record.termoReferencia.titulo)}`,
      `Processo: ${fmt(record.termoReferencia.processo)}`,
      record.termoReferencia.versao
        ? `Versão: ${fmt(record.termoReferencia.versao)}`
        : '',
    ].filter(Boolean), y);
  }

  const blob = doc.output('blob');
  const base = getStudyExportBaseName(record, templateSlug);
  return { blob, fileName: `${base}.pdf` };
}
