'use client';

import * as React from 'react';
import { FileDown, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { guardBrandingExportFromHook } from '@/lib/pdf-branding-layout';
import type { PeaProgram } from '@/lib/pea/types';
import { generatePeaExportDocxBlob } from '@/lib/pea/pea-export-docx';
import { generatePeaExportPdfBlob } from '@/lib/pea/pea-export-pdf';

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function PeaExportButtons({ pea }: { pea: PeaProgram }) {
  const { toast } = useToast();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();
  const [busy, setBusy] = React.useState<'pdf' | 'docx' | null>(null);

  const handleDocx = async () => {
    if (
      !guardBrandingExportFromHook({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
        formatLabel: 'Word',
      })
    ) {
      return;
    }
    setBusy('docx');
    try {
      const { blob, fileName } = await generatePeaExportDocxBlob(pea, pdfImages!);
      downloadBlob(blob, fileName);
      toast({ title: 'Word gerado', description: fileName });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar Word',
        description: e instanceof Error ? e.message : 'Falha na exportação.',
      });
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    if (
      !guardBrandingExportFromHook({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
        formatLabel: 'PDF',
      })
    ) {
      return;
    }
    setBusy('pdf');
    try {
      const result = await generatePeaExportPdfBlob(pea, brandingData, pdfImages);
      downloadBlob(result.blob, result.fileName);
      toast({ title: 'PDF gerado', description: result.fileName });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar PDF',
        description: e instanceof Error ? e.message : 'Falha na exportação.',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={busy !== null}
            onClick={handlePdf}
          >
            {busy === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Exportar PEA (PDF)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={busy !== null}
            onClick={handleDocx}
          >
            {busy === 'docx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Exportar PEA (Word)</TooltipContent>
      </Tooltip>
    </>
  );
}
