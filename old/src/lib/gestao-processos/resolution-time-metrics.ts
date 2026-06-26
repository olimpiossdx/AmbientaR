import {
  inferPlannedProcessType,
  plannedProcessTypeLabel,
} from "@/lib/gestao-processos/consultoria-project-utils";
import {
  OFFICE_TASK_CATEGORIA_LABELS,
  type OfficeTask,
} from "@/lib/gestao-processos/task-types";
import type {
  ConsultoriaProject,
  ConsultoriaProjectPlannedProcessType,
  OfficeProcess,
} from "@/lib/gestao-processos/types";

export type ResolutionBucket = {
  key: string;
  label: string;
  count: number;
  avgDays: number | null;
  medianDays: number | null;
  minDays: number | null;
  maxDays: number | null;
};

export function firestoreToDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value !== null) {
    if (
      "toDate" in value &&
      typeof (value as { toDate: () => Date }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate();
    }
    if (
      "toMillis" in value &&
      typeof (value as { toMillis: () => number }).toMillis === "function"
    ) {
      return new Date((value as { toMillis: () => number }).toMillis());
    }
    if ("seconds" in value && typeof (value as { seconds: number }).seconds === "number") {
      return new Date((value as { seconds: number }).seconds * 1000);
    }
  }
  return null;
}

export function isoDateToDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Dias de calendário entre duas datas (fim − início). */
export function diffCalendarDays(start: Date, end: Date): number {
  const s = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const e = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((e - s) / (24 * 60 * 60 * 1000));
}

function aggregateDays(days: number[], key: string, label: string): ResolutionBucket {
  if (days.length === 0) {
    return {
      key,
      label,
      count: 0,
      avgDays: null,
      medianDays: null,
      minDays: null,
      maxDays: null,
    };
  }
  const sorted = [...days].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, n) => acc + n, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1]! + sorted[mid]!) / 2
      : sorted[mid]!;

  return {
    key,
    label,
    count: days.length,
    avgDays: Math.round((sum / days.length) * 10) / 10,
    medianDays: Math.round(median * 10) / 10,
    minDays: sorted[0]!,
    maxDays: sorted[sorted.length - 1]!,
  };
}

function buildBuckets(
  items: { key: string; label: string; days: number }[],
  generalLabel = "Geral",
): ResolutionBucket[] {
  const byKey = new Map<string, { label: string; days: number[] }>();
  const allDays: number[] = [];

  for (const item of items) {
    allDays.push(item.days);
    const entry = byKey.get(item.key) ?? { label: item.label, days: [] };
    entry.days.push(item.days);
    byKey.set(item.key, entry);
  }

  const buckets = [...byKey.entries()]
    .map(([key, { label, days }]) => aggregateDays(days, key, label))
    .sort((a, b) => (b.avgDays ?? 0) - (a.avgDays ?? 0));

  if (allDays.length > 0) {
    return [aggregateDays(allDays, "_geral", generalLabel), ...buckets];
  }
  return buckets;
}

function generalBucket(buckets: ResolutionBucket[]): ResolutionBucket | undefined {
  return buckets.find((b) => b.key === "_geral");
}

export type TaskResolutionMetrics = {
  creationToCompletion: ResolutionBucket[];
};

export function computeTaskResolutionMetrics(tasks: OfficeTask[]): TaskResolutionMetrics {
  const items: { key: string; label: string; days: number }[] = [];

  for (const task of tasks) {
    if (task.status !== "concluida" || !task.concluidaEm) continue;
    const start = firestoreToDate(task.createdAt);
    const end = isoDateToDate(task.concluidaEm);
    if (!start || !end) continue;
    const days = diffCalendarDays(start, end);
    if (days < 0) continue;
    items.push({
      key: task.categoria,
      label: OFFICE_TASK_CATEGORIA_LABELS[task.categoria],
      days,
    });
  }

  return { creationToCompletion: buildBuckets(items) };
}

function isProcessClosed(process: OfficeProcess): boolean {
  return process.fase === "concluido" || process.fase === "arquivado";
}

export type ProcessResolutionSeries = {
  creationToProtocol: ResolutionBucket[];
  protocolToCompletion: ResolutionBucket[];
  creationToCompletion: ResolutionBucket[];
};

