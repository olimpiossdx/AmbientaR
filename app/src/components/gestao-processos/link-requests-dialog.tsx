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
import type { Project, Request } from "@/lib/types";
import type { ConsultoriaProject, OfficeProcess } from "@/lib/gestao-processos/types";
import {
  filterOrphanLicenciamentoRequests,
  suggestOrphanRequestsForProject,
} from "@/lib/gestao-processos/request-consultoria-link";
import {
  formatLicenciamentoSolicitationNumber,
  getLicenciamentoStatusLabel,
} from "@/lib/licenciamento-tramite-report";

type LinkRequestsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ConsultoriaProject;
  requests: Request[];
  processes: OfficeProcess[];
  empreendedorNameById?: ReadonlyMap<string, string>;
  cadastroProjectNameById?: ReadonlyMap<string, string>;
  linking?: boolean;
  onConfirm: (requestIds: string[]) => void | Promise<void>;
};

export function LinkRequestsDialog({
  open,
  onOpenChange,
  project,
  requests,
  processes,
  empreendedorNameById,
  cadastroProjectNameById,
  linking,
  onConfirm,
}: LinkRequestsDialogProps) {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const candidates = React.useMemo(() => {
    let list = filterOrphanLicenciamentoRequests(requests, processes);
    if (project.empreendedorId) {
      list = list.filter((r) => r.empreendedorId === project.empreendedorId);
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((r) => {
        const blob = [
          formatLicenciamentoSolicitationNumber(r),
          getLicenciamentoStatusLabel(r.status),
          empreendedorNameById?.get(r.empreendedorId),
          cadastroProjectNameById?.get(r.projectId),
          ...(r.services ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(term);
      });
    }
    return list.sort((a, b) =>
      formatLicenciamentoSolicitationNumber(a).localeCompare(
        formatLicenciamentoSolicitationNumber(b),
        "pt-BR",
      ),
    );
  }, [
    requests,
    processes,
    project.empreendedorId,
    search,
    empreendedorNameById,
    cadastroProjectNameById,
  ]);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(new Set());
      return;
    }
    setSelected(suggestOrphanRequestsForProject(requests, processes, project));
  }, [open, requests, processes, project]);

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
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Vincular trâmites de licenciamento</DialogTitle>
          <DialogDescription>
            Selecione trâmites sem projeto vinculado para associar a{" "}
            <strong>{project.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <CardSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar trâmite, status ou empreendimento…"
        />

        <ScrollArea className="h-[min(50vh,320px)] rounded-md border">
          {candidates.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhum trâmite disponível para vincular
              {project.empreendedorId ? " para este empreendedor" : ""}.
            </p>
          ) : (
            <ul className="divide-y">
              {candidates.map((r) => (
                <li key={r.id}>
                  <label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50">
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggle(r.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-medium">
                        {formatLicenciamentoSolicitationNumber(r)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getLicenciamentoStatusLabel(r.status)}
                        {cadastroProjectNameById?.get(r.projectId)
                          ? ` · ${cadastroProjectNameById.get(r.projectId)}`
                          : ""}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
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
            {linking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Vincular {selected.size} trâmite(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
