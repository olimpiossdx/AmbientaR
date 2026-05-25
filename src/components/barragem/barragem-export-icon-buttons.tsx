'use client';

import * as React from 'react';
import { FileDown, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { guardBrandingExportFromHook } from '@/lib/pdf-branding-layout';
import type { ProjetoTecnicoBarragem } from '@/lib/types';
import type { DocxTemplatesState } from '@/lib/docx-template-slugs';
import { validateBarragemForExport } from '@/lib/barragem/barragem-export-validation';
import {
  generateBarragemExportDocxBlobBranded,
  generateBarragemExportDocxFromTemplate,
} from '@/lib/barragem/barragem-export-docx';
import { generateBarragemExportPdfBlob } from '@/lib/barragem/barragem-export-pdf';

type BarragemExportIconButtonsProps = {
  projeto: ProjetoTecnicoBarragem;
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

export function BarragemExportIconButtons({ projeto }: BarragemExportIconButtonsProps) {
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const docxTemplatesRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'companySettings', 'docxTemplates') : null),
    [firestore],
  );
  const { data: docxTemplates } = useDoc<DocxTemplatesState>(docxTemplatesRef);

  const [busy, setBusy] = React.useState<'pdf' | 'docx' | null>(null);

  const runValidation = (): boolean => {
    const issues = validateBarragemForExport(projeto);
    if (issues.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Exportação indisponível',
        description: issues.map((i) => i.message).join(' '),
      });
      return false;
    }
    return true;
  };

  const handleExportPdf = async () => {
    if (!runValidation()) return;
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
      const result = await generateBarragemExportPdfBlob(projeto, brandingData, pdfImages);
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
      setBusy(null);
    }
  };

  const handleExportDocx = async () => {
    if (!runValidation() || !firestore) return;
    setBusy('docx');
    try {
      const templateUrl = docxTemplates?.barragens?.url;
      const result = templateUrl
        ? await generateBarragemExportDocxFromTemplate({
            projeto,
            firestore,
            auth,
            templateUrl,
          })
        : await (async () => {
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
              throw new Error('cancelled');
            }
            return generateBarragemExportDocxBlobBranded(projeto, pdfImages!);
          })();
      downloadBlob(result.blob, result.fileName);
      toast({
        title: 'Word gerado',
        description: templateUrl
          ? `${result.fileName} (template personalizado)`
          : `${result.fileName} (identidade visual aplicada)`,
      });
    } catch (e) {
      if (e instanceof Error && e.message === 'cancelled') return;
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar Word',
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
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              type="button"
              disabled={busy !== null}
              aria-busy={busy === 'pdf'}
              onClick={handleExportPdf}
            >
              {busy === 'pdf' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              <span className="sr-only">Exportar PDF</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exportar em PDF (com branding)</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              type="button"
              disabled={busy !== null}
              aria-busy={busy === 'docx'}
              onClick={handleExportDocx}
            >
              {busy === 'docx' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span className="sr-only">Exportar Word</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Exportar em Word
            {docxTemplates?.barragens?.url ? ' (template)' : ' (editável + branding)'}
          </p>
        </TooltipContent>
      </Tooltip>
    </>
  );
}
