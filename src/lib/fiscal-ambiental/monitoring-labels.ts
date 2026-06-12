import type { FadMonitoringAlertLevel, FadMonitoringFrequency } from "./types";

export const FREQUENCY_LABELS: Record<FadMonitoringFrequency, string> = {
  monthly: "Mensal",
  bimonthly: "Bimestral",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
  manual: "Manual",
};

export const ALERT_LEVEL_LABELS: Record<FadMonitoringAlertLevel, string> = {
  none: "Sem alertas",
  low: "Alerta baixo",
  medium: "Alerta médio",
  high: "Alerta alto",
  critical: "Alerta crítico",
};

export const ALERT_LEVEL_COLORS: Record<FadMonitoringAlertLevel, string> = {
  none: "bg-emerald-500",
  low: "bg-emerald-400",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-violet-600",
};

export const MONITORING_DISCLAIMER =
  "Monitoramento auxiliar sobre imagens CBERS/INPE. Execução manual na v1; agendamento automático em versão futura.";
