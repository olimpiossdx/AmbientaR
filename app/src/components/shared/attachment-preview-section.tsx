'use client';

/* eslint-disable @next/next/no-img-element -- Preview de anexos pode usar URLs blob/data/Firebase que não são imagens LCP da página. */

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, ZoomIn } from 'lucide-react';
import { isImageAttachmentUrl, isPdfAttachmentUrl } from '@/lib/attachment-utils';

export type AttachmentPreviewSectionProps = {
  fileUrl?: string | null;
  /** Texto quando não há arquivo */
  emptyLabel?: string;
  /** Título do bloco acima do preview */
  sectionLabel?: string;
  /** Título do modal de zoom */
  zoomTitle?: string;
  zoomDescription?: string;
  /** Altura da miniatura */
  previewClassName?: string;
};

export function AttachmentPreviewSection({
  fileUrl,
  emptyLabel = 'Sem anexo.',
  sectionLabel = 'Arquivo anexado',
  zoomTitle = 'Anexo',
  zoomDescription = 'Visualização ampliada do arquivo.',
  previewClassName = 'h-36 md:h-44',
}: AttachmentPreviewSectionProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const hasFile = !!fileUrl?.trim();
  const fileIsImage = useMemo(() => (fileUrl ? isImageAttachmentUrl(fileUrl) : false), [fileUrl]);
  const fileIsPdf = useMemo(() => (fileUrl ? isPdfAttachmentUrl(fileUrl) : false), [fileUrl]);

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground">{sectionLabel}</p>
      {!hasFile && <p className="text-sm">{emptyLabel}</p>}

      {hasFile && fileUrl && (
        <>
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="w-full rounded-md border p-2 bg-muted/30 hover:bg-muted/50 transition text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Clique para ampliar</span>
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
            {fileIsImage ? (
              <img
                src={fileUrl}
                alt="Pré-visualização do anexo"
                className={`w-full ${previewClassName} object-contain rounded`}
              />
            ) : (
              <div
                className={`flex items-center justify-center ${previewClassName} rounded border bg-background`}
              >
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </button>

          <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
            <DialogContent className="w-[96vw] max-w-5xl max-h-[92vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>{zoomTitle}</DialogTitle>
                <DialogDescription>{zoomDescription}</DialogDescription>
              </DialogHeader>
              <div className="h-[72vh] md:h-[78vh] rounded border overflow-hidden bg-black/5">
                {fileIsImage ? (
                  <img src={fileUrl} alt="Anexo ampliado" className="w-full h-full object-contain" />
                ) : fileIsPdf ? (
                  <iframe src={fileUrl} title="Anexo em PDF" className="w-full h-full" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Pré-visualização não disponível para este tipo de arquivo.
                    </p>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary underline"
                    >
                      Abrir em nova aba
                    </a>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
