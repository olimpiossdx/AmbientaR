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
import type { AppUser, Empreendedor } from "@/lib/types";
import { getRoleLabelPt } from "@/lib/user-role-labels";
import type {
  ConsultoriaProject,
  OfficeProcess,
  OfficeProcessPrioridade,
} from "@/lib/gestao-processos/types";
import type {
  OfficeTask,
  OfficeTaskCategoria,
  OfficeTaskStatus,
} from "@/lib/gestao-processos/task-types";
import {
  OFFICE_TASK_CATEGORIA_OPTIONS,
  OFFICE_TASK_STATUS_OPTIONS,
} from "@/lib/gestao-processos/task-types";
import { OFFICE_PROCESS_PRIORIDADE_LABELS } from "@/components/gestao-processos/process-form-dialog";
import { Loader2 } from "lucide-react";

export type OfficeTaskFormValues = {
  titulo: string;
  descricao: string;
  categoria: OfficeTaskCategoria;
  status: OfficeTaskStatus;
  prioridade: OfficeProcessPrioridade | "";
  prazo: string;
  demandanteUid: string;
  assigneeUid: string;
  empreendedorId: string;
  consultoriaProjectId: string;
  officeProcessId: string;
};

const EMPTY_FORM: OfficeTaskFormValues = {
  titulo: "",
  descricao: "",
  categoria: "outro",
  status: "pendente",
  prioridade: "media",
  prazo: "",
  demandanteUid: "",
  assigneeUid: "",
  empreendedorId: "",
  consultoriaProjectId: "",
  officeProcessId: "",
};

function toFormValues(task?: OfficeTask | null): OfficeTaskFormValues {
  if (!task) return { ...EMPTY_FORM };
  return {
    titulo: task.titulo,
    descricao: task.descricao ?? "",
    categoria: task.categoria,
    status: task.status,
    prioridade: task.prioridade ?? "",
    prazo: task.prazo ?? "",
    demandanteUid: task.demandanteUid ?? task.createdByUid ?? "",
    assigneeUid: task.assigneeUid ?? "",
    empreendedorId: task.empreendedorId ?? "",
    consultoriaProjectId: task.consultoriaProjectId ?? "",
    officeProcessId: task.officeProcessId ?? "",
  };
}

function userOptionLabel(u: AppUser): string {
  const name = u.name || u.email || u.uid;
  const role = getRoleLabelPt(u.role);
  return role ? `${name} · ${role}` : name;
}

type OfficeTaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: OfficeTask | null;
  defaults?: Partial<OfficeTaskFormValues>;
  saving?: boolean;
  onSubmit: (values: OfficeTaskFormValues) => void | Promise<void>;
  internalUsers: AppUser[];
  canAssignToOthers: boolean;
  empreendedores?: Empreendedor[];
  consultoriaProjects?: ConsultoriaProject[];
  officeProcesses?: OfficeProcess[];
};

export function OfficeTaskFormDialog({
  open,
  onOpenChange,
  initial,
  defaults,
  saving,
  onSubmit,
  internalUsers,
  canAssignToOthers,
  empreendedores = [],
  consultoriaProjects = [],
  officeProcesses = [],
}: OfficeTaskFormDialogProps) {
  const [form, setForm] = React.useState<OfficeTaskFormValues>(toFormValues(initial));

  React.useEffect(() => {
    if (open) {
      setForm({
        ...toFormValues(initial),
        ...(initial ? {} : defaults),
      });
    }
  }, [open, initial, defaults]);

  const set =
    (key: keyof OfficeTaskFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const linkedProcesses = React.useMemo(() => {
    if (!form.consultoriaProjectId) return officeProcesses;
    return officeProcesses.filter(
      (p) => p.consultoriaProjectId === form.consultoriaProjectId,
    );
  }, [form.consultoriaProjectId, officeProcesses]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            {canAssignToOthers
              ? "Registe a demanda, o prazo e atribua o responsável pela resolução."
              : "Organize suas demandas do dia — visível para você e para a gestão."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit(form);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="task-titulo">Título *</Label>
            <Input
              id="task-titulo"
              value={form.titulo}
              onChange={set("titulo")}
              placeholder="Ex.: Ligar para o cliente sobre CAR"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-descricao">O que foi pedido</Label>
            <Textarea
              id="task-descricao"
              value={form.descricao}
              onChange={set("descricao")}
              placeholder="Descreva o pedido com detalhe suficiente para executar"
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, categoria: v as OfficeTaskCategoria }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OFFICE_TASK_CATEGORIA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={form.prioridade || "none"}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    prioridade: v === "none" ? "" : (v as OfficeProcessPrioridade),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-prazo">Prazo</Label>
              <Input
                id="task-prazo"
                type="date"
                value={form.prazo}
                onChange={set("prazo")}
              />
            </div>

            {canAssignToOthers ? (
              <div className="space-y-2">
                <Label>Responsável pela resolução</Label>
                <Select
                  value={form.assigneeUid || "none"}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      assigneeUid: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {internalUsers.map((u) => (
                      <SelectItem key={u.uid} value={u.uid}>
                        {userOptionLabel(u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          {canAssignToOthers ? (
            <div className="space-y-2">
              <Label>Demandante da demanda</Label>
              <Select
                value={form.demandanteUid || "none"}
                onValueChange={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    demandanteUid: v === "none" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {internalUsers.map((u) => (
                    <SelectItem key={u.uid} value={u.uid}>
                      {userOptionLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {initial ? (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, status: v as OfficeTaskStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OFFICE_TASK_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {canAssignToOthers ? (
            <>
              <div className="space-y-2">
                <Label>Empreendedor (opcional)</Label>
                <Select
                  value={form.empreendedorId || "none"}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      empreendedorId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {empreendedores.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Projeto de consultoria (opcional)</Label>
                <Select
                  value={form.consultoriaProjectId || "none"}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      consultoriaProjectId: v === "none" ? "" : v,
                      officeProcessId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {consultoriaProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code ? `${p.code} — ` : ""}
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {linkedProcesses.length > 0 ? (
                <div className="space-y-2">
                  <Label>Processo (opcional)</Label>
                  <Select
                    value={form.officeProcessId || "none"}
                    onValueChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        officeProcessId: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {linkedProcesses.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.numeroProcesso}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !form.titulo.trim()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {initial ? "Salvar" : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
