import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { AuditLog, AppUser } from "@/lib/types";
import type { LocalBranding } from "@/hooks/use-local-branding";
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  drawWatermarkOnPage,
  guardBrandingExportFromHook,
  reportBrandingPdfIssues,
} from "@/lib/pdf-branding-layout";
import type { useToast } from "@/hooks/use-toast";

type ToastFn = ReturnType<typeof useToast>["toast"];

type ExportUserAuditLogInput = {
  firestore: Firestore;
  logUser: AppUser;
  format: "txt" | "pdf";
  brandingData: LocalBranding | null | undefined;
  pdfImages: Awaited<ReturnType<typeof createMmBrandedPdfSession>>["branding"]["images"] | null;
  isPdfImagesLoading: boolean;
  hasBrandingUrls: boolean;
  toast: ToastFn;
};

export async function exportUserAuditLog({
  firestore,
  logUser,
  format,
  brandingData,
  pdfImages,
  isPdfImagesLoading,
  hasBrandingUrls,
  toast,
}: ExportUserAuditLogInput): Promise<void> {
  toast({
    title: "Gerando log...",
    description: `Buscando registros para ${logUser.name}.`,
  });

  const logsQuery = query(
    collection(firestore, "auditLogs"),
    where("userId", "==", logUser.uid),
    orderBy("timestamp", "desc"),
  );

  try {
    const querySnapshot = await getDocs(logsQuery);
    const logs = querySnapshot.docs.map((docSnap) => docSnap.data() as AuditLog);

    if (format === "txt") {
      let logContent = `HISTÓRICO DE AUDITORIA\n`;
      logContent += `==================================================\n`;
      logContent += `Usuário: ${logUser.name} (${logUser.email})\n`;
      logContent += `ID do Usuário: ${logUser.uid}\n`;
      logContent += `Gerado em: ${new Date().toLocaleString("pt-BR")}\n`;
      logContent += `==================================================\n\n`;

      if (logs.length === 0) {
        logContent += "Nenhum registro de atividade encontrado para este usuário.";
      } else {
        logs.forEach((log) => {
          logContent += `Data:       ${log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString("pt-BR") : "N/A"}\n`;
          logContent += `Ação:       ${log.action}\n`;
          logContent += `Detalhes:   ${JSON.stringify(log.details, null, 2)}\n`;
          logContent += `--------------------------------------------------\n`;
        });
      }

      const blob = new Blob([logContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `log_${logUser.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === "pdf") {
      if (
        !guardBrandingExportFromHook({
          brandingData,
          pdfImages,
          isPdfImagesLoading,
          hasBrandingUrls,
          toast,
        })
      ) {
        return;
      }
      const session = await createMmBrandedPdfSession(
        brandingUrlsFromLocal(brandingData),
        undefined,
        pdfImages,
      );
      reportBrandingPdfIssues(
        brandingUrlsFromLocal(brandingData),
        session.branding.images,
        toast,
      );
      const { doc } = session;
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = session.startY;
      const onPdfPage = () => drawWatermarkOnPage(doc, session.branding);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Histórico de Auditoria do Usuário", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.text(`Usuário: ${logUser.name} (${logUser.email})`, 15, yPos);
      yPos += 5;
      doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 15, yPos);
      yPos += 10;
      doc.setLineWidth(0.5);
      doc.line(15, yPos - 5, pageWidth - 15, yPos - 5);

      if (logs.length === 0) {
        doc.text("Nenhum registro de atividade encontrado.", 15, yPos);
      } else {
        logs.forEach((log) => {
          const logString = `Data: ${log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString("pt-BR") : "N/A"}\nAção: ${log.action}\nDetalhes: ${JSON.stringify(log.details, null, 2)}`;
          const splitText = doc.splitTextToSize(logString, pageWidth - 30);

          if (yPos + splitText.length * 5 > pageHeight - 30) {
            doc.addPage();
            onPdfPage();
            yPos = session.startY;
          }

          doc.text(splitText, 15, yPos);
          yPos += splitText.length * 5 + 5;
          doc.setDrawColor(230, 230, 230);
          doc.line(15, yPos - 2.5, pageWidth - 15, yPos - 2.5);
          yPos += 5;
        });
      }

      session.finalize();

      const fileName = `log_${logUser.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    }

    toast({
      title: "Log Gerado",
      description: "O arquivo foi baixado com sucesso.",
    });
  } catch (error) {
    console.error("Error exporting user log:", error);
    toast({
      variant: "destructive",
      title: "Erro na Exportação",
      description: "Não foi possível gerar o arquivo de log.",
    });
  }
}
