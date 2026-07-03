/**
 * Verifica métricas de tempo de resolução (gestão de processos).
 * Uso: npx tsx scripts/resolution-time-metrics-verify.ts
 */
import {
  computeProcessResolutionMetrics,
  computeProjectResolutionMetrics,
  computeResolutionTimeOverview,
  computeTaskResolutionMetrics,
  diffCalendarDays,
  firestoreToDate,
  isoDateToDate,
} from "../src/lib/gestao-processos/resolution-time-metrics";
import type { ConsultoriaProject, OfficeProcess } from "../src/lib/gestao-processos/types";
import type { OfficeTask } from "../src/lib/gestao-processos/task-types";

function assert(name: string, ok: boolean): void {
  if (!ok) {
    console.error(`FAIL · ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`OK · ${name}`);
  }
}

const created = new Date("2024-01-01T10:00:00Z");
const updated = new Date("2024-01-11T10:00:00Z");

assert("diffCalendarDays 10", diffCalendarDays(created, updated) === 10);
assert(
  "isoDateToDate",
  isoDateToDate("2024-01-11")?.toISOString().startsWith("2024-01-11") === true,
);
assert("firestoreToDate millis", firestoreToDate({ toMillis: () => created.getTime() }) !== null);

const tasks: OfficeTask[] = [
  {
    id: "t1",
    titulo: "Mapa",
    categoria: "mapa",
    status: "concluida",
    concluidaEm: "2024-01-06",
    createdAt: { toDate: () => new Date("2024-01-01") },
  },
  {
    id: "t2",
    titulo: "Doc",
    categoria: "documento",
    status: "concluida",
    concluidaEm: "2024-01-11",
    createdAt: { toDate: () => new Date("2024-01-01") },
  },
];

const taskMetrics = computeTaskResolutionMetrics(tasks);
assert("task geral count 2", taskMetrics.creationToCompletion[0]?.count === 2);
assert("task geral avg 7.5", taskMetrics.creationToCompletion[0]?.avgDays === 7.5);

const processes: OfficeProcess[] = [
  {
    id: "p1",
    externalKey: "k1",
    tipoProcesso: "sei",
    numeroProcesso: "SEI-1",
    empreendedorName: "A",
    empreendimentoName: "B",
    fase: "concluido",
    dataProtocolo: "2024-01-05",
    processGroup: "outorga",
    fonte: "app",
    createdAt: { toDate: () => new Date("2024-01-01") },
    updatedAt: { toDate: () => new Date("2024-01-15") },
  },
];

const processMetrics = computeProcessResolutionMetrics(processes);
assert(
  "process creation to protocol",
  processMetrics.creationToProtocol[0]?.avgDays === 4,
);
assert(
  "process protocol to completion",
  processMetrics.protocolToCompletion[0]?.avgDays === 10,
);
assert(
  "process creation to completion",
  processMetrics.creationToCompletion[0]?.avgDays === 14,
);

const projects: ConsultoriaProject[] = [
  {
    id: "pr1",
    name: "Projeto X",
    status: "concluido",
    plannedProcessTypes: ["licenca_ambiental", "outorga"],
    createdAt: { toDate: () => new Date("2024-02-01") },
    updatedAt: { toDate: () => new Date("2024-02-21") },
  },
];

const projectMetrics = computeProjectResolutionMetrics(projects);
assert("project sample 2 frentes", projectMetrics.creationToCompletion[0]?.count === 2);
assert("project avg 20 days", projectMetrics.creationToCompletion[0]?.avgDays === 20);

const overview = computeResolutionTimeOverview(tasks, processes, projects);
assert("overview tasks sample", overview.summary.tasksSample === 2);
assert("overview processes sample", overview.summary.processesSample === 1);

if (process.exitCode) {
  process.exit(process.exitCode);
}
