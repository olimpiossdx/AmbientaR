'use client';

import { Eye, Pencil, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DocxTemplateSlug } from '@/lib/docx-template-slugs';
import {
  STUDY_DOCUMENT_TYPE_LABEL,
  type StudyExportRecord,
} from '@/lib/studies/study-export-record';
import { StudyBrandedExportButtons } from '@/components/studies/study-branded-export-buttons';

type StudyDocumentRowActionsProps<T extends StudyExportRecord> = {
  item: T;
  templateSlug: DocxTemplateSlug;
  onView: (item: T) => void;
  onEdit: (item: T) => void;
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  showApprove?: boolean;
  showEdit?: boolean;
};

export function StudyDocumentRowActions<T extends StudyExportRecord>({
  item,
  templateSlug,
  onView,
  onEdit,
  onApprove,
  onDelete,
  canDelete = false,
  showApprove = false,
  showEdit = true,
}: StudyDocumentRowActionsProps<T>) {
  const label = STUDY_DOCUMENT_TYPE_LABEL[templateSlug] ?? 'documento';

  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            type="button"
            onClick={() => onView(item)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Visualizar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Visualizar detalhes</p>
        </TooltipContent>
      </Tooltip>
      {showEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              type="button"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Editar {label}</p>
          </TooltipContent>
        </Tooltip>
      )}
      <StudyBrandedExportButtons record={item} templateSlug={templateSlug} />
      {showApprove && onApprove && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              type="button"
              onClick={() => onApprove(item.id)}
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="sr-only">Aprovar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Aprovar {label}</p>
          </TooltipContent>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                type="button"
                disabled={!canDelete}
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Excluir</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Excluir {label}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
