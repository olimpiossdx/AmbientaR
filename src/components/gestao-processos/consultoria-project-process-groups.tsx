"use client";

import * as React from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OfficeProcess } from "@/lib/gestao-processos/types";
import {
  inferProcessGroup,
  PROCESS_GROUP_LABELS,
  type ProcessGroup,
} from "@/lib/gestao-processos/consultoria-project-utils";
import { gestaoProcessosDetailPath } from "@/lib/gestao-processos-menu";
import {
  etapaLabel,
  resolveProcessPipelineState,
} from "@/lib/gestao-processos/pipeline-utils";
import { OFFICE_PROCESS_FASE_LABELS, formatPrazoDisplay } from "@/lib/gestao-processos/utils";
import { ProcessAlertsBadges } from "@/components/gestao-processos/process-alerts-badges";
import { Link2, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";

const GROUP_ORDER: ProcessGroup[] = [
  "licenciamento",
  "outorga",
  "intervencao",
  "outros",
];

type ConsultoriaProjectProcessGroupsProps = {
  processes: OfficeProcess[];
  canWrite?: boolean;
  unlinkingId?: string | null;
  onLink?: () => void;
  onUnlink?: (processId: string) => void;
  defaultOpenAll?: boolean;
};

export function ConsultoriaProjectProcessGroups({
  processes,
  canWrite,
  unlinkingId,
  onLink,
  onUnlink,
  defaultOpenAll = true,
}: ConsultoriaProjectProcessGroupsProps) {
  const grouped = React.useMemo(() => {
    const map = new Map<ProcessGroup, OfficeProcess[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const proc of processes) {
      const g = proc.processGroup ?? inferProcessGroup(proc.tipoIntervencao);
      map.get(g)!.push(proc);
    }
    return GROUP_ORDER.map((group) => ({
      group,
      processes: map.get(group)!,
    }));
  }, [processes]);

  const defaultOpen = defaultOpenAll
    ? grouped.filter((g) => g.processes.length > 0).map((g) => g.group)
    : grouped.filter((g) => g.processes.length > 0).slice(0, 1).map((g) => g.group);

  if (processes.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Nenhum processo vinculado a este projeto.
        </p>
        {canWrite && onLink ? (
          <Button type="button" size="sm" variant="outline" onClick={onLink}>
            <Link2 className="mr-2 h-4 w-4" />
            Vincular processos
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-2">
      {grouped.map(({ group, processes: items }) => (
        <AccordionItem
          key={group}
          value={group}
          className="rounded-lg border px-3"
        >
          <AccordionTrigger className="py-3 hover:no-underline">
            <div className="flex flex-1 items-center gap-2 text-left">
              <span className="text-sm font-medium">
                {PROCESS_GROUP_LABELS[group]}
              </span>
              <Badge variant="secondary" className="text-xs">
                {items.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-0">
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum processo neste grupo.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((proc) => (
                  <ProcessGroupRow
                    key={proc.id}
                    process={proc}
                    canWrite={canWrite}
                    unlinkingId={unlinkingId}
                    onUnlink={onUnlink}
                  />
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function ProcessGroupRow({
  process,
  canWrite,
  unlinkingId,
  onUnlink,
}: {
  process: OfficeProcess;
  canWrite?: boolean;
  unlinkingId?: string | null;
  onUnlink?: (id: string) => void;
}) {
  const { pipeline, etapa } = resolveProcessPipelineState(process);

  return (
    <li className="flex flex-wrap items-start gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
      <Link
        href={gestaoProcessosDetailPath(process.id)}
        className="min-w-0 flex-1 space-y-1.5 transition-colors hover:text-primary"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-medium">{process.numeroProcesso}</span>
          <Badge variant="outline" className="text-[10px] uppercase">
            {process.tipoProcesso}
          </Badge>
        </div>
        {process.tipoIntervencao ? (
          <p className="text-xs text-muted-foreground">{process.tipoIntervencao}</p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {OFFICE_PROCESS_FASE_LABELS[process.fase]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {etapaLabel(pipeline, etapa)}
          </Badge>
          {process.prioridade === "alta" ? (
            <Badge variant="destructive" className="text-xs">
              Alta
            </Badge>
          ) : null}
        </div>
        <ProcessAlertsBadges process={process} />
        <p className="text-xs text-muted-foreground">
          Prazo: {formatPrazoDisplay(process.prazo)}
        </p>
      </Link>
      {canWrite && onUnlink ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Desvincular processo"
          disabled={unlinkingId === process.id}
          onClick={() => onUnlink(process.id)}
        >
          <Unlink className="h-4 w-4" />
        </Button>
      ) : null}
    </li>
  );
}
