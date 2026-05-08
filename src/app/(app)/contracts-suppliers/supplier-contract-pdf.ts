import jsPDF from "jspdf";
import type { SupplierContract, CompanySettings } from "@/lib/types";
import { applyImageOpacity, getImageDimensions } from "@/lib/branding-pdf";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const ML = 3;
const MR = 2;
const MT = 3;
const MB = 2;
const LH = 0.42;

function addPageNumbers(doc: jsPDF, bottomMarginCm: number = 1) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`${i}/${pageCount}`, pageWidth - bottomMarginCm, pageHeight - bottomMarginCm, {
      align: "right",
    });
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
): number {
  const lines: string[] = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y > pageHeight - marginBottom) {
      doc.addPage();
      y = MT;
      onNewPage?.();
    }
    doc.text(line, x, y);
    y += LH;
  }
  return y;
}

export async function generateSupplierContractPdf(
  contract: SupplierContract,
  brandingData: CompanySettings | null | undefined,
  fetchBrandingImageAsBase64: (url: string | undefined) => Promise<string | null>,
): Promise<void> {
  const doc = new jsPDF({ unit: "cm", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - ML - MR;

  const headerBase64 = await fetchBrandingImageAsBase64(brandingData?.headerImageUrl ?? undefined);
  const footerBase64 = await fetchBrandingImageAsBase64(brandingData?.footerImageUrl ?? undefined);
  const watermarkBase64Raw = await fetchBrandingImageAsBase64(brandingData?.watermarkImageUrl ?? undefined);
  const watermarkBase64 = watermarkBase64Raw
    ? await applyImageOpacity(watermarkBase64Raw, 0.15)
    : null;

  const drawWatermarkOnCurrentPage = () => {
    if (!watermarkBase64) return;
    const imgProps = doc.getImageProperties(watermarkBase64);
    const ar = imgProps.width / imgProps.height;
    const w = 10;
    doc.addImage(
      watermarkBase64,
      "PNG",
      (pageWidth - w) / 2,
      (pageHeight - w / ar) / 2,
      w,
      w / ar,
      undefined,
      "FAST",
    );
  };

  const hDims = headerBase64 ? await getImageDimensions(headerBase64) : null;
  const hSizeCm =
    hDims && hDims.width && hDims.height
      ? (() => {
          const maxW = pageWidth - ML - MR + 1;
          const maxH = 2.5;
          const ratio = hDims.width / hDims.height;
          let w = Math.min(hDims.width * 0.026458, maxW);
          let h = w / ratio;
          if (h > maxH) {
            h = maxH;
            w = h * ratio;
          }
          return { w, h };
        })()
      : null;

  const fDims = footerBase64 ? await getImageDimensions(footerBase64) : null;
  const fSizeCm =
    fDims && fDims.width && fDims.height
      ? (() => {
          const maxW = pageWidth - ML - MR + 1;
          const maxH = 1.5;
          const ratio = fDims.width / fDims.height;
          let w = Math.min(fDims.width * 0.026458, maxW);
          let h = w / ratio;
          if (h > maxH) {
            h = maxH;
            w = h * ratio;
          }
          return { w, h };
        })()
      : null;

  const addHeaderFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      if (headerBase64 && hSizeCm) doc.addImage(headerBase64, "PNG", MR, 0.5, hSizeCm.w, hSizeCm.h);
      if (footerBase64 && fSizeCm)
        doc.addImage(footerBase64, "PNG", MR, pageHeight - fSizeCm.h - 0.3, fSizeCm.w, fSizeCm.h);
    }
    addPageNumbers(doc, 0.8);
  };

  if (watermarkBase64) drawWatermarkOnCurrentPage();
  let y = headerBase64 && hSizeCm ? 0.5 + hSizeCm.h + 0.5 : MT;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CONTRATO DE PRESTACAO DE SERVICOS - FORNECEDOR", pageWidth / 2, y, {
    align: "center",
    maxWidth: contentWidth,
  });
  y += 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  y = addText(
    doc,
    `Numero do contrato: ${contract.contractNumber}`,
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
  );
  y += 0.2;

  const intro = `Pelo presente instrumento, de um lado a CONTRATANTE ${contract.contratante.nome}, inscrita no CNPJ ${contract.contratante.cnpj}, e do outro lado o PRESTADOR ${contract.prestador.nome}, inscrito no CPF/CNPJ ${contract.prestador.cpfCnpj}, firmam o presente contrato de prestacao de servicos, conforme clausulas abaixo.`;
  y = addText(doc, intro, ML, y, contentWidth, pageHeight, MB, drawWatermarkOnCurrentPage);
  y += 0.3;

  doc.setFont("helvetica", "bold");
  doc.text("CLAUSULA 1 - OBJETO", ML, y);
  y += LH;
  doc.setFont("helvetica", "normal");
  y = addText(
    doc,
    contract.objeto.servicos,
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
  );
  y += 0.3;

  doc.setFont("helvetica", "bold");
  doc.text("CLAUSULA 2 - PAGAMENTO", ML, y);
  y += LH;
  doc.setFont("helvetica", "normal");
  y = addText(
    doc,
    `Valor total: ${formatCurrency(contract.pagamento.valorTotal)}. Forma de pagamento: ${contract.pagamento.forma}.`,
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
  );
  y += 0.3;

  doc.setFont("helvetica", "bold");
  doc.text("CLAUSULA 3 - FORO", ML, y);
  y += LH;
  doc.setFont("helvetica", "normal");
  y = addText(
    doc,
    `Fica eleito o foro da Comarca de ${contract.foro.comarca}/${contract.foro.uf}, para dirimir quaisquer controversias.`,
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
  );
  y += 0.8;

  const dataContrato = new Date(contract.dataContrato).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  y = addText(
    doc,
    `${contract.foro.comarca}/${contract.foro.uf}, ${dataContrato}.`,
    ML,
    y,
    contentWidth,
    pageHeight,
    MB,
    drawWatermarkOnCurrentPage,
  );
  y += 1;

  doc.text("_______________________________________________________________", ML, y);
  y += 0.5;
  doc.text(`${contract.contratante.nome} (CONTRATANTE)`, ML, y);
  y += 1.3;
  doc.text("_______________________________________________________________", ML, y);
  y += 0.5;
  doc.text(`${contract.prestador.nome} (PRESTADOR)`, ML, y);

  addHeaderFooter();
  doc.save(`Contrato_Fornecedor_${contract.contractNumber.replace("/", "-")}.pdf`);
}

