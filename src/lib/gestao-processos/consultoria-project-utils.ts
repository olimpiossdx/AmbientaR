import type {
  ConsultoriaProject,
  ConsultoriaProjectPlannedProcessType,
  ConsultoriaProjectStatus,
  OfficeProcess,
  OfficeProcessExcelRow,
  OfficeProcessImportPreview,
  OfficeProcessProcessGroup,
} from "@/lib/gestao-processos/types";
import { normalizeProcessText } from "@/lib/gestao-processos/utils";

export const CONSULTORIA_PROJECT_STATUS_LABELS: Record<
  ConsultoriaProjectStatus,
  string
> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export function buildConsultoriaProjectCode(
  projects: ConsultoriaProject[],
  year = new Date().getFullYear(),
): string {
  const prefix = `PRJ-${year}-`;
  const nums = projects
    .map((p) => p.code?.match(/^PRJ-(\d{4})-(\d+)$/) ?? null)
    .filter((m): m is RegExpMatchArray => m !== null && m[1] === String(year))
    .map((m) => Number(m[2]))
    .filter((n) => Number.isFinite(n));

  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function consultoriaProjectVisibleToPortal(
  project: Pick<ConsultoriaProject, "empreendedorId">,
  allowedEmpreendedorIds: string[],
): boolean {
  if (!project.empreendedorId) return false;
  return allowedEmpreendedorIds.includes(project.empreendedorId);
}

export function consultoriaProjectSearchBlob(project: ConsultoriaProject): string {
  return [
    project.code,
    project.name,
    project.description,
    project.empreendedorName,
    project.empreendimentoName,
    project.municipio,
    project.tipoAtividade,
    project.managerName,
    CONSULTORIA_PROJECT_STATUS_LABELS[project.status],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export type ProcessGroup = "licenciamento" | "outorga" | "intervencao" | "outros";

export const PROCESS_GROUP_LABELS: Record<ProcessGroup, string> = {
  licenciamento: "Licenciamento / Dispensa",
  outorga: "Outorga de Recursos Hídricos",
  intervencao: "Intervenção Ambiental (APP/ASV)",
  outros: "Outros",
};

export const PLANNED_PROCESS_TYPE_ORDER: ConsultoriaProjectPlannedProcessType[] = [
  "licenca_ambiental",
  "outorga",
  "uso_insignificante",
  "daia_supressao",
];

export const PLANNED_PROCESS_TYPE_LABELS: Record<
  ConsultoriaProjectPlannedProcessType,
  string
> = {
  licenca_ambiental: "Licença Ambiental",
  daia_supressao: "Supressão de Vegetação / DAIA",
  outorga: "Outorga",
  uso_insignificante: "Uso Insignificante",
};

export const PLANNED_PROCESS_TYPE_DESCRIPTIONS: Record<
  ConsultoriaProjectPlannedProcessType,
  string
> = {
  licenca_ambiental: "Licenciamento, dispensa, LAP, LAS, LAI, LAO ou estudos ambientais.",
  daia_supressao: "Intervenção ambiental, APP, ASV, corte ou supressão de vegetação.",
  outorga: "Outorga de recursos hídricos para captação, barramento ou lançamento.",
  uso_insignificante: "Cadastro ou regularização de uso insignificante de recursos hídricos.",
};

export const PLANNED_PROCESS_TYPE_GROUP: Record<
  ConsultoriaProjectPlannedProcessType,
  OfficeProcessProcessGroup
> = {
  licenca_ambiental: "licenciamento",
  daia_supressao: "intervencao",
  outorga: "outorga",
  uso_insignificante: "outorga",
};

export const PLANNED_PROCESS_TYPE_INTERVENCAO: Record<
  ConsultoriaProjectPlannedProcessType,
  string
> = {
  licenca_ambiental: "Licença Ambiental",
  daia_supressao: "Supressão de Vegetação / DAIA",
  outorga: "Outorga",
  uso_insignificante: "Uso Insignificante",
};

export function plannedProcessTypeLabel(
  type: ConsultoriaProjectPlannedProcessType,
): string {
  return PLANNED_PROCESS_TYPE_LABELS[type];
}

export function plannedProcessTypeGroup(
  type: ConsultoriaProjectPlannedProcessType,
): OfficeProcessProcessGroup {
  return PLANNED_PROCESS_TYPE_GROUP[type];
}

export function inferPlannedProcessType(
  process: Pick<OfficeProcess, "plannedProcessType" | "processGroup" | "tipoIntervencao">,
): ConsultoriaProjectPlannedProcessType {
  if (process.plannedProcessType) return process.plannedProcessType;
  const text = normalizeRef(process.tipoIntervencao ?? "");
  if (/uso.*insign|insignificante/.test(text)) return "uso_insignificante";
  if (/outorga|oua|hidric|captacao|capta|barramento|igam/.test(text)) {
    return "outorga";
  }
  if (/daia|asv|supress|veget|intervenc|app/.test(text)) return "daia_supressao";
  if (process.processGroup === "outorga") return "outorga";
  if (process.processGroup === "intervencao") return "daia_supressao";
  return "licenca_ambiental";
}

export function resolveProjectPlannedProcessTypes(
  project: Pick<ConsultoriaProject, "plannedProcessTypes">,
  processes: OfficeProcess[] = [],
): ConsultoriaProjectPlannedProcessType[] {
  const selected = new Set<ConsultoriaProjectPlannedProcessType>(
    project.plannedProcessTypes ?? [],
  );
  for (const process of processes) {
    selected.add(inferPlannedProcessType(process));
  }
  return PLANNED_PROCESS_TYPE_ORDER.filter((type) => selected.has(type));
}

export function inferProcessGroup(tipoIntervencao?: string): ProcessGroup {
  const s = normalizeProcessText(tipoIntervencao).toLowerCase();
  if (!s) return "outros";
  if (/outorga|oua|h[ií]dric|capta|barramento|igam/.test(s)) return "outorga";
  if (/asv|interven|app|supress|vegetal/.test(s)) return "intervencao";
  if (/licen|lap|lai|lao|las|aia|dispensa|sei|sla/.test(s)) return "licenciamento";
  return "outros";
}

function normalizeRef(value: string): string {
  return normalizeProcessText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Resolve coluna PROJETO (código PRJ-…, nome ou id Firestore). */
export function resolveConsultoriaProjectId(
  ref: string | undefined,
  projects: ConsultoriaProject[],
): string | undefined {
  const raw = ref?.trim();
  if (!raw) return undefined;

  const byId = projects.find((p) => p.id === raw);
  if (byId) return byId.id;

  const norm = normalizeRef(raw);
  const byCode = projects.find((p) => p.code && normalizeRef(p.code) === norm);
  if (byCode) return byCode.id;

  const byName = projects.find((p) => normalizeRef(p.name) === norm);
  if (byName) return byName.id;

  const contains = projects.find((p) => {
    const name = normalizeRef(p.name);
    return name.includes(norm) || norm.includes(name);
  });
  return contains?.id;
}

export function consultoriaProjectLabel(
  projectId: string | undefined,
  projects: ConsultoriaProject[],
): string | undefined {
  if (!projectId) return undefined;
  const p = projects.find((x) => x.id === projectId);
  if (!p) return undefined;
  return p.code ? `${p.code} — ${p.name}` : p.name;
}

/** Sugere projeto pelo empreendedor + empreendimento (texto ou id cadastral). */
export function suggestConsultoriaProjectForProcess(
  process: Pick<
    OfficeProcess,
    "empreendedorId" | "empreendedorName" | "empreendimentoName" | "projectId"
  >,
  projects: ConsultoriaProject[],
): ConsultoriaProject | undefined {
  const candidates = projects.filter((p) => {
    if (process.empreendedorId && p.empreendedorId) {
      return p.empreendedorId === process.empreendedorId;
    }
    if (process.empreendedorName && p.empreendedorName) {
      return (
        normalizeRef(p.empreendedorName) === normalizeRef(process.empreendedorName)
      );
    }
    return false;
  });

  if (!candidates.length) return undefined;

  if (process.projectId) {
    const byProjectId = candidates.find((p) => p.projectId === process.projectId);
    if (byProjectId) return byProjectId;
  }

  if (process.empreendimentoName && process.empreendimentoName !== "—") {
    const empNorm = normalizeRef(process.empreendimentoName);
    const byEmpName = candidates.find((p) => {
      if (!p.empreendimentoName) return false;
      const pNorm = normalizeRef(p.empreendimentoName);
      return pNorm === empNorm || pNorm.includes(empNorm) || empNorm.includes(pNorm);
    });
    if (byEmpName) return byEmpName;
  }

  return candidates.length === 1 ? candidates[0] : undefined;
}

export type ImportResolutionContext = {
  empreendedores?: { id: string; name: string }[];
  consultoriaProjects?: ConsultoriaProject[];
};

export type ResolvedImportRow = {
  row: OfficeProcessExcelRow;
  consultoriaProjectId?: string;
  unresolvedProjetoRef?: string;
};

export function resolveImportRows(
  preview: OfficeProcessImportPreview,
  context: ImportResolutionContext,
): {
  resolved: ResolvedImportRow[];
  unresolvedProjects: { rowNumber: number; projetoRef: string }[];
} {
  const projects = context.consultoriaProjects ?? [];
  const unresolvedProjects: { rowNumber: number; projetoRef: string }[] = [];
  const resolved: ResolvedImportRow[] = [];

  for (const row of preview.rows) {
    let consultoriaProjectId = resolveConsultoriaProjectId(row.projetoRef, projects);
    let unresolvedProjetoRef: string | undefined;

    if (row.projetoRef?.trim() && !consultoriaProjectId) {
      unresolvedProjects.push({
        rowNumber: row.rowNumber,
        projetoRef: row.projetoRef.trim(),
      });
    } else if (!consultoriaProjectId && projects.length) {
      const suggested = suggestConsultoriaProjectForProcess(
        {
          empreendedorName: row.empreendedorName,
          empreendimentoName: row.empreendimentoName,
        },
        projects,
      );
      consultoriaProjectId = suggested?.id;
    }

    if (row.projetoRef?.trim() && !consultoriaProjectId) {
      unresolvedProjetoRef = row.projetoRef.trim();
    }

    resolved.push({ row, consultoriaProjectId, unresolvedProjetoRef });
  }

  return { resolved, unresolvedProjects };
}

export function countOrphanProcesses(processes: OfficeProcess[]): number {
  return processes.filter((p) => !p.consultoriaProjectId).length;
}

export function countProcessesInTramitacao(processes: OfficeProcess[]): number {
  return processes.filter(
    (p) => p.fase !== "concluido" && p.fase !== "arquivado",
  ).length;
}
