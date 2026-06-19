import type { OfficeProcess } from "@/lib/gestao-processos/types";
import { resolveProcessPipelineState, isPrazoVencido } from "@/lib/gestao-processos/pipeline-utils";

export type ProcessAlertKind = "prazo_vencido" | "exigencia" | "prioridade_alta";

export const PROCESS_ALERT_LABELS: Record<ProcessAlertKind, string> = {
  prazo_vencido: "Prazo vencido",
  exigencia: "Em exigência",
  prioridade_alta: "Prioridade alta",
};

export function getProcessAlerts(process: OfficeProcess): ProcessAlertKind[] {
  const alerts: ProcessAlertKind[] = [];
  const { pipeline, etapa } = resolveProcessPipelineState(process);
  const encerrado =
    pipeline === "encerrado" ||
    etapa === "concluido_arquivado" ||
    process.fase === "concluido" ||
    process.fase === "arquivado";

  if (!encerrado && process.prioridade === "alta") {
    alerts.push("prioridade_alta");
  }
  if (!encerrado && process.fase === "exigencia") {
    alerts.push("exigencia");
  }
  if (!encerrado && isPrazoVencido(process.prazo)) {
    alerts.push("prazo_vencido");
  }
  return alerts;
}

export function processHasAlerts(process: OfficeProcess): boolean {
  return getProcessAlerts(process).length > 0;
}

export type ConsultoriaProjectProcessStats = {
  total: number;
  emTramitacao: number;
  concluidos: number;
  exigencia: number;
  prazosVencidos: number;
  prioridadeAlta: number;
  progressPct: number;
};

export function computeConsultoriaProjectProcessStats(
  processes: OfficeProcess[],
): ConsultoriaProjectProcessStats {
  let emTramitacao = 0;
  let concluidos = 0;
  let exigencia = 0;
  let prazosVencidos = 0;
  let prioridadeAlta = 0;

  for (const p of processes) {
    const { pipeline, etapa } = resolveProcessPipelineState(p);
    const encerrado =
      pipeline === "encerrado" ||
      etapa === "concluido_arquivado" ||
      p.fase === "concluido" ||
      p.fase === "arquivado";

    if (encerrado) concluidos++;
    else emTramitacao++;

    const alerts = getProcessAlerts(p);
    if (alerts.includes("exigencia")) exigencia++;
    if (alerts.includes("prazo_vencido")) prazosVencidos++;
    if (alerts.includes("prioridade_alta")) prioridadeAlta++;
  }

  const total = processes.length;
  const progressPct =
    total > 0 ? Math.round((concluidos / total) * 100) : 0;

  return {
    total,
    emTramitacao,
    concluidos,
    exigencia,
    prazosVencidos,
    prioridadeAlta,
    progressPct,
  };
}

export function summarizeProjectAlerts(
  processes: OfficeProcess[],
): { kind: ProcessAlertKind; count: number }[] {
  const counts = new Map<ProcessAlertKind, number>();
  for (const p of processes) {
    for (const a of getProcessAlerts(p)) {
      counts.set(a, (counts.get(a) ?? 0) + 1);
    }
  }
  return (["prazo_vencido", "exigencia", "prioridade_alta"] as ProcessAlertKind[])
    .filter((k) => (counts.get(k) ?? 0) > 0)
    .map((kind) => ({ kind, count: counts.get(kind)! }));
}
