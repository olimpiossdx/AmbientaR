import { cn } from "@/lib/utils";
import {
  FINDING_STATUS_LABELS,
  SEVERITY_LABELS,
  SEVERITY_SEMAPHORE,
} from "@/lib/fiscal-ambiental/fiscal-finding-labels";
import type { FadFiscalFindingStatus, FadFiscalSeverity } from "@/lib/fiscal-ambiental/types";

type FadFindingBadgeProps = {
  severity: FadFiscalSeverity;
  status?: FadFiscalFindingStatus;
  className?: string;
};

export function FadFindingBadge({ severity, status, className }: FadFindingBadgeProps) {
  const sem = SEVERITY_SEMAPHORE[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        sem.bg,
        sem.text,
        sem.border,
        className,
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", sem.dot)} aria-hidden />
      {SEVERITY_LABELS[severity]}
      {status ? ` · ${FINDING_STATUS_LABELS[status]}` : null}
    </span>
  );
}
