"use client";

import * as React from "react";
import { FileText, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useLocalBranding } from "@/hooks/use-local-branding";
import type { Oficio } from "@/lib/types";
import {
  exportOficioDocx,
  exportOficioPdf,
  isOficioExportable,
} from "@/lib/oficio-export";
import {
  brandingUrlsFromLocal,
  guardBrandingExportFromHook,
  reportBrandingPdfIssues,
} from "@/lib/pdf-branding-layout";

type OficioExportButtonsProps = {
  oficio: Oficio;
  /** Botões compactos na lista; `default` na visualização. */
  variant?: "icon" | "default";
  className?: string;
};

export function OficioExportButtons({
  oficio,
  variant = "icon",
  className,
}: OficioExportButtonsProps) {
  const { toast } = useToast();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();
  const [loading, setLoading] = React.useState<"pdf" | "word" | null>(null);

  if (!isOficioExportable(oficio)) return null;

  const handlePdf = async () => {
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
    setLoading("pdf");
    try {
      await exportOficioPdf(oficio, {
        branding: brandingData,
        pdfImages,
      });
      toast({
        title: "PDF gerado",
        description:
          "Arquivo com identidade visual (cabeçalho, marca d'água e rodapé) baixado para protocolo.",
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erro ao exportar PDF",
        description: "Tente novamente ou copie o texto consolidado.",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleWord = async () => {
    if (
      !guardBrandingExportFromHook({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
        formatLabel: "Word",
      })
    ) {
      return;
    }
    const images = pdfImages ?? {
      headerBase64: null,
      footerBase64: null,
      watermarkBase64: null,
    };
    const urls = brandingUrlsFromLocal(brandingData);
    reportBrandingPdfIssues(urls, images, toast);
    setLoading("word");
    try {
      await exportOficioDocx(oficio, images);
      toast({
        title: "Word gerado",
        description:
          "Arquivo .docx com cabeçalho, marca d'água e rodapé (PDF continua sendo o formato oficial para protocolo).",
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erro ao exportar Word",
        description: "Tente novamente ou use o PDF para protocolo.",
      });
    } finally {
      setLoading(null);
    }
  };

  if (variant === "default") {
    return (
      <div className={className ?? "flex flex-wrap gap-2"}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading !== null}
          onClick={() => void handlePdf()}
        >
          {loading === "pdf" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Exportar PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading !== null}
          onClick={() => void handleWord()}
        >
          {loading === "word" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Exportar Word (.docx)
        </Button>
      </div>
    );
  }

  return (
    <div className={className ?? "flex items-center gap-1"}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-primary hover:text-primary"
            disabled={loading !== null}
            onClick={() => void handlePdf()}
          >
            {loading === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            <span className="sr-only">Exportar PDF</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exportar PDF para protocolo</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-primary hover:text-primary"
            disabled={loading !== null}
            onClick={() => void handleWord()}
          >
            {loading === "word" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span className="sr-only">Exportar Word</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exportar Word (.docx) com identidade visual</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
