"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { OfficeTask } from "@/lib/gestao-processos/task-types";
import { OFFICE_TASK_STATUS_LABELS } from "@/lib/gestao-processos/task-types";
import {
  formatOfficeTaskPrazo,
  isOfficeTaskOverdue,
  sortOfficeTasksByPrazo,
} from "@/lib/gestao-processos/task-utils";
import { GESTAO_PROCESSOS_TAREFAS_PATH } from "@/lib/gestao-processos-menu";
import { cn } from "@/lib/utils";
import { ListTodo, PlusCircle } from "lucide-react";

type OfficeLinkedTasksProps = {
  title: string;
  emptyMessage: string;
  viewAllHref: string;
  filter: (task: OfficeTask) => boolean;
  canWrite: boolean;
  onNewTask?: () => void;
  compact?: boolean;
  maxItems?: number;
};

export function OfficeLinkedTasks({
  title,
  emptyMessage,
  viewAllHref,
  filter,
  canWrite,
  onNewTask,
  compact = false,
  maxItems = 12,
}: OfficeLinkedTasksProps) {
  const { firestore } = useFirebase();

  const tasksQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "officeTasks") : null),
    [firestore],
  );
  const { data: allTasks } = useCollection<OfficeTask>(tasksQuery);

  const linkedTasks = React.useMemo(() => {
    const linked = (allTasks ?? []).filter(filter);
    return sortOfficeTasksByPrazo(linked).slice(0, maxItems);
  }, [allTasks, filter, maxItems]);

  const activeCount = linkedTasks.filter(
    (t) => t.status !== "concluida" && t.status !== "cancelada",
  ).length;

  return (
    <div className={cn("space-y-3", !compact && "rounded-lg border p-4")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          {title}
          {activeCount > 0 ? (
            <Badge variant="secondary" className="font-normal">
              {activeCount} ativa(s)
            </Badge>
          ) : null}
        </div>
        {canWrite && onNewTask ? (
          <Button size="sm" variant="outline" onClick={onNewTask}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova tarefa
          </Button>
        ) : null}
      </div>

      {linkedTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {linkedTasks.map((task) => (
            <li key={task.id}>
              <Link
                href={`${GESTAO_PROCESSOS_TAREFAS_PATH}?tarefa=${encodeURIComponent(task.id)}`}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-muted/50",
                  isOfficeTaskOverdue(task) && "border-red-500/30 bg-red-500/5",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{task.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.assigneeName ?? "Sem responsável"}
                    {task.prazo ? ` · ${formatOfficeTaskPrazo(task.prazo)}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {OFFICE_TASK_STATUS_LABELS[task.status]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {linkedTasks.length > 0 ? (
        <Button variant="link" className="h-auto px-0" asChild>
          <Link href={viewAllHref}>Ver todas as tarefas</Link>
        </Button>
      ) : null}
    </div>
  );
}
