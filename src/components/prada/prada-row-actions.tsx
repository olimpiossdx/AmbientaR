'use client';

import { Eye, Pencil, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Prada } from '@/lib/types';
import { PradaExportIconButtons } from '@/components/prada/prada-export-icon-buttons';

type PradaRowActionsProps = {
  item: Prada;
  onView: (item: Prada) => void;
  onEdit: (item: Prada) => void;
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  showApprove?: boolean;
};

export function PradaRowActions({
  item,
  onView,
  onEdit,
  onApprove,
  onDelete,
  canDelete = false,
  showApprove = false,
}: PradaRowActionsProps) {
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
          <p>Editar PRADA</p>
        </TooltipContent>
      </Tooltip>
      <PradaExportIconButtons prada={item} />
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
            <p>Aprovar PRADA</p>
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
            <p>Excluir PRADA</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
