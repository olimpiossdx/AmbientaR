/**
 * PDF do contrato com fornecedor (submenu Contratos-Fornecedores).
 * Independente de contracts/contract-pdf.ts — Pimenta como CONTRATANTE, fornecedor como PRESTADOR.
 */

import type { SupplierContract, CompanySettings } from '@/lib/types';
import type { LocalBranding } from '@/hooks/use-local-branding';
import type jsPDF from 'jspdf';
import { downloadJsPdf } from '@/lib/branding-pdf';
import {
  brandingUrlsFromLocal,
  drawWatermarkOnPage,
  finalizePdfBranding,
  getContentStartY,
  loadPdfBranding,
} from '@/lib/pdf-branding-layout';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
  const lines: string[] = doc.splitTextToSize(text, maxWidth);
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
  return y;
}

function addClauseTitle(
  doc: jsPDF,
  title: string,
  y: number,
  pageWidth: number,
  pageHeight: number,
  marginBottom: number,
  onNewPage?: () => void,
  contentStartY = MT,
): number {
  if (y > pageHeight - marginBottom - 1) {
    doc.addPage();
    y = contentStartY;
    onNewPage?.();
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const titleLines: string[] = doc.splitTextToSize(title, pageWidth - ML - MR);
  for (const line of titleLines) {
    if (y > pageHeight - marginBottom) {
      doc.addPage();
      y = contentStartY;
      onNewPage?.();
    }
    doc.text(line, ML, y);
    y += LH;
  }
  y += 0.1;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  return y;
}

type SupplierBranding = CompanySettings | LocalBranding | null | undefined;

function safeFilename(prestadorNome: string | undefined, contractNumber: string): string {
  const name = (prestadorNome || 'Fornecedor').replace(/\s+/g, '_');
  const num = contractNumber.replace(/\//g, '-');
  return `Contrato_Fornecedor_${num}_${name}.pdf`;
}

export async function buildSupplierContractPdfDoc(
  contract: SupplierContract,
  brandingData: SupplierBranding,
): Promise<jsPDF> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'cm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - ML - MR;

  const contratante = contract.contratante ?? { nome: '', cnpj: '' };
  const prestador = contract.prestador ?? { supplierId: '', nome: '', cpfCnpj: '' };
  const objeto = contract.objeto ?? { servicos: '' };
  const pagamento = contract.pagamento ?? { valorTotal: 0, valorExtenso: '', forma: '' };
  const foro = contract.foro ?? { comarca: 'Unaí', uf: 'MG' };

  const urls = brandingUrlsFromLocal(brandingData);
  const pdfBranding = await loadPdfBranding(doc, urls, {
    left: ML,
    right: MR,
    top: MT,
    bottom: MB,
  });
  const drawWatermarkOnCurrentPage = () => drawWatermarkOnPage(doc, pdfBranding);
  const pageContentStartY = getContentStartY(pdfBranding);
  drawWatermarkOnCurrentPage();

  let y = pageContentStartY;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'CONTRATO PARA PRESTAÇÃO DE SERVIÇOS TÉCNICOS DE ASSESSORIA E\nCONSULTORIA AMBIENTAL',
    pageWidth / 2,
    y,
    { align: 'center', maxWidth: contentWidth },
  );
  y += 1.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const enderecoContratante = [
    contratante.endereco,
    contratante.numero ? `nº ${contratante.numero}` : '',
    contratante.bairro ? `Bairro ${contratante.bairro}` : '',
    contratante.cep ? `CEP ${contratante.cep}` : '',
    contratante.municipio && contratante.uf
      ? `${contratante.municipio} – ${contratante.uf}`
      : '',
  ]
    .filter(Boolean)
    .join(', ');

  const introContratante = `Pelo presente instrumento particular de Contrato de prestação de serviços no Município de ${contratante.municipio || '_______________'}- ${contratante.uf || '__'}, de um lado ${contratante.nome || '__________________'}, inscrita no CNPJ ${contratante.cnpj || '__________________'}, com sede em ${enderecoContratante || '__________________'}, doravante denominada CONTRATANTE`;
  y = addText(doc, introContratante, ML, y, contentWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y += 0.3;

  const introPrestador = `e do outro lado ${prestador.nome || '__________________'}, inscrito no CPF/CNPJ ${prestador.cpfCnpj || '__________________'}${prestador.endereco ? `, com endereço em ${prestador.endereco}` : ''}, doravante denominado PRESTADOR. Mediante as cláusulas e condições seguintes tem justo e contratado o que se segue:`;
  y = addText(doc, introPrestador, ML, y, contentWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y += 0.8;

  y = addClauseTitle(doc, 'CLÁUSULA PRIMEIRA - DO OBJETO', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  const objetoText = `O presente contrato foi elaborado no sentido de atender a demanda solicitada${objeto.empreendimento ? ` para ${objeto.empreendimento}` : ''}${objeto.municipio ? ` no município de ${objeto.municipio}` : ''}${objeto.uf ? ` no estado de ${objeto.uf}` : ''} e consiste nas seguintes prestações de serviços:`;
  y = addText(doc, objetoText, ML, y, contentWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y += 0.3;

  const itens =
    objeto.itens && objeto.itens.length > 0
      ? objeto.itens
      : [{ descricao: objeto.servicos || '—', valor: pagamento?.valorTotal ?? 0 }];

  if (y > pageHeight - 4) {
    doc.addPage();
    y = pageContentStartY;
    drawWatermarkOnCurrentPage();
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Item', ML, y);
  doc.text('Serviços', ML + 1.5, y);
  doc.text('Valor', pageWidth - MR, y, { align: 'right' });
  y += LH;
  doc.setFont('helvetica', 'normal');
  for (let i = 0; i < itens.length; i++) {
    if (y > pageHeight - MB - 0.5) {
      doc.addPage();
      y = pageContentStartY;
      drawWatermarkOnCurrentPage();
    }
    const item = itens[i];
    const descLines = doc.splitTextToSize(item.descricao || '—', contentWidth - 4);
    doc.text(String(i + 1), ML, y);
    doc.text(descLines[0], ML + 1.5, y);
    doc.text(formatCurrency(Number(item.valor) || 0), pageWidth - MR, y, { align: 'right' });
    y += LH;
    for (let j = 1; j < descLines.length; j++) {
      doc.text(descLines[j], ML + 1.5, y);
      y += LH;
    }
  }
  y += 0.6;

  y = addClauseTitle(doc, 'CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DO PRESTADOR', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y = addText(
    doc,
    'O PRESTADOR assume inteira responsabilidade pelos serviços que serão realizados, assim como pelas orientações técnicas que transmitir à CONTRATANTE em função do objeto deste contrato.',
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );
  y += LH;

  y = addClauseTitle(doc, 'CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DA CONTRATANTE', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y = addText(
    doc,
    'A CONTRATANTE compromete-se a observar e a cumprir rigorosamente todas as orientações técnicas transmitidas pelo PRESTADOR, sob pena de eximir este das consequências pela não observância e cumprimento, quando aplicável.',
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );
  y += LH;

  y = addClauseTitle(doc, 'CLÁUSULA QUARTA - DA FORMA DE PAGAMENTO', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  const cl4 = `A CONTRATANTE pagará ao PRESTADOR pelos serviços contratados o valor total de ${formatCurrency(Number(pagamento?.valorTotal) || 0)} (${pagamento?.valorExtenso || '__________________'}). Forma de pagamento: ${pagamento?.forma || '__________________'}.`;
  y = addText(doc, cl4, ML, y, contentWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y += 0.25;
  if (pagamento?.banco || pagamento?.agencia || pagamento?.conta || pagamento?.pix) {
    const bancoPart = pagamento.banco ? `banco ${pagamento.banco}, ` : '';
    const agenciaPart = pagamento.agencia ? `Agência ${pagamento.agencia}, ` : '';
    const contaPart = pagamento.conta ? `Conta ${pagamento.conta}; ` : '';
    const pixPart = pagamento.pix ? `PIX: ${pagamento.pix}` : '';
    const dadosBanc = `Dados para pagamento e/ou depósito em favor do PRESTADOR ${prestador.nome || '—'}: ${bancoPart}${agenciaPart}${contaPart}${pixPart}.`;
    y = addText(doc, dadosBanc, ML, y, contentWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
    y += 0.25;
  }
  const parags = [
    'PARÁGRAFO PRIMEIRO: Ficará sob a responsabilidade da CONTRATANTE o(s) pagamento(s) de taxa(s) estabelecidas pelos órgãos competentes, quando aplicável ao escopo contratado.',
    'PARÁGRAFO SEGUNDO: Serão também de responsabilidade da CONTRATANTE eventuais outros serviços e/ou despesas aqui não incluídas e que surgirem em função da execução do objeto deste contrato, devendo os valores inerentes serem especificados e submetidos previamente à análise da CONTRATANTE.',
    'PARÁGRAFO TERCEIRO: Serão de responsabilidade da CONTRATANTE quanto à parte arqueológica e espeleológica, caso necessário relatório de gradação de cavidades.',
    'PARÁGRAFO QUARTO: Serão de responsabilidade da CONTRATANTE eventuais deslocamentos extraordinários acordados entre as partes e não previstos neste instrumento.',
  ];
  for (const p of parags) {
    y = addText(doc, p, ML, y, contentWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  }
  y += LH;

  y = addClauseTitle(doc, 'CLÁUSULA QUINTA - DO PRAZO', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y = addText(
    doc,
    'Este instrumento é celebrado por tempo indeterminado, iniciando-se na assinatura do contrato e terminando na conclusão dos serviços relacionados na Cláusula Primeira.',
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );
  y += LH;

  y = addClauseTitle(doc, 'CLÁUSULA SEXTA - DAS SANÇÕES E PENALIDADES', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y = addText(
    doc,
    'No caso do não cumprimento da Cláusula Quarta, fica a CONTRATANTE sujeita à multa de 30% (trinta por cento) sobre o valor inadimplido. Persistindo a inadimplência, o PRESTADOR poderá suspender a execução dos serviços até a regularização dos pagamentos devidos.',
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );
  y += LH;

  y = addClauseTitle(doc, 'CLÁUSULA SÉTIMA', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y = addText(
    doc,
    'Quando o processo ou serviço contratado for julgado e a licença ou autorização for concedida, o cumprimento das condicionantes impostas pelos órgãos ambientais competentes poderá ser objeto de novo contrato, se necessário.',
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );
  y += LH;

  y = addClauseTitle(doc, 'CLÁUSULA OITAVA', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y = addText(
    doc,
    'Caso o órgão ambiental venha a solicitar informações complementares (durante o período de análise) que não sejam próprias do escopo contratado, o valor para elaboração será combinado à parte. Para correção ou adequação de qualquer parte do trabalho já contratado, dentro do escopo acordado, não será cobrado valor adicional do PRESTADOR, salvo disposição em contrário entre as partes.',
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );
  y += LH;

  y = addClauseTitle(doc, 'CLÁUSULA NONA - Proteção de Dados Pessoais', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  const cl9Body = `Por meio deste instrumento, as partes estão autorizadas a tratar dados pessoais estritamente necessários à execução e manutenção do contrato, em conformidade com a legislação aplicável. Os dados serão utilizados exclusivamente para fins de manutenção, cumprimento e execução do referido contrato e obrigações legais correlatas (ex.: emissão de documentos fiscais). Poderá ocorrer o repasse de informações a órgãos ambientais quando imprescindível ao objeto contratual. Os dados não serão compartilhados com terceiros alheios à execução do serviço, salvo concordância das partes ou exigência legal.`;
  y = addText(doc, cl9Body, ML, y, contentWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y += LH;

  y = addClauseTitle(doc, 'CLÁUSULA DÉCIMA - Dever de Sigilo e Confidencialidade', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y = addText(
    doc,
    "As partes reconhecem a importância da proteção dos dados e se comprometem a manter estrito sigilo sobre informações obtidas durante a execução deste contrato, salvo autorização por escrito ou exigência legal. O dever de sigilo perdurará mesmo após o término deste contrato.",
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );
  y += LH;

  y = addClauseTitle(doc, 'CLÁUSULA DÉCIMA PRIMEIRA - DAS CONDIÇÕES COMPLEMENTARES', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y = addText(
    doc,
    'Para fins de complementação das obrigações contratuais, estabelecem as partes que: (I) O presente contrato vincula-se ao escopo e itens descritos na Cláusula Primeira; (II) Os pagamentos sob responsabilidade da CONTRATANTE deverão ocorrer conforme a forma acordada na Cláusula Quarta; (III) Os valores constantes neste contrato incluem os serviços contratados, abrangendo as atividades necessárias à execução do objeto pactuado; (IV) Taxas, emolumentos e despesas vinculadas a órgãos ambientais serão de responsabilidade da CONTRATANTE, salvo disposição expressa em contrário.',
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );
  y += LH;

  y = addClauseTitle(doc, 'CLÁUSULA DÉCIMA SEGUNDA - DO FORO', y, pageWidth, pageHeight, MB, drawWatermarkOnCurrentPage, pageContentStartY);
  y = addText(
    doc,
    `Os casos omissos serão resolvidos de comum acordo. Para dirimir dúvidas ou conflitos, fica eleito o Foro da Comarca de ${foro.comarca || 'Unaí'} – ${foro.uf || 'MG'}.`,
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );
  y += 0.6;

  y = addText(
    doc,
    'E por estarem de comum acordo, assinam o presente instrumento em 02 (duas) vias de igual teor e forma.',
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
    pageContentStartY,
  );
  y += 0.8;

  const dataContrato = contract.dataContrato
    ? new Date(contract.dataContrato).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '____________________';
  const cidadeForo = foro.comarca || 'Unaí';
  if (y > pageHeight - MB - 5) {
    doc.addPage();
    y = pageContentStartY;
    drawWatermarkOnCurrentPage();
  }
  doc.text(`${cidadeForo}/${foro.uf || 'MG'}, ${dataContrato}.`, ML, y);
  y += 1.2;

  doc.setFont('helvetica', 'normal');
  doc.text('_______________________________________________________________', ML, y);
  y += 0.5;
  doc.text(contratante.nome || 'CONTRATANTE', ML, y);
  doc.text(`CNPJ ${contratante.cnpj || '__________________'}`, ML, y + 0.45);
  doc.text('Contratante', ML, y + 0.9);
  y += 1.5;

  doc.text('_________________________________________________________________', ML, y);
  y += 0.5;
  doc.text(prestador.nome || 'PRESTADOR', ML, y);
  doc.text(`CPF/CNPJ ${prestador.cpfCnpj || '__________________'}`, ML, y + 0.45);
  doc.text('Prestador', ML, y + 0.9);
  y += 1.4;

  doc.setFontSize(9);
  doc.text('Testemunha 1: ____________________________________________;', ML, y);
  doc.text('Testemunha 2: _____________________________________________.', ML, y + 0.5);

  finalizePdfBranding(doc, pdfBranding, {
    footerBottomPad: 0.3,
    pageNumberBottomMargin: 0.8,
  });
  return doc;
}

export async function generateSupplierContractPdf(
  contract: SupplierContract,
  brandingData: SupplierBranding,
): Promise<void> {
  const doc = await buildSupplierContractPdfDoc(contract, brandingData);
  downloadJsPdf(doc, safeFilename(contract.prestador?.nome, contract.contractNumber));
}
