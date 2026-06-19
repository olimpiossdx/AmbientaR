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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  OfficeProcess,
  OfficeProcessFase,
  OfficeProcessPrioridade,
  OfficeProcessTipo,
  ConsultoriaProject,
} from "@/lib/gestao-processos/types";
import { OFFICE_PROCESS_FASE_LABELS } from "@/lib/gestao-processos/utils";
import { formatOfficeProcessCoordinates } from "@/lib/gestao-processos/cadastro-coordinates";
import type { Project } from "@/lib/types";
import { Loader2 } from "lucide-react";

export const OFFICE_PROCESS_PRIORIDADE_LABELS: Record<
  OfficeProcessPrioridade,
  string
> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export type ProcessFormValues = {
  tipoProcesso: OfficeProcessTipo;
  numeroProcesso: string;
  empreendedorName: string;
  empreendimentoName: string;
  municipio: string;
  tipoIntervencao: string;
  fase: OfficeProcessFase;
  prioridade: OfficeProcessPrioridade | "";
  statusDetalhe: string;
  prazo: string;
  observacoes: string;
};

const EMPTY_FORM: ProcessFormValues = {
  tipoProcesso: "sei",
  numeroProcesso: "",
  empreendedorName: "",
  empreendimentoName: "",
  municipio: "",
  tipoIntervencao: "",
  fase: "elaboracao",
  prioridade: "media",
  statusDetalhe: "",
  prazo: "",
  observacoes: "",
};

function toFormValues(process?: OfficeProcess | null): ProcessFormValues {
  if (!process) return { ...EMPTY_FORM };
  return {
    tipoProcesso: process.tipoProcesso,
    numeroProcesso: process.numeroProcesso,
    empreendedorName: process.empreendedorName,
    empreendimentoName: process.empreendimentoName,
    municipio: process.municipio ?? "",
    tipoIntervencao: process.tipoIntervencao ?? "",
    fase: process.fase,
    prioridade: process.prioridade ?? "",
    statusDetalhe: process.statusDetalhe ?? "",
    prazo: process.prazo ?? "",
    observacoes: process.observacoes ?? "",
  };
}

type ProcessFormCadastroContext = {
  projectId?: string;
  consultoriaProjectId?: string;
};

type ProcessFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: OfficeProcess | null;
  defaults?: Partial<ProcessFormValues>;
  saving?: boolean;
  onSubmit: (values: ProcessFormValues) => void | Promise<void>;
  cadastroById?: ReadonlyMap<string, Project>;
  consultoriaProjects?: ConsultoriaProject[];
  /** Vínculo cadastral na criação (antes de existir `initial`). */
  cadastroContext?: ProcessFormCadastroContext;
};

export function ProcessFormDialog({
  open,
  onOpenChange,
  initial,
  defaults,
  saving,
  onSubmit,
  cadastroById,
  consultoriaProjects,
  cadastroContext,
}: ProcessFormDialogProps) {
  const [form, setForm] = React.useState<ProcessFormValues>(toFormValues(initial));

  React.useEffect(() => {
    if (open) {
      setForm({
        ...toFormValues(initial),
        ...(initial ? {} : defaults),
      });
    }
  }, [open, initial, defaults]);

  const coordenadasPreview = React.useMemo(() => {
    if (!cadastroById) return "";
    return formatOfficeProcessCoordinates(
      {
        projectId: initial?.projectId ?? cadastroContext?.projectId,
        consultoriaProjectId:
          initial?.consultoriaProjectId ?? cadastroContext?.consultoriaProjectId,
      },
      cadastroById,
      consultoriaProjects ?? [],
    );
  }, [cadastroById, cadastroContext, consultoriaProjects, initial]);

  const set =
    (key: keyof ProcessFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Editar processo" : "Novo processo"}
          </DialogTitle>
          <DialogDescription>
            Informe o número SEI ou do Processo SLA e os dados do empreendimento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.tipoProcesso}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, tipoProcesso: v as OfficeProcessTipo }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sei">SEI</SelectItem>
                  <SelectItem value="sla">SLA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numeroProcesso">Nº processo</Label>
              <Input
                id="numeroProcesso"
                value={form.numeroProcesso}
                onChange={set("numeroProcesso")}
                placeholder="2100.01.0000000/2025-00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="empreendedorName">Empreendedor</Label>
            <Input
              id="empreendedorName"
              value={form.empreendedorName}
              onChange={set("empreendedorName")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="empreendimentoName">Empreendimento</Label>
            <Input
              id="empreendimentoName"
              value={form.empreendimentoName}
              onChange={set("empreendimentoName")}
            />
          </div>
          {coordenadasPreview ? (
            <p className="font-mono text-[11px] leading-snug text-muted-foreground">
              Coordenadas (SIRGAS 2000): {coordenadasPreview}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="municipio">Município</Label>
              <Input id="municipio" value={form.municipio} onChange={set("municipio")} />
            </div>
            <div className="space-y-1.5">
              <Label>Fase</Label>
              <Select
                value={form.fase}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, fase: v as OfficeProcessFase }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(OFFICE_PROCESS_FASE_LABELS) as OfficeProcessFase[]).map(
                    (f) => (
                      <SelectItem key={f} value={f}>
                        {OFFICE_PROCESS_FASE_LABELS[f]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select
                value={form.prioridade || "__none__"}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    prioridade: v === "__none__" ? "" : (v as OfficeProcessPrioridade),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem prioridade</SelectItem>
                  {(
                    Object.entries(OFFICE_PROCESS_PRIORIDADE_LABELS) as [
                      OfficeProcessPrioridade,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tipoIntervencao">Tipo de intervenção</Label>
            <Input
              id="tipoIntervencao"
              value={form.tipoIntervencao}
              onChange={set("tipoIntervencao")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="statusDetalhe">Status (texto livre)</Label>
            <Input
              id="statusDetalhe"
              value={form.statusDetalhe}
              onChange={set("statusDetalhe")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prazo">Prazo (aaaa-mm-dd)</Label>
            <Input id="prazo" type="date" value={form.prazo} onChange={set("prazo")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={form.observacoes}
              onChange={set("observacoes")}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving || !form.numeroProcesso.trim()}
            onClick={() => onSubmit(form)}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
