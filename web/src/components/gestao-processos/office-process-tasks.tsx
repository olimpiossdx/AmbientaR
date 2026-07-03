"use client";

import * as React from "react";
import { GESTAO_PROCESSOS_TAREFAS_PATH } from "@/lib/gestao-processos-menu";
import { OfficeLinkedTasks } from "@/components/gestao-processos/office-linked-tasks";

type OfficeProcessTasksProps = {
  officeProcessId: string;
  canWrite: boolean;
  onNewTask?: () => void;
  compact?: boolean;
};

export function OfficeProcessTasks({
  officeProcessId,
  canWrite,
  onNewTask,
  compact = true,
}: OfficeProcessTasksProps) {
  const filter = React.useCallback(
    (task: { officeProcessId?: string }) => task.officeProcessId === officeProcessId,
    [officeProcessId],
  );

  return (
    <OfficeLinkedTasks
      title="Tarefas do processo"
      emptyMessage="Nenhuma tarefa avulsa ligada a este processo."
      viewAllHref={`${GESTAO_PROCESSOS_TAREFAS_PATH}?processo=${encodeURIComponent(officeProcessId)}`}
      filter={filter}
      canWrite={canWrite}
      onNewTask={onNewTask}
      compact={compact}
    />
  );
}
