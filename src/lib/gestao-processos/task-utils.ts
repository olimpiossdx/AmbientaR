import { daysUntilIsoDate } from "@/lib/client-deadline-alerts";
import type {
  OfficeTask,
  OfficeTaskFilterTab,
  OfficeTaskStatus,
} from "@/lib/gestao-processos/task-types";
import { OFFICE_TASK_ACTIVE_STATUSES } from "@/lib/gestao-processos/task-types";

export function isOfficeTaskActive(status: OfficeTaskStatus): boolean {
  return OFFICE_TASK_ACTIVE_STATUSES.includes(status);
}

export function isOfficeTaskOverdue(task: OfficeTask): boolean {
  if (!isOfficeTaskActive(task.status) || !task.prazo) return false;
  const dias = daysUntilIsoDate(task.prazo);
  return dias !== null && dias < 0;
}

export function isOfficeTaskDueToday(task: OfficeTask): boolean {
  if (!isOfficeTaskActive(task.status) || !task.prazo) return false;
  const dias = daysUntilIsoDate(task.prazo);
  return dias === 0;
}

export function formatOfficeTaskPrazo(prazo?: string | null): string {
  if (!prazo?.trim()) return "—";
  const dias = daysUntilIsoDate(prazo);
  const formatted = new Date(`${prazo}T12:00:00`).toLocaleDateString("pt-BR");
  if (dias === null) return formatted;
  if (dias < 0) return `${formatted} (atrasada ${Math.abs(dias)} dia(s))`;
  if (dias === 0) return `${formatted} (hoje)`;
  if (dias === 1) return `${formatted} (amanhã)`;
  return `${formatted} (${dias} dia(s))`;
}

export function officeTaskSearchBlob(task: OfficeTask): string {
  return [
    task.titulo,
    task.descricao,
    task.assigneeName,
    task.createdByName,
    task.categoria,
    task.status,
    task.conclusaoNota,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function sortOfficeTasksByPrazo(tasks: OfficeTask[]): OfficeTask[] {
  return [...tasks].sort((a, b) => {
    const aDone = a.status === "concluida" || a.status === "cancelada";
    const bDone = b.status === "concluida" || b.status === "cancelada";
    if (aDone !== bDone) return aDone ? 1 : -1;

    const aPrazo = a.prazo ?? "9999-12-31";
    const bPrazo = b.prazo ?? "9999-12-31";
    if (aPrazo !== bPrazo) return aPrazo.localeCompare(bPrazo);

    const aPri = priorityWeight(a.prioridade);
    const bPri = priorityWeight(b.prioridade);
    if (aPri !== bPri) return bPri - aPri;

    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });
}

function priorityWeight(prioridade?: OfficeTask["prioridade"]): number {
  if (prioridade === "alta") return 3;
  if (prioridade === "media") return 2;
  if (prioridade === "baixa") return 1;
  return 0;
}

export function filterOfficeTasksByTab(
  tasks: OfficeTask[],
  tab: OfficeTaskFilterTab,
  currentUid?: string | null,
): OfficeTask[] {
  switch (tab) {
    case "minhas":
      return tasks.filter(
        (t) =>
          currentUid &&
          t.assigneeUid === currentUid &&
          isOfficeTaskActive(t.status),
      );
    case "atrasadas":
      return tasks.filter((t) => isOfficeTaskOverdue(t));
    case "hoje":
      return tasks.filter((t) => isOfficeTaskDueToday(t));
    case "concluidas":
      return tasks.filter(
        (t) => t.status === "concluida" || t.status === "cancelada",
      );
  }
  return tasks.filter((t) => isOfficeTaskActive(t.status));
}

export function countOfficeTasksForUser(
  tasks: OfficeTask[],
  uid?: string | null,
): { mine: number; overdue: number; today: number } {
  const active = tasks.filter((t) => isOfficeTaskActive(t.status));
  return {
    mine: uid
      ? active.filter((t) => t.assigneeUid === uid).length
      : 0,
    overdue: active.filter((t) => isOfficeTaskOverdue(t)).length,
    today: active.filter((t) => isOfficeTaskDueToday(t)).length,
  };
}
