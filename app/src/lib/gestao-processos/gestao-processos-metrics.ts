import type { AppUser } from "@/lib/types";
import { getRoleLabelPt } from "@/lib/user-role-labels";
import { computeFluxoKpiStats } from "@/lib/gestao-processos/pipeline-utils";
import { isPrazoVencido } from "@/lib/gestao-processos/pipeline-utils";
import type { ConsultoriaProject, OfficeProcess } from "@/lib/gestao-processos/types";
import type { OfficeTask } from "@/lib/gestao-processos/task-types";
import {
  isOfficeTaskActive,
  isOfficeTaskCompletedOnTime,
  isOfficeTaskOverdue,
  isOfficeTaskOrganizacaoPessoal,
} from "@/lib/gestao-processos/task-utils";

export type OfficeTaskDeadlineMetrics = {
  ativas: number;
  atrasadas: number;
  concluidas: number;
  concluidasNoPrazo: number;
  concluidasForaPrazo: number;
  pessoais: number;
  atribuidas: number;
};

export type OfficeTaskAssigneeRow = {
  uid: string;
  name: string;
  roleLabel: string;
  ativas: number;
  atrasadas: number;
  concluidas: number;
  concluidasNoPrazo: number;
  pctNoPrazo: number | null;
};

export type GestaoProcessosOverview = {
  tasks: OfficeTaskDeadlineMetrics;
  processes: ReturnType<typeof computeFluxoKpiStats>;
  projects: {
    total: number;
    comProcessosAtrasados: number;
  };
  taskRowsByAssignee: OfficeTaskAssigneeRow[];
  overdueProcesses: Array<{
    id: string;
    numeroProcesso: string;
    tipoProcesso: string;
    empreendedorName: string;
    prazo?: string;
  }>;
};

export function computeOfficeTaskDeadlineMetrics(
  tasks: OfficeTask[],
): OfficeTaskDeadlineMetrics {
  let ativas = 0;
  let atrasadas = 0;
  let concluidas = 0;
  let concluidasNoPrazo = 0;
  let concluidasForaPrazo = 0;
  let pessoais = 0;
  let atribuidas = 0;

  for (const task of tasks) {
    if (isOfficeTaskOrganizacaoPessoal(task)) pessoais++;
    else atribuidas++;

    if (isOfficeTaskActive(task.status)) {
      ativas++;
      if (isOfficeTaskOverdue(task)) atrasadas++;
    } else if (task.status === "concluida") {
      concluidas++;
      const onTime = isOfficeTaskCompletedOnTime(task);
      if (onTime === true) concluidasNoPrazo++;
      else if (onTime === false) concluidasForaPrazo++;
    }
  }

  return {
    ativas,
    atrasadas,
    concluidas,
    concluidasNoPrazo,
    concluidasForaPrazo,
    pessoais,
    atribuidas,
  };
}

export function computeOfficeTaskRowsByAssignee(
  tasks: OfficeTask[],
  usersByUid: ReadonlyMap<string, AppUser>,
): OfficeTaskAssigneeRow[] {
  const byUid = new Map<string, OfficeTaskAssigneeRow>();

  const ensure = (uid: string) => {
    let row = byUid.get(uid);
    if (!row) {
      const u = usersByUid.get(uid);
      row = {
        uid,
        name: u?.name || u?.email || uid,
        roleLabel: getRoleLabelPt(u?.role),
        ativas: 0,
        atrasadas: 0,
        concluidas: 0,
        concluidasNoPrazo: 0,
        pctNoPrazo: null,
      };
      byUid.set(uid, row);
    }
    return row;
  };

  for (const task of tasks) {
    const uid = task.assigneeUid ?? task.createdByUid;
    if (!uid) continue;
    const row = ensure(uid);
    if (isOfficeTaskActive(task.status)) {
      row.ativas++;
      if (isOfficeTaskOverdue(task)) row.atrasadas++;
    } else if (task.status === "concluida") {
      row.concluidas++;
      if (isOfficeTaskCompletedOnTime(task) === true) row.concluidasNoPrazo++;
    }
  }

  return [...byUid.values()]
    .map((row) => ({
      ...row,
      pctNoPrazo:
        row.concluidas > 0
          ? Math.round((row.concluidasNoPrazo / row.concluidas) * 100)
          : null,
    }))
    .sort((a, b) => b.atrasadas - a.atrasadas || b.ativas - a.ativas);
}

export function computeGestaoProcessosOverview(
  tasks: OfficeTask[],
  processes: OfficeProcess[],
  projects: ConsultoriaProject[],
  usersByUid: ReadonlyMap<string, AppUser>,
): GestaoProcessosOverview {
  const processKpis = computeFluxoKpiStats(processes);

  const processIdsByProject = new Map<string, string[]>();
  for (const p of processes) {
    if (!p.consultoriaProjectId) continue;
    const list = processIdsByProject.get(p.consultoriaProjectId) ?? [];
    list.push(p.id);
    processIdsByProject.set(p.consultoriaProjectId, list);
  }

  let comProcessosAtrasados = 0;
  for (const project of projects) {
    const linked = processes.filter((p) => p.consultoriaProjectId === project.id);
    if (linked.some((p) => isPrazoVencido(p.prazo))) comProcessosAtrasados++;
  }

  const overdueProcesses = processes
    .filter((p) => isPrazoVencido(p.prazo) && p.fase !== "concluido" && p.fase !== "arquivado")
    .slice(0, 20)
    .map((p) => ({
      id: p.id,
      numeroProcesso: p.numeroProcesso,
      tipoProcesso: p.tipoProcesso.toUpperCase(),
      empreendedorName: p.empreendedorName,
      prazo: p.prazo,
    }));

  return {
    tasks: computeOfficeTaskDeadlineMetrics(tasks),
    processes: processKpis,
    projects: {
      total: projects.length,
      comProcessosAtrasados,
    },
    taskRowsByAssignee: computeOfficeTaskRowsByAssignee(tasks, usersByUid),
    overdueProcesses,
  };
}
