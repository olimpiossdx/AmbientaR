'use client';

import * as React from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { guardBrandingExportFromHook } from '@/lib/pdf-branding-layout';
import type { EstudoCavidade } from '@/lib/types';
import { generateCavidadesExportPdfBlob } from '@/lib/cavidades/cavidades-export-pdf';

type CavidadesExportIconButtonsProps = {
  estudo: EstudoCavidade;
};

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

export function CavidadesExportIconButtons({ estudo }: CavidadesExportIconButtonsProps) {
  const { toast } = useToast();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();
  const [busy, setBusy] = React.useState(false);

  const handleExportPdf = async () => {
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
    setBusy(true);
    try {
      const result = await generateCavidadesExportPdfBlob(estudo, brandingData, pdfImages);
      downloadBlob(result.blob, result.fileName);
      toast({ title: 'PDF gerado', description: result.fileName });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar PDF',
        description: e instanceof Error ? e.message : 'Falha na exportação.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            type="button"
            disabled={busy}
            aria-busy={busy}
            onClick={handleExportPdf}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            <span className="sr-only">Exportar PDF</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Exportar estudo em PDF (branding)</p>
      </TooltipContent>
    </Tooltip>
  );
}
