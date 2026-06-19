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
import type {
  ConsultoriaProjectPlannedProcessType,
  ConsultoriaProject,
  OfficeProcess,
} from "@/lib/gestao-processos/types";
import {
  inferProcessGroup,
  inferPlannedProcessType,
  PLANNED_PROCESS_TYPE_DESCRIPTIONS,
  PLANNED_PROCESS_TYPE_LABELS,
  PLANNED_PROCESS_TYPE_ORDER,
  resolveProjectPlannedProcessTypes,
} from "@/lib/gestao-processos/consultoria-project-utils";
import { gestaoProcessosDetailPath } from "@/lib/gestao-processos-menu";
import {
  etapaLabel,
  resolveProcessPipelineState,
} from "@/lib/gestao-processos/pipeline-utils";
import { OFFICE_PROCESS_FASE_LABELS, formatPrazoDisplay } from "@/lib/gestao-processos/utils";
import { formatOfficeProcessCoordinates } from "@/lib/gestao-processos/cadastro-coordinates";
import type { Project } from "@/lib/types";
import { ProcessAlertsBadges } from "@/components/gestao-processos/process-alerts-badges";
import { getProcessAlerts } from "@/lib/gestao-processos/process-alerts";
import { Droplets, FileText, Leaf, Link2, Plus, TreePine, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANNED_TYPE_ICON = {
  licenca_ambiental: Leaf,
  daia_supressao: TreePine,
  outorga: Droplets,
  uso_insignificante: FileText,
} satisfies Record<ConsultoriaProjectPlannedProcessType, typeof Leaf>;

function plannedTypeAccent(type: ConsultoriaProjectPlannedProcessType): string {
  return cn(
    type === "licenca_ambiental" && "border-l-emerald-500",
    type === "daia_supressao" && "border-l-amber-500",
    type === "outorga" && "border-l-blue-500",
    type === "uso_insignificante" && "border-l-cyan-500",
  );
}

type ConsultoriaProjectProcessGroupsProps = {
  plannedProcessTypes?: ConsultoriaProjectPlannedProcessType[];
  processes: OfficeProcess[];
  canWrite?: boolean;
  unlinkingId?: string | null;
  cadastroById?: ReadonlyMap<string, Project>;
  consultoriaProjects?: ConsultoriaProject[];
  onCreateFromPlanned?: (type: ConsultoriaProjectPlannedProcessType) => void;
  onLink?: (type?: ConsultoriaProjectPlannedProcessType) => void;
  onUnlink?: (processId: string) => void;
  defaultOpenAll?: boolean;
};

export function ConsultoriaProjectProcessGroups({
  plannedProcessTypes,
  processes,
  canWrite,
  unlinkingId,
  cadastroById,
  consultoriaProjects,
  onCreateFromPlanned,
  onLink,
  onUnlink,
  defaultOpenAll = true,
}: ConsultoriaProjectProcessGroupsProps) {
  const grouped = React.useMemo(() => {
    const visibleTypes = resolveProjectPlannedProcessTypes(
      { plannedProcessTypes },
      processes,
    );
    const fallbackTypes =
      visibleTypes.length > 0 ? visibleTypes : PLANNED_PROCESS_TYPE_ORDER;
    const map = new Map<ConsultoriaProjectPlannedProcessType, OfficeProcess[]>();
    for (const type of fallbackTypes) map.set(type, []);
    for (const proc of processes) {
      const type = inferPlannedProcessType({
        ...proc,
        processGroup: proc.processGroup ?? inferProcessGroup(proc.tipoIntervencao),
      });
      if (!map.has(type)) map.set(type, []);
      map.get(type)!.push(proc);
    }
    return fallbackTypes.map((type) => ({
      type,
      processes: map.get(type) ?? [],
    }));
  }, [plannedProcessTypes, processes]);

  const defaultOpen = defaultOpenAll
    ? grouped.map((g) => g.type)
    : grouped
        .filter((g) => g.processes.length > 0)
        .slice(0, 1)
        .map((g) => g.type);

  if (grouped.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Nenhuma frente ambiental planejada para este projeto.
        </p>
        {canWrite && onLink ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onLink()}>
            <Link2 className="mr-2 h-4 w-4" />
            Vincular processos
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-2">
      {grouped.map(({ type, processes: items }) => {
        const Icon = PLANNED_TYPE_ICON[type];
        const alertCount = items.reduce(
          (total, process) => total + getProcessAlerts(process).length,
          0,
        );
        return (
        <AccordionItem
          key={type}
          value={type}
          className={cn("overflow-hidden rounded-lg border border-l-4", plannedTypeAccent(type))}
        >
          <AccordionTrigger className="px-3 py-3 hover:no-underline">
            <div className="flex flex-1 items-center gap-3 text-left">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    {PLANNED_PROCESS_TYPE_LABELS[type]}
                  </span>
                  <Badge variant={items.length > 0 ? "secondary" : "outline"} className="text-xs">
                    {items.length} vinculado{items.length === 1 ? "" : "s"}
                  </Badge>
                  {alertCount > 0 ? (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-700">
                      {alertCount} alerta{alertCount === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {PLANNED_PROCESS_TYPE_DESCRIPTIONS[type]}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 pt-0">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.length > 0 ? (
                items.map((proc) => (
                  <ProcessGroupRow
                    key={proc.id}
                    process={proc}
                    canWrite={canWrite}
                    unlinkingId={unlinkingId}
                    cadastroById={cadastroById}
                    consultoriaProjects={consultoriaProjects}
                    onUnlink={onUnlink}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm">
                  <p className="font-medium">Previsto, ainda não iniciado</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use este espaço para criar ou vincular o processo quando ele entrar na rotina.
                  </p>
                </div>
              )}
              {canWrite ? (
                <div className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-background p-4 text-center">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">Adicionar processo</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {onCreateFromPlanned ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onCreateFromPlanned(type)}
                      >
                        Criar novo
                      </Button>
                    ) : null}
                    {onLink ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onLink(type)}
                      >
                        Vincular existente
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function ProcessGroupRow({
  process,
  canWrite,
  unlinkingId,
  cadastroById,
  consultoriaProjects,
  onUnlink,
}: {
  process: OfficeProcess;
  canWrite?: boolean;
  unlinkingId?: string | null;
  cadastroById?: ReadonlyMap<string, Project>;
  consultoriaProjects?: ConsultoriaProject[];
  onUnlink?: (id: string) => void;
}) {
  const { pipeline, etapa } = resolveProcessPipelineState(process);
  const coordResumo =
    cadastroById != null
      ? formatOfficeProcessCoordinates(
          process,
          cadastroById,
          consultoriaProjects ?? [],
        )
      : "";

  return (
    <div className="flex flex-wrap items-start gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
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
        {coordResumo ? (
          <p
            className="truncate font-mono text-[10px] text-muted-foreground"
            title={coordResumo}
          >
            {coordResumo}
          </p>
        ) : null}
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
    </div>
  );
}
