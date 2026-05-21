import type jsPDF from 'jspdf';
import type { Client, CommercialProposal, EnvironmentalCompany } from '@/lib/types';
import type { LocalBranding } from '@/hooks/use-local-branding';
import { downloadJsPdf } from '@/lib/branding-pdf';
import {
  brandingUrlsFromLocal,
  drawWatermarkOnPage,
  finalizePdfBranding,
  getContentBottomLimit,
  getContentStartY,
  loadPdfBranding,
  PDF_BRANDING_MARGINS_MM,
  reportBrandingPdfIssues,
  type BrandingPdfToastReporter,
} from '@/lib/pdf-branding-layout';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(value) ? value : 0,
  );

function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    const d = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDatePtBr(value: unknown): string {
  const d = toDate(value);
  return d
    ? d.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Não informado';
}

function statusLabel(status: CommercialProposal['status']): string {
  switch (status) {
    case 'Draft':
      return 'Rascunho';
    case 'Sent':
      return 'Enviada';
    case 'Accepted':
      return 'Aceita';
    case 'Rejected':
      return 'Rejeitada';
    default:
      return status;
  }
}

export { downloadJsPdf } from '@/lib/branding-pdf';

const RESPONSABILIDADES_CONTRATADA = [
  'Os custos de taxas e emolumentos referentes ao órgão licenciador NÃO estão inclusos.',
  'Juntar, avaliar e definir estratégias para a condução dos processos de licenciamento visando o menor custo e tempo.',
  'Mensurar e avaliar estudos prévios para evitar retrabalhos.',
  'Reunir com ex-contratados para definir continuidade de trabalhos iniciados.',
  'Repassar ao contratante, de forma didática e simplificada, o andamento de cada etapa.',
  'Conduzir os trabalhos conforme normas técnicas e legislação vigente.',
  'Cumprir todas as obrigações sociais, trabalhistas, fiscais e de seguros contra acidentes de trabalho.',
  'Disponibilizar meios necessários para auditorias, controles e consultorias.',
  'Prestar informações e relatórios sempre que solicitado.',
];

const RESPONSABILIDADES_CONTRATANTE = [
  'Credenciar o pessoal da contratada para obtenção de informações e dados necessários.',
  'Fornecer alojamento e alimentação ao corpo técnico durante os estudos no imóvel.',
  'Providenciar acesso às propriedades públicas ou privadas necessárias aos trabalhos.',
  'Fornecer informações e dados em tempo hábil quando solicitado.',
];

export type GenerateCommercialProposalPdfInput = {
  proposal: CommercialProposal;
  client?: Client | null;
  companyProfile?: Omit<EnvironmentalCompany, 'id'> | null;
  branding?: LocalBranding | null;
  onBrandingIssue?: BrandingPdfToastReporter;
};

