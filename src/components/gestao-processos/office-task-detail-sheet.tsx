"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type { OfficeTask } from "@/lib/gestao-processos/task-types";
import {
  OFFICE_TASK_CATEGORIA_LABELS,
  OFFICE_TASK_STATUS_LABELS,
} from "@/lib/gestao-processos/task-types";
import {
  formatOfficeTaskPrazo,
  isOfficeTaskOverdue,
} from "@/lib/gestao-processos/task-utils";
import { OFFICE_PROCESS_PRIORIDADE_LABELS } from "@/components/gestao-processos/process-form-dialog";
import {
  GESTAO_PROCESSOS_TAREFAS_PATH,
  gestaoProcessosDetailPath,
  gestaoProcessosProjetoDetailPath,
} from "@/lib/gestao-processos-menu";
import { consultoriaProjectLabel } from "@/lib/gestao-processos/consultoria-project-utils";
import type { ConsultoriaProject, OfficeProcess } from "@/lib/gestao-processos/types";
import type { Empreendedor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2, Pencil, Trash2 } from "lucide-react";

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm whitespace-pre-wrap">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

type OfficeTaskDetailSheetProps = {
  task: OfficeTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
  currentUid?: string | null;
  empreendedoresById?: ReadonlyMap<string, Empreendedor>;
  consultoriaProjects?: ConsultoriaProject[];
  officeProcesses?: OfficeProcess[];
  saving?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssume?: () => void;
  onStatusChange?: (status: OfficeTask["status"]) => void;
  onComplete?: (nota: string) => void;
};

export function OfficeTaskDetailSheet({
  task,
  open,
  onOpenChange,
  canWrite,
  currentUid,
  empreendedoresById,
  consultoriaProjects = [],
  officeProcesses = [],
  saving,
  onEdit,
  onDelete,
  onAssume,
  onStatusChange,
  onComplete,
}: OfficeTaskDetailSheetProps) {
  const [conclusaoNota, setConclusaoNota] = React.useState("");
  const [showComplete, setShowComplete] = React.useState(false);

  React.useEffect(() => {
    if (open && task) {
      setConclusaoNota(task.conclusaoNota ?? "");
      setShowComplete(false);
    }
  }, [open, task]);

  if (!task) return null;

  const overdue = isOfficeTaskOverdue(task);
  const project = consultoriaProjects.find((p) => p.id === task.consultoriaProjectId);
  const process = officeProcesses.find((p) => p.id === task.officeProcessId);
  const empreendedor = task.empreendedorId
    ? empreendedoresById?.get(task.empreendedorId)
    : undefined;
  const isActive =
    task.status !== "concluida" && task.status !== "cancelada";
  const canAssume =
    canWrite &&
    isActive &&
    !task.assigneeUid &&
    currentUid;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="pr-8 leading-snug">{task.titulo}</SheetTitle>
          <SheetDescription className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {OFFICE_TASK_CATEGORIA_LABELS[task.categoria]}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                task.status === "concluida" && "bg-emerald-500/10",
                task.status === "cancelada" && "bg-slate-500/10",
                task.status === "em_andamento" && "bg-blue-500/10",
                overdue && "border-red-500/40 text-red-700",
              )}
            >
              {OFFICE_TASK_STATUS_LABELS[task.status]}
            </Badge>
            {task.prioridade ? (
              <Badge variant="secondary">
                {OFFICE_PROCESS_PRIORIDADE_LABELS[task.prioridade]}
              </Badge>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <DetailField label="O que foi pedido" value={task.descricao} />
          <DetailField
            label="Prazo"
            value={formatOfficeTaskPrazo(task.prazo)}
          />
          <DetailField label="Responsável" value={task.assigneeName} />
          <DetailField label="Pedido por" value={task.createdByName} />

          {empreendedor ? (
            <DetailField label="Empreendedor" value={empreendedor.name} />
          ) : null}

          {project ? (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Projeto</Label>
              <Link
                href={gestaoProcessosProjetoDetailPath(project.id)}
                className="text-sm text-primary hover:underline"
              >
                {consultoriaProjectLabel(project.id, consultoriaProjects) ?? project.name}
              </Link>
            </div>
          ) : null}

          {process ? (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Processo</Label>
              <Link
                href={gestaoProcessosDetailPath(process.id)}
                className="text-sm text-primary hover:underline"
              >
                {process.numeroProcesso}
              </Link>
            </div>
          ) : null}

          {task.conclusaoNota ? (
            <DetailField label="Nota de conclusão" value={task.conclusaoNota} />
          ) : null}

          {isActive && canWrite ? (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {canAssume ? (
                  <Button size="sm" variant="secondary" disabled={saving} onClick={onAssume}>
                    Assumir tarefa
                  </Button>
                ) : null}
                {task.status === "pendente" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => onStatusChange?.("em_andamento")}
                  >
                    Em andamento
                  </Button>
                ) : null}
                {task.status === "em_andamento" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => onStatusChange?.("aguardando")}
                  >
                    Aguardando
                  </Button>
                ) : null}
                {task.status === "aguardando" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => onStatusChange?.("em_andamento")}
                  >
                    Retomar
                  </Button>
                ) : null}
                {!showComplete ? (
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={() => setShowComplete(true)}
                  >
                    Concluir
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={saving}
                  onClick={() => onStatusChange?.("cancelada")}
                >
                  Cancelar
                </Button>
              </div>

              {showComplete ? (
                <div className="space-y-2 rounded-md border p-3">
                  <Label htmlFor="conclusao-nota">Nota de conclusão</Label>
                  <Textarea
                    id="conclusao-nota"
                    value={conclusaoNota}
                    onChange={(e) => setConclusaoNota(e.target.value)}
                    placeholder="O que foi feito?"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() => onComplete?.(conclusaoNota)}
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Confirmar conclusão
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowComplete(false)}
                    >
                      Voltar
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {canWrite ? (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={saving}
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </>
          ) : null}

          <p className="text-xs text-muted-foreground">
            <Link href={GESTAO_PROCESSOS_TAREFAS_PATH} className="hover:underline">
              Ver todas as tarefas
            </Link>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
