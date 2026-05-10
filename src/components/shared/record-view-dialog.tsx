'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { AttachmentPreviewSection } from '@/components/shared/attachment-preview-section';

export type RecordViewDialogProps = {
  title: string;
  description?: string;
  /** Conteúdo somente leitura (campos) */
  children: ReactNode;
  /** URL do anexo opcional */
  fileUrl?: string | null;
  /** Se false, não renderiza o bloco de anexo (útil quando o pai gere o preview). Default: true */
  includeAttachmentSection?: boolean;
  labels?: {
    attachmentSection?: string;
    attachmentEmpty?: string;
    zoomTitle?: string;
    zoomDescription?: string;
  };
  /** Texto acessível do botão */
  triggerLabel?: string;
  contentClassName?: string;
};

export function RecordViewDialog({
  title,
  description = 'Consulte os dados sem editar.',
  children,
  fileUrl,
  includeAttachmentSection = true,
  labels,
  triggerLabel = 'Visualizar',
  contentClassName = 'w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto',
}: RecordViewDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Eye className="h-4 w-4" />
        <span className="sr-only">{triggerLabel}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={contentClassName}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            {children}
            {includeAttachmentSection && (
              <AttachmentPreviewSection
                fileUrl={fileUrl}
                sectionLabel={labels?.attachmentSection}
                emptyLabel={labels?.attachmentEmpty}
                zoomTitle={labels?.zoomTitle}
                zoomDescription={labels?.zoomDescription}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
