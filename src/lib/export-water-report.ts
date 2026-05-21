import type jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import type { WaterPermit } from "@/lib/types";
import type { ComplianceReport } from "@/lib/water-compliance-engine";
import type { TelemetryReading } from "@/lib/types";
import type { BrandingImageUrls } from "@/lib/branding-pdf";
import {
  createMmBrandedPdfSession,
  drawWatermarkOnPage,
} from "@/lib/pdf-branding-layout";

type WaterReportMeta = {
  empreendedorName?: string;
  empreendimentoName?: string;
  coordinates?: string;
};

export async function generateWaterCompliancePDF(
  permit: WaterPermit,
  report: ComplianceReport,
  period: Date,
  readings: TelemetryReading[] = [],
  meta?: WaterReportMeta,
  brandingUrls?: BrandingImageUrls | null,
) {
  const { default: autoTable } = await import("jspdf-autotable");
  const hasBranding =
    Boolean(brandingUrls?.headerImageUrl) ||
    Boolean(brandingUrls?.footerImageUrl) ||
    Boolean(brandingUrls?.watermarkImageUrl);
  const session = hasBranding
    ? await createMmBrandedPdfSession(brandingUrls!)
    : null;
  const doc: jsPDF = session?.doc ?? new (await import("jspdf")).default();
  const contentTop = session?.startY ?? 22;
  const yShift = contentTop - 22;
  const onPdfPage = session
    ? () => drawWatermarkOnPage(doc, session.branding)
    : undefined;
  const dateStr = format(period, "MMMM 'de' yyyy", { locale: ptBR });
  const emitDate = format(new Date(), "dd/MM/yyyy HH:mm");
  const year = period.getFullYear();
  const monthLabels = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const monthlyLimit = permit.monthlyLimitM3 || 0;

  const monthCaptured = new Array<number>(12).fill(0);
  readings.forEach((r) => {
    const d = new Date(r.timestamp);
    if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) return;
    const m = d.getMonth();
    monthCaptured[m] += r.volumeM3 || 0;
  });

  const totalCapturedYear = monthCaptured.reduce((sum, v) => sum + v, 0);
  const totalGrantedYear = monthlyLimit * 12;
  const usageYear = totalGrantedYear > 0 ? (totalCapturedYear / totalGrantedYear) * 100 : 0;

  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text("Relatório de Conformidade Hídrica", 14, contentTop);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Período de Referência: ${dateStr} (${year})`, 14, 30 + yShift);
  doc.text(`Emitido em: ${emitDate}`, 14, 35 + yShift);

  doc.setDrawColor(41, 128, 185);
  doc.setFillColor(236, 246, 255);
  doc.roundedRect(14, 40 + yShift, 182, 24, 2, 2, "FD");
  doc.setFontSize(12);
  doc.setTextColor(28, 83, 132);
  doc.text("Identificação do Empreendimento", 16, 46 + yShift);
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Empreendedor: ${meta?.empreendedorName || "N/A"}`, 16, 52 + yShift);
  doc.text(`Empreendimento: ${meta?.empreendimentoName || "N/A"}`, 16, 57 + yShift);
  doc.text(`Coordenadas: ${meta?.coordinates || "N/A"}`, 16, 62 + yShift);

  autoTable(doc, {
    startY: 70 + yShift,
    willDrawPage: onPdfPage,
    head: [["Informação", "Detalhe"]],
    body: [
      ["Nº da Portaria", permit.permitNumber || "N/A"],
      ["Processo", permit.processNumber || "N/A"],
      ["Finalidade", permit.description || "N/A"],
      ["Volume Outorgado Mensal", `${monthlyLimit.toLocaleString("pt-BR")} m³`],
      ["Volume Captado no Período", `${report.totalVolumeMonth.toLocaleString("pt-BR")} m³`],
      ["Percentual de Uso", `${report.usagePercentage.toFixed(2)}%`],
      ["Dias Ativos no Mês", String(report.activeDaysCount)],
    ],
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] },
  });

  let nextY = ((doc as any).lastAutoTable?.finalY || 45) + 10;
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text("CAPTAÇÕES NO PERÍODO", 14, nextY);
  autoTable(doc, {
    startY: nextY + 3,
    willDrawPage: onPdfPage,
    head: [["Métrica", "Valor"]],
    body: [
      ["Captado (ano referência)", `${totalCapturedYear.toLocaleString("pt-BR")} m³`],
      ["Outorgado (ano referência)", `${totalGrantedYear.toLocaleString("pt-BR")} m³`],
      ["Utilizado no ano", `${usageYear.toFixed(2)}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });

  nextY = ((doc as any).lastAutoTable?.finalY || nextY) + 10;
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text("Tabela de Dados Mensais", 14, nextY);

  let cumulativeCaptured = 0;
  let cumulativeGranted = 0;
  const monthRows = monthLabels.map((label, i) => {
    const capMonth = monthCaptured[i];
    const outMonth = monthlyLimit;
    cumulativeCaptured += capMonth;
    cumulativeGranted += outMonth;
    const monthUsage = outMonth > 0 ? (capMonth / outMonth) * 100 : 0;
    const periodUsage = cumulativeGranted > 0 ? (cumulativeCaptured / cumulativeGranted) * 100 : 0;
    return [
      `${label}/${year}`,
      capMonth.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
      outMonth.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
      `${monthUsage.toFixed(2)}%`,
      cumulativeCaptured.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
      cumulativeGranted.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
      `${periodUsage.toFixed(2)}%`,
    ];
  });

  autoTable(doc, {
    startY: nextY + 3,
    willDrawPage: onPdfPage,
    head: [
      [
        "Mês",
        "Captado Mês (m³)",
        "Outorgado Mês (m³)",
        "Uso Mês (%)",
        "Captado Período (m³)",
        "Outorgado Período (m³)",
        "Uso Período (%)",
      ],
    ],
    body: monthRows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    theme: "striped",
  });

  nextY = ((doc as any).lastAutoTable?.finalY || nextY) + 10;
  if (nextY > 250) {
    doc.addPage();
    onPdfPage?.();
    nextY = session ? session.startY : 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(report.alerts.length > 0 ? 200 : 0, report.alerts.length > 0 ? 0 : 150, 0);
  doc.text("Pontos de Atenção dos Limites Outorgados", 14, nextY);

  const countByType = report.alerts.reduce<Record<string, number>>((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {});

  if (report.alerts.length > 0) {
    autoTable(doc, {
      startY: nextY + 5,
      willDrawPage: onPdfPage,
      head: [["Tipo", "Ocorrências"]],
      body: [
        ["Horas diárias excedidas", String(countByType.horas_diarias || 0)],
        ["Volume diário excedido", String(countByType.volume_diario || 0)],
        ["Dias mensais excedidos", String(countByType.dias_mensais || 0)],
        ["Volume mensal excedido", String(countByType.volume_mensal || 0)],
      ],
      headStyles: { fillColor: [192, 57, 43] },
      theme: "grid",
    });

    const detailsY = ((doc as any).lastAutoTable?.finalY || nextY + 5) + 6;
    const alertRows = report.alerts.map((a) => [
      a.date || "Mensal",
      a.type.replace("_", " ").toUpperCase(),
      a.message,
    ]);

    autoTable(doc, {
      startY: detailsY,
      willDrawPage: onPdfPage,
      head: [["Data", "Tipo de Alerta", "Descrição da Ocorrência"]],
      body: alertRows,
      headStyles: { fillColor: [192, 57, 43] },
      styles: { fontSize: 9 },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Nenhuma irregularidade detectada no período analisado.", 14, nextY + 10);
  }

  if (session) {
    session.finalize();
  } else {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        "Documento gerado automaticamente pelo sistema de gestão ambiental.",
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
    }
  }

  const fileName = `Relatorio_Hidrico_${permit.permitNumber || "outorga"}_${format(period, "yyyy-MM")}.pdf`;
  doc.save(fileName);
}