export function computeProcessResolutionMetrics(
  processes: OfficeProcess[],
): ProcessResolutionSeries {
  const toProtocol: { key: string; label: string; days: number }[] = [];
  const protocolToEnd: { key: string; label: string; days: number }[] = [];
  const creationToEnd: { key: string; label: string; days: number }[] = [];

  for (const process of processes) {
    const created = firestoreToDate(process.createdAt);
    if (!created) continue;

    const typeKey = inferPlannedProcessType(process);
    const label = plannedProcessTypeLabel(typeKey);

    if (process.dataProtocolo) {
      const protocol = isoDateToDate(process.dataProtocolo);
      if (protocol) {
        const days = diffCalendarDays(created, protocol);
        if (days >= 0) toProtocol.push({ key: typeKey, label, days });
      }
    }

    if (isProcessClosed(process)) {
      const end = firestoreToDate(process.updatedAt);
      if (!end) continue;

      const totalDays = diffCalendarDays(created, end);
      if (totalDays >= 0) creationToEnd.push({ key: typeKey, label, days: totalDays });

      if (process.dataProtocolo) {
        const protocol = isoDateToDate(process.dataProtocolo);
        if (protocol) {
          const daysAfterProtocol = diffCalendarDays(protocol, end);
          if (daysAfterProtocol >= 0) {
            protocolToEnd.push({ key: typeKey, label, days: daysAfterProtocol });
          }
        }
      }
    }
  }

  return {
    creationToProtocol: buildBuckets(toProtocol),
    protocolToCompletion: buildBuckets(protocolToEnd),
    creationToCompletion: buildBuckets(creationToEnd),
  };
}

export type ProjectResolutionMetrics = {
  creationToCompletion: ResolutionBucket[];
};

export function computeProjectResolutionMetrics(
  projects: ConsultoriaProject[],
): ProjectResolutionMetrics {
  const items: { key: string; label: string; days: number }[] = [];

  for (const project of projects) {
    if (project.status !== "concluido") continue;
    const start = firestoreToDate(project.createdAt);
    const end = firestoreToDate(project.updatedAt);
    if (!start || !end) continue;
    const days = diffCalendarDays(start, end);
    if (days < 0) continue;

    const types = project.plannedProcessTypes ?? [];
    if (types.length === 0) {
      items.push({ key: "_sem_frente", label: "Sem frente definida", days });
      continue;
    }

    for (const type of types) {
      items.push({
        key: type,
        label: plannedProcessTypeLabel(type as ConsultoriaProjectPlannedProcessType),
        days,
      });
    }
  }

  return { creationToCompletion: buildBuckets(items) };
}

export type ResolutionTimeOverview = {
  tasks: TaskResolutionMetrics;
  processes: ProcessResolutionSeries;
  projects: ProjectResolutionMetrics;
  summary: {
    tasksAvgDays: number | null;
    tasksSample: number;
    processesAvgDays: number | null;
    processesSample: number;
    projectsAvgDays: number | null;
    projectsSample: number;
  };
};

export function computeResolutionTimeOverview(
  tasks: OfficeTask[],
  processes: OfficeProcess[],
  projects: ConsultoriaProject[],
): ResolutionTimeOverview {
  const taskMetrics = computeTaskResolutionMetrics(tasks);
  const processMetrics = computeProcessResolutionMetrics(processes);
  const projectMetrics = computeProjectResolutionMetrics(projects);

  const tasksGeral = generalBucket(taskMetrics.creationToCompletion);
  const processesGeral = generalBucket(processMetrics.creationToCompletion);
  const projectsGeral = generalBucket(projectMetrics.creationToCompletion);

  return {
    tasks: taskMetrics,
    processes: processMetrics,
    projects: projectMetrics,
    summary: {
      tasksAvgDays: tasksGeral?.avgDays ?? null,
      tasksSample: tasksGeral?.count ?? 0,
      processesAvgDays: processesGeral?.avgDays ?? null,
      processesSample: processesGeral?.count ?? 0,
      projectsAvgDays: projectsGeral?.avgDays ?? null,
      projectsSample: projectsGeral?.count ?? 0,
    },
  };
}

/** Dados para gráfico de barras (exclui bucket agregado "Geral"). */
export function bucketsToChartData(
  buckets: ResolutionBucket[],
): { label: string; media: number; count: number }[] {
  return buckets
    .filter((b) => b.key !== "_geral" && b.avgDays !== null)
    .map((b) => ({
      label: b.label,
      media: b.avgDays!,
      count: b.count,
    }));
}
