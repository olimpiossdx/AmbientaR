import type {
  FadChangeAnalysisType,
  FadFiscalFindingType,
  FadFiscalSeverity,
} from "./types";

export const FAD_FISCAL_DISCLAIMER =
  "Achados preventivos com caráter auxiliar. Indícios visuais — não constituem infração confirmada, " +
  "auto de infração nem substituem vistoria em campo ou manifestação de órgão ambiental.";

export const FINDING_TYPE_LABELS: Record<FadFiscalFindingType, string> = {
  vegetation_loss: "Possível perda de vegetação",
  vegetation_gain: "Possível regeneração vegetal",
  bare_soil_exposure: "Possível solo exposto",
  app_intervention: "Possível intervenção em área sensível",
  manual_observation: "Observação manual",
};

export const FINDING_STATUS_LABELS = {
  open: "Aberto",
  under_review: "Em análise",
  dismissed: "Arquivado",
} as const;

export const SEVERITY_LABELS: Record<FadFiscalSeverity, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

/** Semáforo: verde · amarelo · laranja · vermelho · roxo (crítico) */
export const SEVERITY_SEMAPHORE: Record<
  FadFiscalSeverity,
  { dot: string; bg: string; text: string; border: string }
> = {
  low: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-500/40",
  },
  medium: {
    dot: "bg-yellow-500",
    bg: "bg-yellow-500/10",
    text: "text-yellow-900 dark:text-yellow-200",
    border: "border-yellow-500/40",
  },
  high: {
    dot: "bg-orange-500",
    bg: "bg-orange-500/10",
    text: "text-orange-900 dark:text-orange-200",
    border: "border-orange-500/40",
  },
  critical: {
    dot: "bg-violet-600",
    bg: "bg-violet-600/10",
    text: "text-violet-900 dark:text-violet-200",
    border: "border-violet-600/40",
  },
};

export function severityFromAreaHa(areaHa: number): FadFiscalSeverity {
  if (areaHa >= 10) return "critical";
  if (areaHa >= 2) return "high";
  if (areaHa >= 0.5) return "medium";
  return "low";
}

export function changeTypeToFindingType(type: FadChangeAnalysisType): FadFiscalFindingType {
  return type;
}
