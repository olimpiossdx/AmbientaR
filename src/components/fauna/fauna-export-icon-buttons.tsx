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
import type { FaunaStudy } from '@/lib/types';
import type { DocxTemplatesState } from '@/lib/docx-template-slugs';
import { validateFaunaForExport } from '@/lib/fauna/fauna-export-validation';
import { generateFaunaExportDocxBlobBranded } from '@/lib/fauna/fauna-export-docx';
import { generateFaunaExportPdfBlob } from '@/lib/fauna/fauna-export-pdf';

type FaunaExportIconButtonsProps = {
  study: FaunaStudy;
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

export function FaunaExportIconButtons({ study }: FaunaExportIconButtonsProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
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
    const issues = validateFaunaForExport(study);
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
      const result = await generateFaunaExportPdfBlob(study, brandingData, pdfImages);
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
    if (!runValidation()) return;
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
      const result = await generateFaunaExportDocxBlobBranded(study, pdfImages!);
      downloadBlob(result.blob, result.fileName);
      toast({
        title: 'Word gerado',
        description: docxTemplates?.fauna?.url
          ? `${result.fileName} (template configurado)`
          : `${result.fileName} (editável + branding)`,
      });
    } catch (e) {
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
          <p>Exportar em PDF</p>
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
            {docxTemplates?.fauna?.url ? ' (template configurado)' : ' (editável + branding)'}
          </p>
        </TooltipContent>
      </Tooltip>
    </>
  );
}
