import * as XLSX from '@e965/xlsx';
import { EXPENSE_CATEGORIES, formatCurrencyBRL } from '@/lib/financial-core';
import type { BrandingPdfImages } from '@/lib/branding-pdf';
import type { LocalBranding } from '@/hooks/use-local-branding';
import { buildBrandedDocxSectionSetup, DOCX_BRANDING_FONT } from '@/lib/branding-docx';
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  type MmBrandedPdfSession,
} from '@/lib/pdf-branding-layout';
import {
  writeBrandedPdfParagraph,
  writeBrandedPdfTitle,
} from '@/lib/ia-menu-branded-pdf';
import {
  extratoLineTipoLabel,
  type ProjectRoiExtratoLine,
  type ProjectRoiSnapshot,
} from '@/lib/project-roi-aggregator';
import type { ProjectRoiCase, ProjectRoiSemaforo } from '@/lib/types';
import type { SupplierPaymentSummary } from '@/lib/project-roi-supplier-summary';

const SEMAFORO_LABEL: Record<ProjectRoiSemaforo, string> = {
  ganhando: 'Ganhando',
  perdendo: 'Perdendo',
  empatando: 'Empatando',
  sem_movimento: 'Sem movimento',
};

export type ProjectRoiExportInput = {
  roiCase: ProjectRoiCase;
  snap: ProjectRoiSnapshot;
  title: string;
  supplierSummary: SupplierPaymentSummary;
};

export function expenseCategoryLabel(category?: string): string {
  if (!category) return '—';
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found?.label ?? category;
}

function buildExportBaseName(title: string, roiCase: ProjectRoiCase): string {
  const slug = (title || roiCase.id).replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '');
  const date = new Date().toISOString().slice(0, 10);
  return `Projeto_ROI_${slug}_${date}`;
}

function dreRows(snap: ProjectRoiSnapshot): [string, string][] {
  return [
    ['Orçamento / receita contratada', formatCurrencyBRL(snap.orcamento)],
    ['Receitas recebidas', formatCurrencyBRL(snap.recebido)],
    ['(-) Despesas diretas', formatCurrencyBRL(snap.pago)],
    ['(-) Impostos pagos (vinculados)', formatCurrencyBRL(snap.impostosDespesas)],
    ['(-) Provisão imposto (perfil)', formatCurrencyBRL(snap.impostosProvisao)],
    ['(=) Resultado do projeto', formatCurrencyBRL(snap.resultado)],
    ['Margem %', snap.margemPct != null ? `${snap.margemPct.toFixed(1)}%` : '—'],
    ['Saldo de caixa', formatCurrencyBRL(snap.saldoCaixa)],
    [
      'Saldo orçamentário',
      snap.saldoOrcamento != null ? formatCurrencyBRL(snap.saldoOrcamento) : '—',
    ],
    ['Situação', SEMAFORO_LABEL[snap.semaforo]],
  ];
}

function extratoTableRows(lines: ProjectRoiExtratoLine[]): string[][] {
  return lines.map((line) => [
    line.date,
    extratoLineTipoLabel(line),
    line.description,
    line.counterparty ?? '—',
    line.kind === 'expense' ? expenseCategoryLabel(line.category) : '—',
    line.impostoValor != null && line.impostoValor > 0
      ? formatCurrencyBRL(line.impostoValor)
      : '—',
    formatCurrencyBRL(line.amount),
    line.saldoAcumulado != null ? formatCurrencyBRL(line.saldoAcumulado) : '—',
    line.isEstorno ? 'Estorno' : '—',
    line.hasComprovante ? 'Sim' : '—',
  ]);
}

const EXTRATO_HEADERS = [
  'Data',
  'Tipo',
  'Descrição',
  'Contraparte',
  'Categoria',
  'Imposto',
  'Valor',
  'Saldo acum.',
  'Status',
  'Comprovante',
];

export function buildProjectRoiDreCsv(input: ProjectRoiExportInput): string {
  const { roiCase, snap, title, supplierSummary } = input;
  const rows: string[][] = [
    ['DRE gerencial do projeto (Projetos & ROI)'],
    ['Não substitui a DRE Contábil da empresa'],
    [''],
    ['Caso', title],
    ['Referência', roiCase.sourceProposalNumber || '—'],
    ['Origem', roiCase.origin],
    ['Situação', SEMAFORO_LABEL[snap.semaforo]],
    [''],
    ['Linha', 'Valor'],
    ...dreRows(snap).map(([l, v]) => [l, v]),
    [''],
    ['Extrato'],
    EXTRATO_HEADERS,
    ...extratoTableRows(snap.extrato),
    [''],
    ['Pagamentos por prestador'],
    ['Prestador', 'Qtd', 'Total pago', '% do caso', 'Último pagamento', 'Contratado'],
    ...supplierSummary.groups.map((g) => [
      g.supplierName,
      String(g.paymentCount),
      formatCurrencyBRL(g.totalPaid),
      `${g.pctOfCasePaid.toFixed(1)}%`,
      g.lastPaymentDate ?? '—',
      g.contractedValue != null ? formatCurrencyBRL(g.contractedValue) : '—',
    ]),
  ];

  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'),
    )
    .join('\n');
}

