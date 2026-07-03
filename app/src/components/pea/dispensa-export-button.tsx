'use client';

import * as React from 'react';
import { FileDown, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { guardBrandingExportFromHook } from '@/lib/pdf-branding-layout';
import type { DispensaPeaRecord } from '@/lib/pea/types';
import { generateDispensaPeaExportDocxBlob } from '@/lib/pea/dispensa-export-docx';
import { generateDispensaPeaExportPdfBlob } from '@/lib/pea/dispensa-export-pdf';

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(url);
}

export function DispensaExportButton({
  record,
  size = 'sm',
}: {
  record: DispensaPeaRecord;
  size?: 'sm' | 'default';
}) {
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
      const { blob, fileName } = await generateDispensaPeaExportDocxBlob(record, pdfImages!);
      downloadBlob(blob, fileName);
      toast({ title: 'Word gerado', description: fileName });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro',
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
      const result = await generateDispensaPeaExportPdfBlob(record, brandingData, pdfImages);
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
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size={size} disabled={busy !== null} onClick={handlePdf}>
        {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileDown className="h-4 w-4 mr-1" />}
        PDF
      </Button>
      <Button type="button" variant="outline" size={size} disabled={busy !== null} onClick={handleDocx}>
        {busy === 'docx' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
        Word
      </Button>
    </div>
  );
}
