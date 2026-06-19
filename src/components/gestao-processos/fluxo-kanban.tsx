"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  ConsultoriaEtapa,
  ConsultoriaProject,
  OfficeProcess,
  OfficeProcessPipeline,
  OrgaoEtapa,
} from "@/lib/gestao-processos/types";
import {
  CONSULTORIA_ETAPA_LABELS,
  CONSULTORIA_ETAPAS,
  ORGAO_ETAPA_LABELS,
  ORGAO_ETAPAS,
  diasAtePrazo,
  isPrazoVencido,
  resolveProcessPipelineState,
} from "@/lib/gestao-processos/pipeline-utils";
import { consultoriaProjectLabel, PROCESS_GROUP_LABELS } from "@/lib/gestao-processos/consultoria-project-utils";
import { formatOfficeProcessCoordinates } from "@/lib/gestao-processos/cadastro-coordinates";
import { formatPrazoDisplay } from "@/lib/gestao-processos/utils";
import type { Project } from "@/lib/types";
import { ProcessAlertsBadges } from "@/components/gestao-processos/process-alerts-badges";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type FluxoKanbanPipeline = Extract<
  OfficeProcessPipeline,
  "consultoria" | "orgao"
>;

export type FluxoKanbanProps = {
  pipeline: FluxoKanbanPipeline;
  processes: OfficeProcess[];
  consultoriaProjects: ConsultoriaProject[];
  cadastroById?: ReadonlyMap<string, Project>;
  isLoading?: boolean;
  canWrite?: boolean;
  onOpenProcess: (id: string) => void;
  onMoveEtapa: (
    process: OfficeProcess,
    etapa: ConsultoriaEtapa | OrgaoEtapa,
  ) => void;
  onProtocolar: (process: OfficeProcess) => void;
  onEdit: (process: OfficeProcess) => void;
  onDelete: (process: OfficeProcess) => void;
};

function stagesForPipeline(pipeline: FluxoKanbanPipeline) {
  return pipeline === "consultoria" ? CONSULTORIA_ETAPAS : ORGAO_ETAPAS;
}

function labelsForPipeline(pipeline: FluxoKanbanPipeline) {
  return pipeline === "consultoria" ? CONSULTORIA_ETAPA_LABELS : ORGAO_ETAPA_LABELS;
}

function groupBadgeClass(group: string): string {
  return cn(
    group === "licenciamento" && "bg-emerald-500/15 text-emerald-800 border-emerald-500/30",
    group === "outorga" && "bg-sky-500/15 text-sky-800 border-sky-500/30",
    group === "intervencao" && "bg-amber-500/15 text-amber-900 border-amber-500/30",
  );
}