export function downloadProjectRoiDreCsv(input: ProjectRoiExportInput): void {
  const csv = buildProjectRoiDreCsv(input);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${buildExportBaseName(input.title, input.roiCase)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadProjectRoiExcel(input: ProjectRoiExportInput): void {
  const { roiCase, snap, title, supplierSummary } = input;
  const wb = XLSX.utils.book_new();

  const resumoSheet = XLSX.utils.aoa_to_sheet([
    ['Projetos & ROI — DRE gerencial'],
    ['Caso', title],
    ['Referência', roiCase.sourceProposalNumber || '—'],
    ['Origem', roiCase.origin],
    ['Emissão', new Date().toLocaleString('pt-BR')],
    [],
    ['Linha', 'Valor'],
    ...dreRows(snap),
  ]);
  XLSX.utils.book_append_sheet(wb, resumoSheet, 'DRE');

  const extratoSheet = XLSX.utils.aoa_to_sheet([
    EXTRATO_HEADERS,
    ...extratoTableRows(snap.extrato),
  ]);
  XLSX.utils.book_append_sheet(wb, extratoSheet, 'Extrato');

  const supplierRows: string[][] = [
    ['Prestador', 'Qtd pagamentos', 'Total pago', '% do caso', 'Último pag.', 'Contratado'],
    ...supplierSummary.groups.map((g) => [
      g.supplierName,
      String(g.paymentCount),
      g.totalPaid.toFixed(2),
      g.pctOfCasePaid.toFixed(1),
      g.lastPaymentDate ?? '',
      g.contractedValue != null ? g.contractedValue.toFixed(2) : '',
    ]),
  ];
  if (supplierSummary.groups.some((g) => g.payments.length > 0)) {
    supplierRows.push([]);
    supplierRows.push(['Detalhe dos pagamentos']);
    supplierRows.push(['Prestador', 'Data', 'Descrição', 'Categoria', 'Valor']);
    for (const g of supplierSummary.groups) {
      for (const p of g.payments) {
        supplierRows.push([
          g.supplierName,
          p.date,
          p.description,
          expenseCategoryLabel(p.category),
          p.amount.toFixed(2),
        ]);
      }
    }
  }
  const fornecSheet = XLSX.utils.aoa_to_sheet(supplierRows);
  XLSX.utils.book_append_sheet(wb, fornecSheet, 'Por prestador');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${buildExportBaseName(title, roiCase)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderPdfTable(
  session: MmBrandedPdfSession,
  headers: string[],
  rows: string[][],
  startY: number,
): number {
  const { doc, margins } = session;
  let y = startY;
  const colCount = headers.length;
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - margins.left - margins.right;
  const colWidth = tableWidth / colCount;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  headers.forEach((h, i) => {
    doc.text(h.slice(0, 18), margins.left + i * colWidth, y);
  });
  y += 4;
  doc.setFont('helvetica', 'normal');

  for (const row of rows) {
    y = session.ensureSpace(y, 5);
    row.forEach((cell, i) => {
      doc.text(String(cell).slice(0, 22), margins.left + i * colWidth, y);
    });
    y += 4;
  }
  return y + 4;
}

export async function generateProjectRoiPdfBlob(
  input: ProjectRoiExportInput,
  brandingData: LocalBranding | null | undefined,
  pdfImages?: BrandingPdfImages | null,
): Promise<{ blob: Blob; fileName: string }> {
  if (!pdfImages) {
    throw new Error('Configure a identidade visual em Configurações para exportar PDF.');
  }
  const brandingUrls = brandingUrlsFromLocal(brandingData);
  const session = await createMmBrandedPdfSession(brandingUrls, undefined, pdfImages);

  const { roiCase, snap, title, supplierSummary } = input;
  let y = writeBrandedPdfTitle(session, 'Projetos & ROI — Relatório gerencial', 14);
  y = writeBrandedPdfParagraph(session, `Caso: ${title}`, 10, y);
  y = writeBrandedPdfParagraph(
    session,
    `Referência: ${roiCase.sourceProposalNumber || '—'} | Origem: ${roiCase.origin} | ${SEMAFORO_LABEL[snap.semaforo]}`,
    10,
    y,
  );
  y = writeBrandedPdfParagraph(
    session,
    `Emissão: ${new Date().toLocaleString('pt-BR')}`,
    9,
    y,
  );
  y += 4;

  y = writeBrandedPdfTitle(session, 'DRE gerencial do projeto', 11, y);
  for (const [label, val] of dreRows(snap)) {
    y = session.ensureSpace(y, 5);
    session.doc.setFont('helvetica', 'normal');
    session.doc.setFontSize(9);
    session.doc.text(`${label}: ${val}`, session.margins.left, y);
    y += 5;
  }
  y += 4;

  y = writeBrandedPdfTitle(session, 'Extrato', 11, y);
  y = renderPdfTable(
    session,
    EXTRATO_HEADERS,
    extratoTableRows(snap.extrato),
    y,
  );

  y = writeBrandedPdfTitle(session, 'Pagamentos por prestador', 11, y);
  y = renderPdfTable(
    session,
    ['Prestador', 'Qtd', 'Total', '%', 'Último pag.', 'Contratado'],
    supplierSummary.groups.map((g) => [
      g.supplierName,
      String(g.paymentCount),
      formatCurrencyBRL(g.totalPaid),
      `${g.pctOfCasePaid.toFixed(1)}%`,
      g.lastPaymentDate ?? '—',
      g.contractedValue != null ? formatCurrencyBRL(g.contractedValue) : '—',
    ]),
    y,
  );

  session.finalize();
  const blob = session.doc.output('blob');
  return {
    blob,
    fileName: `${buildExportBaseName(title, roiCase)}.pdf`,
  };
}

export async function generateProjectRoiDocxBlob(
  input: ProjectRoiExportInput,
  pdfImages: BrandingPdfImages,
): Promise<{ blob: Blob; fileName: string }> {
  const {
    AlignmentType,
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx');

  const { roiCase, snap, title, supplierSummary } = input;
  const branded = await buildBrandedDocxSectionSetup(pdfImages);
  const font = DOCX_BRANDING_FONT;

  const cell = (text: string, bold = false) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text, font, size: 20, bold })],
        }),
      ],
    });

  const headerRow = (headers: string[]) =>
    new TableRow({
      children: headers.map((h) => cell(h, true)),
    });

  const dataRow = (cells: string[]) =>
    new TableRow({
      children: cells.map((c) => cell(c)),
    });

  const dreTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      headerRow(['Linha', 'Valor']),
      ...dreRows(snap).map(([l, v]) => dataRow([l, v])),
    ],
  });

  const extratoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      headerRow(EXTRATO_HEADERS),
      ...extratoTableRows(snap.extrato).map((row) => dataRow(row)),
    ],
  });

  const supplierTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      headerRow(['Prestador', 'Qtd', 'Total pago', '%', 'Último pag.', 'Contratado']),
      ...supplierSummary.groups.map((g) =>
        dataRow([
          g.supplierName,
          String(g.paymentCount),
          formatCurrencyBRL(g.totalPaid),
          `${g.pctOfCasePaid.toFixed(1)}%`,
          g.lastPaymentDate ?? '—',
          g.contractedValue != null ? formatCurrencyBRL(g.contractedValue) : '—',
        ]),
      ),
    ],
  });

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'Projetos & ROI — Relatório gerencial',
          font,
          size: 28,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Caso: ${title}`, font, size: 22 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Referência: ${roiCase.sourceProposalNumber || '—'} | Origem: ${roiCase.origin}`,
          font,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `Emissão: ${new Date().toLocaleString('pt-BR')}`,
          font,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: 'DRE gerencial', font, size: 24, bold: true })],
    }),
    dreTable,
    new Paragraph({
      spacing: { before: 300, after: 120 },
      children: [new TextRun({ text: 'Extrato', font, size: 24, bold: true })],
    }),
    extratoTable,
    new Paragraph({
      spacing: { before: 300, after: 120 },
      children: [
        new TextRun({ text: 'Pagamentos por prestador', font, size: 24, bold: true }),
      ],
    }),
    supplierTable,
  ];

  const doc = new Document({
    sections: [
      {
        ...branded,
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return {
    blob,
    fileName: `${buildExportBaseName(title, roiCase)}.docx`,
  };
}

export function formatDreLineValue(value: number): string {
  return formatCurrencyBRL(value);
}
