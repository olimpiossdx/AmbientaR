"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardSearchInput } from "@/components/card-search-input";
import { Loader2 } from "lucide-react";
import type { Project } from "@/lib/types";
import type {
  ConsultoriaProject,
  ConsultoriaProjectPlannedProcessType,
  OfficeProcess,
} from "@/lib/gestao-processos/types";
import { OFFICE_PROCESS_FASE_LABELS } from "@/lib/gestao-processos/utils";
import {
  formatOfficeProcessCoordinates,
  officeProcessSearchBlobWithCadastro,
} from "@/lib/gestao-processos/cadastro-coordinates";
import {
  inferPlannedProcessType,
  PLANNED_PROCESS_TYPE_LABELS,
  suggestConsultoriaProjectForProcess,
} from "@/lib/gestao-processos/consultoria-project-utils";

type LinkProcessesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ConsultoriaProject;
  processes: OfficeProcess[];
  plannedProcessType?: ConsultoriaProjectPlannedProcessType | null;
  linking?: boolean;
  cadastroById?: ReadonlyMap<string, Project>;
  consultoriaProjects?: ConsultoriaProject[];
  onConfirm: (processIds: string[]) => void | Promise<void>;
};

export function LinkProcessesDialog({
  open,
  onOpenChange,
  project,
  processes,
  plannedProcessType,
  linking,
  cadastroById,
  consultoriaProjects,
  onConfirm,
}: LinkProcessesDialogProps) {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const candidates = React.useMemo(() => {
    let list = processes.filter((p) => !p.consultoriaProjectId);
    if (project.empreendedorId) {
      list = list.filter(
        (p) =>
          !p.empreendedorId || p.empreendedorId === project.empreendedorId,
      );
    }
    if (plannedProcessType) {
      list = list.filter((p) => inferPlannedProcessType(p) === plannedProcessType);
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((p) =>
        cadastroById
          ? officeProcessSearchBlobWithCadastro(
              p,
              cadastroById,
              consultoriaProjects ?? [],
            ).includes(term)
          : [
              p.numeroProcesso,
              p.empreendedorName,
              p.empreendimentoName,
              p.tipoIntervencao,
              p.statusDetalhe,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(term),
      );
    }
    return list.sort((a, b) =>
      a.numeroProcesso.localeCompare(b.numeroProcesso, "pt-BR"),
    );
  }, [processes, project.empreendedorId, plannedProcessType, search, cadastroById, consultoriaProjects]);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(new Set());
      return;
    }
    const suggested = new Set<string>();
    for (const p of processes) {
      if (p.consultoriaProjectId) continue;
      const match = suggestConsultoriaProjectForProcess(p, [project]);
      if (match?.id === project.id) suggested.add(p.id);
    }
    setSelected(suggested);
  }, [open, processes, project]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Vincular processos ao projeto</DialogTitle>
          <DialogDescription>
            Selecione processos sem projeto vinculado para associar a{" "}
            <strong>{project.name}</strong>
            {plannedProcessType
              ? ` na frente ${PLANNED_PROCESS_TYPE_LABELS[plannedProcessType]}.`
              : "."}
          </DialogDescription>
        </DialogHeader>

        <CardSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por número, empreendimento, coordenadas ou status…"
        />

        <ScrollArea className="h-[min(50vh,320px)] rounded-md border">
          {candidates.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhum processo disponível para vincular.
            </p>
          ) : (
            <ul className="divide-y">
              {candidates.map((p) => {
                const coordResumo =
                  cadastroById != null
                    ? formatOfficeProcessCoordinates(
                        p,
                        cadastroById,
                        consultoriaProjects ?? [],
                      )
                    : "";
                return (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50">
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggle(p.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-medium">
                        {p.numeroProcesso}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.empreendimentoName} ·{" "}
                        {OFFICE_PROCESS_FASE_LABELS[p.fase]}
                      </p>
                      {coordResumo ? (
                        <p
                          className="truncate font-mono text-[10px] text-muted-foreground"
                          title={coordResumo}
                        >
                          {coordResumo}
                        </p>
                      ) : null}
                    </div>
                  </label>
                </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={linking}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={linking || selected.size === 0}
            onClick={() => void onConfirm([...selected])}
          >
            {linking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Vincular {selected.size} processo(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
