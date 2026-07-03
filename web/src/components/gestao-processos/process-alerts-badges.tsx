"use client";

import { Badge } from "@/components/ui/badge";
import type { OfficeProcess } from "@/lib/gestao-processos/types";
import {
  getProcessAlerts,
  PROCESS_ALERT_LABELS,
  type ProcessAlertKind,
} from "@/lib/gestao-processos/process-alerts";
import { cn } from "@/lib/utils";

const ALERT_CLASS: Record<ProcessAlertKind, string> = {
  prazo_vencido: "bg-red-500/15 text-red-700 border-red-500/30",
  exigencia: "bg-amber-500/15 text-amber-900 border-amber-500/30",
  prioridade_alta: "bg-orange-500/15 text-orange-800 border-orange-500/30",
};

type ProcessAlertsBadgesProps = {
  process: OfficeProcess;
  className?: string;
  max?: number;
};

export function ProcessAlertsBadges({
  process,
  className,
  max = 3,
}: ProcessAlertsBadgesProps) {
  const alerts = getProcessAlerts(process).slice(0, max);
  if (!alerts.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {alerts.map((kind) => (
        <Badge
          key={kind}
          variant="outline"
          className={cn("text-[10px]", ALERT_CLASS[kind])}
        >
          {PROCESS_ALERT_LABELS[kind]}
        </Badge>
      ))}
    </div>
  );
}