export async function generateCommercialProposalPdf({
  proposal,
  client,
  companyProfile,
  branding,
  onBrandingIssue,
}: GenerateCommercialProposalPdfInput): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const urls = brandingUrlsFromLocal(branding);
  const pdfBranding = await loadPdfBranding(doc, urls, PDF_BRANDING_MARGINS_MM);
  reportBrandingPdfIssues(urls, pdfBranding.images, onBrandingIssue);

  const { margins } = pdfBranding;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margins.left - margins.right;
  const bottomLimit = () => getContentBottomLimit(doc, pdfBranding);

  drawWatermarkOnPage(doc, pdfBranding);
  let yPos = getContentStartY(pdfBranding);

  const ensureSpace = (neededMm: number) => {
    if (yPos + neededMm > bottomLimit()) {
      doc.addPage();
      drawWatermarkOnPage(doc, pdfBranding);
      yPos = getContentStartY(pdfBranding);
    }
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSTA COMERCIAL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(11);
  doc.text(`Nº ${proposal.proposalNumber || '—'}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de emissão: ${formatDatePtBr(proposal.proposalDate)}`, margins.left, yPos);
  yPos += 5;
  doc.text(`Válida até: ${formatDatePtBr(proposal.validUntilDate)}`, margins.left, yPos);
  yPos += 5;
  doc.text(`Status: ${statusLabel(proposal.status)}`, margins.left, yPos);
  yPos += 8;

  if (client) {
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', margins.left, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(client.name || '—', margins.left, yPos);
    yPos += 5;
    if (client.cpfCnpj) {
      doc.text(`CPF/CNPJ: ${client.cpfCnpj}`, margins.left, yPos);
      yPos += 5;
    }
    const introText = `A presente proposta foi elaborada no sentido de atender a demanda solicitada para o Sr(a). ${client.name} para o empreendimento ${proposal.empreendimento || 'não especificado'} no município de ${client.municipio || 'não especificado'} no estado de ${client.uf || 'não especificado'}.`;
    const introLines = doc.splitTextToSize(introText, contentWidth);
    ensureSpace(introLines.length * 5 + 4);
    doc.text(introLines, margins.left, yPos);
    yPos += introLines.length * 5 + 6;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  ensureSpace(10);
  doc.text('Descrição dos Serviços', margins.left, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const items = proposal.items ?? [];
  if (items.length === 0) {
    ensureSpace(6);
    doc.text('Nenhum item cadastrado.', margins.left + 5, yPos);
    yPos += 8;
  } else {
    items.forEach((item) => {
      const itemText = `• ${item.description || 'Serviço'}: ${formatCurrency(Number(item.value) || 0)}`;
      const itemLines = doc.splitTextToSize(itemText, contentWidth - 5);
      ensureSpace(itemLines.length * 5 + 2);
      doc.text(itemLines, margins.left + 5, yPos);
      yPos += itemLines.length * 5 + 2;
    });
  }

  yPos += 4;
  doc.setFont('helvetica', 'bold');
  ensureSpace(8);
  doc.text(`Valor total: ${formatCurrency(Number(proposal.amount) || 0)}`, margins.left, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.text('Forma de Pagamento', margins.left, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const paymentTerms = proposal.paymentTerms || 'A ser combinado.';
  const paymentLines = doc.splitTextToSize(paymentTerms, contentWidth);
  ensureSpace(paymentLines.length * 5 + 4);
  doc.text(paymentLines, margins.left, yPos);
  yPos += paymentLines.length * 5 + 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  ensureSpace(8);
  doc.text('Observações', margins.left, yPos);
  yPos += 7;

  doc.setFontSize(11);
  doc.text('Responsabilidades da Contratada', margins.left, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  RESPONSABILIDADES_CONTRATADA.forEach((item) => {
    const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 5);
    ensureSpace(lines.length * 4 + 2);
    doc.text(lines, margins.left + 5, yPos);
    yPos += lines.length * 4 + 2;
  });

  yPos += 4;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  ensureSpace(8);
  doc.text('Responsabilidades da Contratante', margins.left, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  RESPONSABILIDADES_CONTRATANTE.forEach((item) => {
    const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 5);
    ensureSpace(lines.length * 4 + 2);
    doc.text(lines, margins.left + 5, yPos);
    yPos += lines.length * 4 + 2;
  });

  yPos += 12;
  ensureSpace(35);
  doc.setFontSize(10);
  doc.text('Atenciosamente,', pageWidth / 2, yPos, { align: 'center' });
  yPos += 18;
  doc.text('_________________________________________', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(
    companyProfile?.name || 'Pimenta Consultoria Ambiental',
    pageWidth / 2,
    yPos,
    { align: 'center' },
  );
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(companyProfile?.cnpj || '21.367.930/0001-58', pageWidth / 2, yPos, { align: 'center' });

  finalizePdfBranding(doc, pdfBranding);
  downloadJsPdf(doc, `proposta_${proposal.proposalNumber || proposal.id}.pdf`);
}
