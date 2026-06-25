"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebase } from "@/firebase";
import { useOfficeTasksCollection } from "@/lib/gestao-processos/use-office-tasks-collection";
import type { OfficeTask } from "@/lib/gestao-processos/task-types";
import { OFFICE_TASK_STATUS_LABELS } from "@/lib/gestao-processos/task-types";
import {
  filterOfficeTasksByTab,
  filterOfficeTasksVisibleToUser,
  formatOfficeTaskPrazo,
  isOfficeTaskOverdue,
  sortOfficeTasksByPrazo,
} from "@/lib/gestao-processos/task-utils";
import {
  GESTAO_PROCESSOS_TAREFAS_PATH,
} from "@/lib/gestao-processos-menu";
import { canAccessOfficeTasks, canSeeAllOfficeTasks } from "@/lib/gestao-processos/role-guards";
import { cn } from "@/lib/utils";
import { ChevronRight, ListTodo } from "lucide-react";

const MAX_ITEMS = 8;

export default function OfficeTasksWidget() {
  const { firestore, user } = useFirebase();
  const canAccess = canAccessOfficeTasks(user?.role);

  const { data: tasks, isLoading } = useOfficeTasksCollection(
    Boolean(firestore && canAccess),
    user?.uid,
    canSeeAllOfficeTasks(user?.role),
  );

  const canSeeAll = canSeeAllOfficeTasks(user?.role);

  const myTasks = React.useMemo(() => {
    const visible = filterOfficeTasksVisibleToUser(tasks ?? [], user?.uid, canSeeAll);
    const mine = filterOfficeTasksByTab(visible, "minhas", user?.uid);
    return sortOfficeTasksByPrazo(mine).slice(0, MAX_ITEMS);
  }, [tasks, user?.uid, canSeeAll]);

  const overdueCount = React.useMemo(() => {
    const visible = filterOfficeTasksVisibleToUser(tasks ?? [], user?.uid, canSeeAll);
    const mine = filterOfficeTasksByTab(visible, "minhas", user?.uid);
    return mine.filter((t) => isOfficeTaskOverdue(t)).length;
  }, [tasks, user?.uid, canSeeAll]);

  if (!canAccess) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            Minhas tarefas
          </CardTitle>
          <CardDescription>
            Demandas avulsas atribuídas a você
            {overdueCount > 0 ? (
              <span className="ml-1 font-medium text-red-600">
                · {overdueCount} atrasada(s)
              </span>
            ) : null}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={GESTAO_PROCESSOS_TAREFAS_PATH} className="gap-1">
            Ver todas
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : myTasks.length > 0 ? (
          <ul className="space-y-3">
            {myTasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`${GESTAO_PROCESSOS_TAREFAS_PATH}?tarefa=${encodeURIComponent(task.id)}`}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-md p-2 transition-colors hover:bg-muted/50",
                    isOfficeTaskOverdue(task) && "border border-red-500/30 bg-red-500/5",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.titulo}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatOfficeTaskPrazo(task.prazo)}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {OFFICE_TASK_STATUS_LABELS[task.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma tarefa ativa atribuída a você.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
