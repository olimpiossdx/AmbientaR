'use client';

import * as React from 'react';
import { FileText, FileDown, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { useFirebase } from '@/firebase';
import { guardBrandingExportFromHook } from '@/lib/pdf-branding-layout';
import { asPiaRecord, type PiaRecord } from '@/lib/pia/pia-record';
import { validatePiaForExport } from '@/lib/pia/pia-export-validation';
import { downloadPiaExportPdf } from '@/lib/pia/pia-export-pdf';
import { downloadPiaExportDocx, generatePiaExportDocxBlob } from '@/lib/pia/pia-export-docx';
import {
  attachPiaPdfToRequestLicensing,
  persistPiaExportVersion,
} from '@/lib/pia/pia-export-persist';

type PiaExportButtonsProps = {
  pia: PiaRecord;
  /** Exibir botões compactos (lista) ou em linha (edição). */
  variant?: 'default' | 'compact';
  className?: string;
};

export function PiaExportButtons({
  pia,
  variant = 'default',
  className,
}: PiaExportButtonsProps) {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const [busy, setBusy] = React.useState<'pdf' | 'docx' | null>(null);
  const record = asPiaRecord(pia);
  const isApproved = record?.status === 'Aprovado';
  const latestPdf = record?.latestExport?.pdf;
  const latestDocx = record?.latestExport?.docx;

  const runValidation = (): boolean => {
    if (!record) return false;
    const issues = validatePiaForExport(record);
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

  const guardBranding = (formatLabel: string): boolean =>
    guardBrandingExportFromHook({
      brandingData,
      pdfImages,
      isPdfImagesLoading,
      hasBrandingUrls,
      toast,
      formatLabel,
    });

  const afterExport = async (
    format: 'pdf' | 'docx',
    blob: Blob,
    fileName: string,
    sectionManifest: string[],
    attachToRequest: boolean,
  ) => {
    if (!firestore || !record?.id) return;
    try {
      const version = await persistPiaExportVersion(
        firestore,
        record.id,
        format,
        blob,
        fileName,
        sectionManifest,
        user?.uid,
      );
      if (attachToRequest && format === 'pdf' && record.requestId) {
        await attachPiaPdfToRequestLicensing(
          firestore,
          record.requestId,
          record.id,
          version.downloadUrl,
          version.fileName,
        );
        toast({
          title: 'PIA exportado e anexado',
          description:
            'PDF guardado no PIA e registrado na documentação de licenciamento do processo.',
        });
      } else {
        toast({
          title: 'Exportação salva',
          description: `${fileName} guardado no histórico do PIA.`,
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao guardar exportação',
        description: e instanceof Error ? e.message : 'Tente novamente.',
      });
    }
  };

  const handleExportPdf = async (persist: boolean) => {
    if (!record || !runValidation() || !guardBranding('PDF')) return;
    setBusy('pdf');
    try {
      const result = await downloadPiaExportPdf(record, brandingData, pdfImages);
      if (persist && firestore) {
        const attach =
          !!record.requestId &&
          window.confirm(
            'Deseja anexar o PDF ao processo de licenciamento vinculado?',
          );
        await afterExport('pdf', result.blob, result.fileName, result.sectionManifest, attach);
      } else {
        toast({ title: 'PDF gerado', description: result.fileName });
      }
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

  const handleExportDocx = async (persist: boolean) => {
    if (!record || !runValidation() || !pdfImages || !guardBranding('Word')) return;
    setBusy('docx');
    try {
      const result = await downloadPiaExportDocx(record, pdfImages);
      if (persist && firestore) {
        await afterExport('docx', result.blob, result.fileName, result.sectionManifest, false);
      } else {
        toast({ title: 'Word gerado', description: result.fileName });
      }
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

  if (!isApproved) {
    return (
      <p className={className ?? 'text-sm text-muted-foreground'}>
        Aprove o PIA para exportar Word ou PDF com identidade visual.
      </p>
    );
  }

  const size = variant === 'compact' ? 'sm' : 'default';

  return (
    <div className={className ?? 'flex flex-wrap items-center gap-2'}>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={!!busy}
        onClick={() => handleExportPdf(true)}
      >
        {busy === 'pdf' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-2 h-4 w-4" />
        )}
        Exportar PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={!!busy}
        onClick={() => handleExportDocx(true)}
      >
        {busy === 'docx' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Exportar Word
      </Button>
      {(latestPdf?.downloadUrl || latestDocx?.downloadUrl) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size={size}>
              <Link2 className="mr-2 h-4 w-4" />
              Última versão
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {latestPdf?.downloadUrl && (
              <DropdownMenuItem asChild>
                <a href={latestPdf.downloadUrl} target="_blank" rel="noopener noreferrer">
                  PDF — {latestPdf.fileName}
                </a>
              </DropdownMenuItem>
            )}
            {latestDocx?.downloadUrl && (
              <DropdownMenuItem asChild>
                <a href={latestDocx.downloadUrl} target="_blank" rel="noopener noreferrer">
                  Word — {latestDocx.fileName}
                </a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
