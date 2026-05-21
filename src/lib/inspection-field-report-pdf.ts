/**
 * PDF de Relatório de Campo (vistoria fiscal):
 * corpo (identificação, checklist ou inconformidades legadas) + seção final.
 */

import type jsPDF from 'jspdf';
import type { Inspection } from '@/lib/types';
import { fetchBrandingImageAsBase64 } from '@/lib/branding-pdf';
import {
  CHECKLIST_STATUS_LABELS,
  FIELD_INSPECTION_CHECKLIST,
  mergeChecklistWithTemplate,
} from '@/lib/field-inspection-checklist';
import {
  appendChecklistSectionEvidences,
  appendLegacyInconformidadeEvidences,
} from '@/lib/inspection-pdf-evidences';
import {
  drawWatermarkOnPage,
  getContentBottomLimit,
  type MmBrandedPdfSession,
} from '@/lib/pdf-branding-layout';

const MARGIN_X = 15;
const SIGNATURE_W_MM = 70;
const SIGNATURE_H_MM = 32;
const TABLE_HEAD_GREEN: [number, number, number] = [34, 139, 34];

export type InspectionFieldReportPdfOptions = {
  projectName?: string;
  empreendedorName?: string;
};

function lineOrDash(value: string | undefined | null): string {
  const t = value?.trim();
  return t || '—';
}

function appendWrappedLines(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 5,
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

/**
 * Corpo do relatório: cabeçalho, identificação, checklist (seções 2–9) ou
 * tabela legada de inconformidades, observações da equipe e anexos opcionais.
 */
export async function appendInspectionReportBody(
  doc: jsPDF,
  report: Inspection,
  session: MmBrandedPdfSession,
  startY: number,
  options: InspectionFieldReportPdfOptions = {},
): Promise<number> {
  const { default: autoTable } = await import('jspdf-autotable');
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN_X * 2;
  const onPdfPage = () => drawWatermarkOnPage(doc, session.branding);
  let yPos = session.ensureSpace(startY, 20);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Campo', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  const id = report.identificacao;
  if (id) {
    yPos = session.ensureSpace(yPos, 14);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Identificação do empreendimento', MARGIN_X, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const idRows: [string, string][] = [
      ['Razão social', lineOrDash(id.razaoSocial)],
      ['Nome fantasia', lineOrDash(id.nomeFantasia)],
      ['CNPJ/CPF', lineOrDash(id.cnpjCpf)],
      ['Atividade principal', lineOrDash(id.atividadePrincipal)],
      ['Endereço', lineOrDash(id.enderecoCompleto)],
      ['Coordenadas', lineOrDash(id.coordenadasGeograficas)],
      [
        'Licenças / outorgas / usos',
        lineOrDash(id.processoLicenciamentoOutorga),
      ],
      [
        'Motivo da fiscalização',
        id.motivoFiscalizacao?.length
          ? id.motivoFiscalizacao.join(', ')
          : '—',
      ],
    ];

    for (const [label, value] of idRows) {
      yPos = session.ensureSpace(yPos, 10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, MARGIN_X, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      yPos = appendWrappedLines(doc, value, MARGIN_X, yPos, contentWidth);
      yPos += 3;
    }
    yPos += 4;
  } else if (options.projectName || options.empreendedorName) {
    yPos = session.ensureSpace(yPos, 14);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Identificação', MARGIN_X, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (options.projectName) {
      yPos = session.ensureSpace(yPos, 8);
      doc.setFont('helvetica', 'bold');
      doc.text('Empreendimento:', MARGIN_X, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      yPos = appendWrappedLines(
        doc,
        lineOrDash(options.projectName),
        MARGIN_X,
        yPos,
        contentWidth,
      );
      yPos += 3;
    }
    if (options.empreendedorName) {
      yPos = session.ensureSpace(yPos, 8);
      doc.setFont('helvetica', 'bold');
      doc.text('Empreendedor:', MARGIN_X, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      yPos = appendWrappedLines(
        doc,
        lineOrDash(options.empreendedorName),
        MARGIN_X,
        yPos,
        contentWidth,
      );
      yPos += 3;
    }
    yPos += 4;
  }

  const mergedChecklist = mergeChecklistWithTemplate(report.checklistResponses);
  const checklistRowsForPdf = mergedChecklist.filter(
    (r) => r.status !== 'nao_verificado',
  );
  const useChecklistPdf = checklistRowsForPdf.length > 0;

  if (useChecklistPdf) {
    for (const section of FIELD_INSPECTION_CHECKLIST) {
      const sectionRows = checklistRowsForPdf.filter(
        (r) => r.sectionId === section.id,
      );
      if (sectionRows.length === 0) continue;

      yPos = session.ensureSpace(yPos, 14);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, MARGIN_X, yPos);
      yPos += 6;

      const tableData = sectionRows.map((row) => [
        row.label,
        CHECKLIST_STATUS_LABELS[row.status],
        row.criticality || '—',
        row.observations?.trim() || '—',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Item', 'Status', 'Criticidade', 'Observações']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: TABLE_HEAD_GREEN },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 72 },
          1: { cellWidth: 28 },
          2: { cellWidth: 24 },
          3: { cellWidth: 'auto' },
        },
        willDrawPage: onPdfPage,
      });
      yPos = yAfterAutoTable(doc, yPos);
      yPos = await appendChecklistSectionEvidences(
        doc,
        session,
        section.title,
        sectionRows,
        yPos,
      );
    }
  } else if (report.inconformidades?.length) {
    yPos = session.ensureSpace(yPos, 14);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Inconformidades e Observações', MARGIN_X, yPos);
    yPos += 6;

    const tableData = report.inconformidades.map((item) => [
      item.description,
      item.criticality,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Criticidade']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: TABLE_HEAD_GREEN },
      willDrawPage: onPdfPage,
    });
    yPos = yAfterAutoTable(doc, yPos);
    yPos = await appendLegacyInconformidadeEvidences(
      doc,
      session,
      report.inconformidades,
      yPos,
    );
  }

  const teamObs = report.teamObservations?.trim();
  if (teamObs) {
    yPos = session.ensureSpace(yPos, 16);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações gerais da equipe', MARGIN_X, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPos = appendWrappedLines(doc, teamObs, MARGIN_X, yPos, contentWidth);
    yPos += 6;
  }

  const attachments = report.laudoAttachmentUrls?.filter((u) => u?.trim()) ?? [];
  if (attachments.length > 0) {
    yPos = session.ensureSpace(yPos, 14);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Registros e documentos adicionais', MARGIN_X, yPos);
    yPos += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    attachments.forEach((url, index) => {
      yPos = session.ensureSpace(yPos, 6);
      const label = `Anexo ${index + 1}: ${url}`;
      yPos = appendWrappedLines(doc, label, MARGIN_X, yPos, contentWidth, 4.5);
      yPos += 2;
    });
    yPos += 4;
  }

  return yPos;
}

