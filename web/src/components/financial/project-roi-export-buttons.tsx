'use client';

import * as React from 'react';
import { FileDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { guardBrandingExportFromHook } from '@/lib/pdf-branding-layout';
import type { ProjectRoiExportInput } from '@/lib/project-roi-export';
import {
  downloadProjectRoiDreCsv,
  downloadProjectRoiExcel,
  generateProjectRoiDocxBlob,
  generateProjectRoiPdfBlob,
} from '@/lib/project-roi-export';

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(url);
  link.remove();
}

export function ProjectRoiExportButtons({
  input,
  size = 'sm',
  layout = 'row',
}: {
  input: ProjectRoiExportInput | null;
  size?: 'sm' | 'default';
  layout?: 'row' | 'wrap';
}) {
  const { toast } = useToast();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();
  const [busy, setBusy] = React.useState<'pdf' | 'docx' | 'xlsx' | 'csv' | null>(
    null,
  );

  const className = layout === 'wrap' ? 'flex flex-wrap gap-2' : 'flex gap-2';

  const handlePdf = async () => {
    if (!input) return;
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
      const { blob, fileName } = await generateProjectRoiPdfBlob(
        input,
        brandingData,
        pdfImages,
      );
      downloadBlob(blob, fileName);
      toast({ title: 'PDF exportado', description: fileName });
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

  const handleDocx = async () => {
    if (!input) return;
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
      const { blob, fileName } = await generateProjectRoiDocxBlob(
        input,
        pdfImages!,
      );
      downloadBlob(blob, fileName);
      toast({ title: 'Word exportado', description: fileName });
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

  const handleExcel = () => {
    if (!input) return;
    setBusy('xlsx');
    try {
      downloadProjectRoiExcel(input);
      toast({ title: 'Excel exportado', description: 'Planilha gerada com sucesso.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar Excel',
        description: e instanceof Error ? e.message : 'Falha na exportação.',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleCsv = () => {
    if (!input) return;
    setBusy('csv');
    try {
      downloadProjectRoiDreCsv(input);
      toast({ title: 'CSV exportado', description: 'Arquivo gerado com sucesso.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar CSV',
        description: e instanceof Error ? e.message : 'Falha na exportação.',
      });
    } finally {
      setBusy(null);
    }
  };

  const disabled = !input || busy !== null;

  return (
    <div className={className}>
      <Button variant="outline" size={size} disabled={disabled} onClick={() => void handlePdf()}>
        {busy === 'pdf' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4 mr-2" />
        )}
        PDF
      </Button>
      <Button variant="outline" size={size} disabled={disabled} onClick={() => void handleDocx()}>
        {busy === 'docx' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        Word
      </Button>
      <Button variant="outline" size={size} disabled={disabled} onClick={handleExcel}>
        {busy === 'xlsx' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 mr-2" />
        )}
        Excel
      </Button>
      <Button variant="outline" size={size} disabled={disabled} onClick={handleCsv}>
        {busy === 'csv' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 mr-2" />
        )}
        CSV
      </Button>
    </div>
  );
}
