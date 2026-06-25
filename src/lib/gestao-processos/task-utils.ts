import { daysUntilIsoDate } from "@/lib/client-deadline-alerts";
import type { AppUser, Empreendedor } from "@/lib/types";
import { getRoleLabelPt } from "@/lib/user-role-labels";
import type { ConsultoriaProject, OfficeProcess } from "@/lib/gestao-processos/types";
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

export function resolveOfficeTaskDemandanteUid(task: OfficeTask): string | undefined {
  return task.demandanteUid ?? task.createdByUid;
}

export function isOfficeTaskOrganizacaoPessoal(task: OfficeTask): boolean {
  if (task.isOrganizacaoPessoal === true) return true;
  if (task.isOrganizacaoPessoal === false) return false;
  const demandante = resolveOfficeTaskDemandanteUid(task);
  return Boolean(
    demandante &&
      task.assigneeUid &&
      demandante === task.assigneeUid &&
      demandante === task.createdByUid,
  );
}

export function officeTaskVisibleToUser(
  task: OfficeTask,
  uid: string | undefined | null,
  canSeeAll: boolean,
): boolean {
  if (canSeeAll) return true;
  if (!uid) return false;
  const demandanteUid = resolveOfficeTaskDemandanteUid(task);
  return (
    task.assigneeUid === uid ||
    task.createdByUid === uid ||
    demandanteUid === uid
  );
}

export function filterOfficeTasksVisibleToUser(
  tasks: OfficeTask[],
  uid: string | undefined | null,
  canSeeAll: boolean,
): OfficeTask[] {
  if (canSeeAll) return tasks;
  return tasks.filter((t) => officeTaskVisibleToUser(t, uid, false));
}

export type OfficeTaskUserRef = {
  name: string;
  roleLabel: string;
};

export type OfficeTaskDisplayFields = {
  seiSlaAvulso: { kind: "avulso" } | { kind: "processo"; tipo: string; numero: string };
  empreendedorName: string;
  empreendimentoName: string;
  demandante: OfficeTaskUserRef | null;
  responsavel: OfficeTaskUserRef | null;
  isPessoal: boolean;
};

export function formatOfficeTaskUserRef(ref: OfficeTaskUserRef | null): string {
  if (!ref) return "—";
  return `${ref.name} · ${ref.roleLabel}`;
}

function resolveUserRef(
  uid: string | undefined,
  usersByUid: ReadonlyMap<string, AppUser>,
): OfficeTaskUserRef | null {
  if (!uid) return null;
  const u = usersByUid.get(uid);
  if (!u) return { name: uid, roleLabel: "" };
  return {
    name: u.name || u.email || uid,
    roleLabel: getRoleLabelPt(u.role),
  };
}

export function resolveOfficeTaskDisplayFields(
  task: OfficeTask,
  ctx: {
    usersByUid: ReadonlyMap<string, AppUser>;
    empreendedoresById: ReadonlyMap<string, Empreendedor>;
    projectsById: ReadonlyMap<string, ConsultoriaProject>;
    processesById: ReadonlyMap<string, OfficeProcess>;
  },
): OfficeTaskDisplayFields {
  const process = task.officeProcessId
    ? ctx.processesById.get(task.officeProcessId)
    : undefined;
  const project = task.consultoriaProjectId
    ? ctx.projectsById.get(task.consultoriaProjectId)
    : undefined;
  const empreendedor = task.empreendedorId
    ? ctx.empreendedoresById.get(task.empreendedorId)
    : undefined;

  const empreendedorName =
    empreendedor?.name?.trim() ||
    process?.empreendedorName?.trim() ||
    project?.empreendedorName?.trim() ||
    "—";

  const empreendimentoName =
    process?.empreendimentoName?.trim() ||
    project?.empreendimentoName?.trim() ||
    "—";

  const seiSlaAvulso: OfficeTaskDisplayFields["seiSlaAvulso"] = process
    ? {
        kind: "processo",
        tipo: process.tipoProcesso.toUpperCase(),
        numero: process.numeroProcesso,
      }
    : { kind: "avulso" };

  return {
    seiSlaAvulso,
    empreendedorName,
    empreendimentoName,
    demandante: resolveUserRef(resolveOfficeTaskDemandanteUid(task), ctx.usersByUid),
    responsavel: resolveUserRef(task.assigneeUid, ctx.usersByUid),
    isPessoal: isOfficeTaskOrganizacaoPessoal(task),
  };
}

export function officeTaskSearchBlob(
  task: OfficeTask,
  display?: OfficeTaskDisplayFields,
): string {
  return [
    task.titulo,
    task.descricao,
    task.assigneeName,
    task.demandanteName,
    task.createdByName,
    task.categoria,
    task.status,
    task.conclusaoNota,
    display?.empreendedorName,
    display?.empreendimentoName,
    display?.seiSlaAvulso.kind === "processo"
      ? `${display.seiSlaAvulso.tipo} ${display.seiSlaAvulso.numero}`
      : "avulso",
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

export function isOfficeTaskCompletedOnTime(task: OfficeTask): boolean | null {
  if (task.status !== "concluida" || !task.prazo || !task.concluidaEm) return null;
  return task.concluidaEm <= task.prazo;
}
