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
import type { EstudoSegurancaBarragem } from '@/lib/types';
import type { DocxTemplatesState } from '@/lib/docx-template-slugs';
import {
  validateSegurancaForExport,
  segurancaExportBlockingIssues,
  segurancaExportWarnings,
} from '@/lib/seguranca-barragens/export-validation';
import {
  generateSegurancaExportDocxBlobBranded,
  generateSegurancaExportDocxFromTemplate,
} from '@/lib/seguranca-barragens/export-docx';
import { generateSegurancaExportPdfBlob } from '@/lib/seguranca-barragens/export-pdf';
import { SegurancaHecRasExportButtons } from '@/components/seguranca-barragens/seguranca-hec-ras-export-buttons';

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

export function SegurancaExportIconButtons({ estudo }: { estudo: EstudoSegurancaBarragem }) {
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
    const all = validateSegurancaForExport(estudo);
    const blocking = segurancaExportBlockingIssues(all);
    const warnings = segurancaExportWarnings(all);
    if (blocking.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Exportação indisponível',
        description: blocking.map((i) => i.message).join(' '),
      });
      return false;
    }
    if (warnings.length > 0) {
      toast({ title: 'Avisos na exportação', description: warnings.map((i) => i.message).join(' ') });
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
      const result = await generateSegurancaExportPdfBlob(estudo, brandingData, pdfImages);
      downloadBlob(result.blob, result.fileName);
      toast({ title: 'PDF gerado', description: result.fileName });
    } catch (e) {
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
      const templateUrl = docxTemplates?.['seguranca-barragens']?.url;
      const result = templateUrl
        ? await generateSegurancaExportDocxFromTemplate({
            estudo,
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
            return generateSegurancaExportDocxBlobBranded(estudo, pdfImages!);
          })();
      downloadBlob(result.blob, result.fileName);
      toast({ title: 'Word gerado', description: result.fileName });
    } catch (e) {
      if (e instanceof Error && e.message === 'cancelled') return;
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
              className="h-9 w-9"
              type="button"
              disabled={busy !== null}
              onClick={handleExportPdf}
            >
              {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              <span className="sr-only">Exportar PDF</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exportar PDF</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              type="button"
              disabled={busy !== null}
              onClick={handleExportDocx}
            >
              {busy === 'docx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              <span className="sr-only">Exportar Word</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Exportar Word
            {docxTemplates?.['seguranca-barragens']?.url ? ' (template)' : ' (branding)'}
          </p>
        </TooltipContent>
      </Tooltip>
      <SegurancaHecRasExportButtons estudo={estudo} />
    </>
  );
}
