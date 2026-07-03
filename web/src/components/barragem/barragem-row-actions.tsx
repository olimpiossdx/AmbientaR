'use client';

import { Eye, Pencil, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ProjetoTecnicoBarragem } from '@/lib/types';
import { BarragemExportIconButtons } from '@/components/barragem/barragem-export-icon-buttons';

type BarragemRowActionsProps = {
  item: ProjetoTecnicoBarragem;
  onView: (item: ProjetoTecnicoBarragem) => void;
  onEdit: (item: ProjetoTecnicoBarragem) => void;
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  showApprove?: boolean;
};

export function BarragemRowActions({
  item,
  onView,
  onEdit,
  onApprove,
  onDelete,
  canDelete = false,
  showApprove = false,
}: BarragemRowActionsProps) {
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
          <p>Editar projeto</p>
        </TooltipContent>
      </Tooltip>
      <BarragemExportIconButtons projeto={item} />
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
            <p>Aprovar projeto</p>
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
            <p>Excluir projeto</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