/**
 * Corpo + participação/assinatura (fluxo completo após criar a sessão branded).
 */
export async function buildInspectionFieldReportPdf(
  doc: jsPDF,
  report: Inspection,
  session: MmBrandedPdfSession,
  startY: number,
  options: InspectionFieldReportPdfOptions = {},
): Promise<number> {
  let yPos = await appendInspectionReportBody(
    doc,
    report,
    session,
    startY,
    options,
  );
  yPos = await appendInspectionFinalSection(doc, report, session, yPos);
  return yPos;
}

/**
 * Acrescenta ao PDF a seção final (acompanhante + assinatura).
 * Garante nova página se não houver espaço acima do rodapé/branding.
 */
export async function appendInspectionFinalSection(
  doc: jsPDF,
  report: Inspection,
  session: MmBrandedPdfSession,
  startY: number,
): Promise<number> {
  const bottomLimit = getContentBottomLimit(doc, session.branding);
  let y = startY;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage();
      drawWatermarkOnPage(doc, session.branding);
      y = session.startY;
    }
  };

  ensureSpace(60);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Finalização e participação na vistoria', MARGIN_X, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Data da vistoria:', MARGIN_X, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const inspectionDateLabel = report.inspectionDate
    ? new Date(report.inspectionDate).toLocaleDateString('pt-BR')
    : '—';
  doc.text(inspectionDateLabel, MARGIN_X, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Fiscal / responsável técnico:', MARGIN_X, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(lineOrDash(report.inspectorName), MARGIN_X, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Acompanhado por:', MARGIN_X, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const accompanied = report.accompaniedBy?.trim();
  const nameLines = doc.splitTextToSize(
    accompanied || 'Não informado',
    doc.internal.pageSize.getWidth() - MARGIN_X * 2,
  );
  for (const line of nameLines) {
    ensureSpace(6);
    doc.text(line, MARGIN_X, y);
    y += 5;
  }
  y += 6;

  ensureSpace(SIGNATURE_H_MM + 14);
  doc.setFont('helvetica', 'bold');
  doc.text('Assinatura', MARGIN_X, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  const sigUrl = report.signatureUrl?.trim();
  if (sigUrl) {
    const base64 = await fetchBrandingImageAsBase64(sigUrl);
    if (base64) {
      ensureSpace(SIGNATURE_H_MM + 4);
      try {
        doc.addImage(base64, 'PNG', MARGIN_X, y, SIGNATURE_W_MM, SIGNATURE_H_MM);
        y += SIGNATURE_H_MM + 8;
      } catch (e) {
        console.warn('[inspection-pdf] assinatura não desenhada:', e);
        doc.text(
          'Assinatura registrada, porém não foi possível incluir a imagem no PDF.',
          MARGIN_X,
          y,
        );
        y += 8;
      }
    } else {
      doc.text(
        'Assinatura registrada, porém a imagem não pôde ser carregada para o PDF.',
        MARGIN_X,
        y,
      );
      y += 8;
    }
  } else {
    doc.text('Sem assinatura registrada.', MARGIN_X, y);
    y += 8;
  }

  return y;
}

/** Y após tabela autoTable (jspdf-autotable). */
export function yAfterAutoTable(doc: jsPDF, fallbackY: number): number {
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    ?.finalY;
  return (typeof finalY === 'number' ? finalY : fallbackY) + 10;
}
