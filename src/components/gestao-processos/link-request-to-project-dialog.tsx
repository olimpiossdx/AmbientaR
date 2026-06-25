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
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardSearchInput } from "@/components/card-search-input";
import { Loader2 } from "lucide-react";
import type { Request } from "@/lib/types";
import type { ConsultoriaProject } from "@/lib/gestao-processos/types";
import { consultoriaProjectLabel } from "@/lib/gestao-processos/consultoria-project-utils";
import {
  formatLicenciamentoSolicitationNumber,
  getLicenciamentoStatusLabel,
} from "@/lib/licenciamento-tramite-report";
import { cn } from "@/lib/utils";

type LinkRequestToProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Request | null;
  projects: ConsultoriaProject[];
  linking?: boolean;
  onConfirm: (consultoriaProjectId: string) => void | Promise<void>;
};

export function LinkRequestToProjectDialog({
  open,
  onOpenChange,
  request,
  projects,
  linking,
  onConfirm,
}: LinkRequestToProjectDialogProps) {
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const candidates = React.useMemo(() => {
    let list = [...projects];
    if (request?.empreendedorId) {
      const sameEmp = list.filter((p) => p.empreendedorId === request.empreendedorId);
      if (sameEmp.length > 0) list = sameEmp;
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((p) =>
        [p.code, p.name, p.empreendedorName, p.empreendimentoName, p.municipio]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term),
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [projects, request?.empreendedorId, search]);

  const soleCandidateId = candidates.length === 1 ? candidates[0].id : null;

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedId(null);
      return;
    }
    if (soleCandidateId) setSelectedId(soleCandidateId);
  }, [open, soleCandidateId]);

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Vincular trâmite ao projeto</DialogTitle>
          <DialogDescription>
            Trâmite{" "}
            <strong className="font-mono">
              {formatLicenciamentoSolicitationNumber(request)}
            </strong>{" "}
            ({getLicenciamentoStatusLabel(request.status)}) — escolha o projeto de
            consultoria.
          </DialogDescription>
        </DialogHeader>

        <CardSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar projeto…"
        />

        <ScrollArea className="h-[min(50vh,320px)] rounded-md border">
          {candidates.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhum projeto de consultoria encontrado.
            </p>
          ) : (
            <ul className="divide-y">
              {candidates.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-3 text-left hover:bg-muted/50",
                      selectedId === p.id && "bg-muted/60",
                    )}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <p className="text-sm font-medium">
                      {consultoriaProjectLabel(p.id, [p]) ?? p.name}
                    </p>
                    {p.empreendedorName ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {p.empreendedorName}
                        {p.empreendimentoName ? ` · ${p.empreendimentoName}` : ""}
                      </p>
                    ) : null}
                  </button>
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
            disabled={linking || !selectedId}
            onClick={() => selectedId && void onConfirm(selectedId)}
          >
            {linking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Vincular ao projeto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