export function FluxoKanban({
  pipeline,
  processes,
  consultoriaProjects,
  cadastroById,
  isLoading,
  canWrite,
  onOpenProcess,
  onMoveEtapa,
  onProtocolar,
  onEdit,
  onDelete,
}: FluxoKanbanProps) {
  const cadastroMap = cadastroById ?? new Map<string, Project>();
  const stages = stagesForPipeline(pipeline);
  const labels = labelsForPipeline(pipeline);

  const columnProcesses = React.useMemo(() => {
    const map = new Map<string, OfficeProcess[]>();
    for (const stage of stages) map.set(stage, []);
    for (const p of processes) {
      const resolved = resolveProcessPipelineState(p);
      if (pipeline === "orgao") {
        if (resolved.pipeline !== "orgao" && resolved.pipeline !== "encerrado") continue;
      } else if (resolved.pipeline !== pipeline) {
        continue;
      }
      const key = resolved.etapa;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [processes, pipeline, stages]);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      <div className="flex min-w-max gap-3">
        {stages.map((stage) => {
          const items = columnProcesses.get(stage) ?? [];
          return (
            <div
              key={stage}
              className="flex w-[min(280px,72vw)] shrink-0 flex-col gap-2"
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold leading-tight text-foreground">
                  {labels[stage as keyof typeof labels]}
                </h3>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {items.length}
                </Badge>
              </div>
              <div className="min-h-[240px] flex-1 space-y-2 rounded-lg bg-muted/50 p-2">
                {isLoading ? (
                  <KanbanCardSkeleton />
                ) : items.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Nenhum processo
                  </p>
                ) : (
                  items.map((item) => (
                    <KanbanProcessCard
                      key={item.id}
                      process={item}
                      pipeline={pipeline}
                      consultoriaProjects={consultoriaProjects}
                      cadastroById={cadastroMap}
                      canWrite={canWrite}
                      onOpen={() => onOpenProcess(item.id)}
                      onMoveEtapa={(etapa) => onMoveEtapa(item, etapa)}
                      onProtocolar={() => onProtocolar(item)}
                      onEdit={() => onEdit(item)}
                      onDelete={() => onDelete(item)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type KanbanProcessCardProps = {
  process: OfficeProcess;
  pipeline: FluxoKanbanPipeline;
  consultoriaProjects: ConsultoriaProject[];
  cadastroById: ReadonlyMap<string, Project>;
  canWrite?: boolean;
  onOpen: () => void;
  onMoveEtapa: (etapa: ConsultoriaEtapa | OrgaoEtapa) => void;
  onProtocolar: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function KanbanProcessCard({
  process,
  pipeline,
  consultoriaProjects,
  cadastroById,
  canWrite,
  onOpen,
  onMoveEtapa,
  onProtocolar,
  onEdit,
  onDelete,
}: KanbanProcessCardProps) {
  const { etapa, processGroup } = resolveProcessPipelineState(process);
  const coordResumo = formatOfficeProcessCoordinates(
    process,
    cadastroById,
    consultoriaProjects,
  );
  const stages = stagesForPipeline(pipeline);
  const labels = labelsForPipeline(pipeline);
  const prazoDias = diasAtePrazo(process.prazo);
  const vencido = isPrazoVencido(process.prazo);

  return (
    <Card
      className={cn(
        "cursor-pointer border-l-4 bg-card shadow-sm transition-shadow hover:shadow-md",
        process.prioridade === "alta" && "border-l-red-500",
        process.prioridade !== "alta" && "border-l-primary/40",
      )}
      onClick={onOpen}
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-mono text-xs font-semibold">
              {process.numeroProcesso || "Sem número"}
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className={cn("text-[10px]", groupBadgeClass(processGroup))}>
                {PROCESS_GROUP_LABELS[processGroup]}
              </Badge>
              {process.consultoriaProjectId ? (
                <Badge variant="secondary" className="max-w-[140px] truncate text-[10px]">
                  {consultoriaProjectLabel(
                    process.consultoriaProjectId,
                    consultoriaProjects,
                  ) ?? "Projeto"}
                </Badge>
              ) : null}
              {process.prioridade === "alta" ? (
                <Badge variant="destructive" className="text-[10px]">
                  Alta
                </Badge>
              ) : null}
            </div>
          </div>
          {canWrite ? (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Mover para</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {stages
                          .filter((s) => s !== etapa)
                          .map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => {
                                if (
                                  pipeline === "consultoria" &&
                                  s === "concluido_protocolo"
                                ) {
                                  onProtocolar();
                                } else {
                                  onMoveEtapa(s);
                                }
                              }}
                            >
                              {labels[s as keyof typeof labels]}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  {pipeline === "consultoria" ? (
                    <DropdownMenuItem onClick={onProtocolar}>
                      Protocolar (passar ao órgão)
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>

        <p className="truncate text-xs text-muted-foreground">
          {process.empreendedorName}
        </p>
        {process.municipio ? (
          <p className="truncate text-[11px] text-muted-foreground">
            {process.municipio}
          </p>
        ) : null}
        {coordResumo ? (
          <p
            className="truncate font-mono text-[10px] text-muted-foreground"
            title={coordResumo}
          >
            {coordResumo}
          </p>
        ) : null}
        {process.prazo ? (
          <p
            className={cn(
              "text-[11px]",
              vencido ? "font-medium text-red-600" : "text-muted-foreground",
            )}
          >
            Prazo: {formatPrazoDisplay(process.prazo)}
            {prazoDias !== null
              ? vencido
                ? ` · ${Math.abs(prazoDias)}d vencido`
                : ` · ${prazoDias}d`
              : null}
          </p>
        ) : null}
        {process.statusDetalhe ? (
          <p className="line-clamp-2 text-[11px] text-muted-foreground">
            {process.statusDetalhe}
          </p>
        ) : null}
        <ProcessAlertsBadges process={process} />
      </CardContent>
    </Card>
  );
}

function KanbanCardSkeleton() {
  return (
    <>
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
    </>
  );
}
