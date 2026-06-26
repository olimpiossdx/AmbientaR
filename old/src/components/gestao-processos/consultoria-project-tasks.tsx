"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GESTAO_PROCESSOS_TAREFAS_PATH } from "@/lib/gestao-processos-menu";
import { OfficeLinkedTasks } from "@/components/gestao-processos/office-linked-tasks";

type ConsultoriaProjectTasksProps = {
  consultoriaProjectId: string;
  canWrite: boolean;
  onNewTask?: () => void;
};

export function ConsultoriaProjectTasks({
  consultoriaProjectId,
  canWrite,
  onNewTask,
}: ConsultoriaProjectTasksProps) {
  const filter = React.useCallback(
    (task: { consultoriaProjectId?: string }) =>
      task.consultoriaProjectId === consultoriaProjectId,
    [consultoriaProjectId],
  );

  return (
    <Card>
      <CardHeader className="sr-only">
        <CardTitle>Tarefas do projeto</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        <OfficeLinkedTasks
          title="Tarefas do projeto"
          emptyMessage="Nenhuma tarefa avulsa ligada a este projeto."
          viewAllHref={`${GESTAO_PROCESSOS_TAREFAS_PATH}?projeto=${encodeURIComponent(consultoriaProjectId)}`}
          filter={filter}
          canWrite={canWrite}
          onNewTask={onNewTask}
        />
      </CardContent>
    </Card>
  );
}
