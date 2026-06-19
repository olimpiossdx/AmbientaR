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
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, limit, query } from "firebase/firestore";
import type { Empreendedor, Project } from "@/lib/types";
import type {
  ConsultoriaProject,
  ConsultoriaProjectStatus,
} from "@/lib/gestao-processos/types";
import { CONSULTORIA_PROJECT_STATUS_LABELS } from "@/lib/gestao-processos/consultoria-project-utils";
import { Loader2 } from "lucide-react";

export type ConsultoriaProjectFormValues = {
  name: string;
  code: string;
  status: ConsultoriaProjectStatus;
  empreendedorId: string;
  projectId: string;
  tipoAtividade: string;
  municipio: string;
  area: string;
  description: string;
  managerName: string;
};

const EMPTY_FORM: ConsultoriaProjectFormValues = {
  name: "",
  code: "",
  status: "ativo",
  empreendedorId: "",
  projectId: "",
  tipoAtividade: "",
  municipio: "",
  area: "",
  description: "",
  managerName: "",
};

function toFormValues(project?: ConsultoriaProject | null): ConsultoriaProjectFormValues {
  if (!project) return { ...EMPTY_FORM };
  return {
    name: project.name,
    code: project.code ?? "",
    status: project.status,
    empreendedorId: project.empreendedorId ?? "",
    projectId: project.projectId ?? "",
    tipoAtividade: project.tipoAtividade ?? "",
    municipio: project.municipio ?? "",
    area: project.area ?? "",
    description: project.description ?? "",
    managerName: project.managerName ?? "",
  };
}

type ConsultoriaProjectFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ConsultoriaProject | null;
  suggestedCode?: string;
  saving?: boolean;
  onSubmit: (values: ConsultoriaProjectFormValues) => void | Promise<void>;
};

export function ConsultoriaProjectFormDialog({
  open,
  onOpenChange,
  initial,
  suggestedCode,
  saving,
  onSubmit,
}: ConsultoriaProjectFormDialogProps) {
  const { firestore } = useFirebase();
  const [form, setForm] = React.useState<ConsultoriaProjectFormValues>(() =>
    toFormValues(initial),
  );

  React.useEffect(() => {
    if (open) {
      const base = toFormValues(initial);
      if (!initial && suggestedCode) {
        base.code = suggestedCode;
      }
      setForm(base);
    }
  }, [open, initial, suggestedCode]);

  const empreendedoresQ = useMemoFirebase(
    () =>
      firestore ? query(collection(firestore, "empreendedores"), limit(500)) : null,
    [firestore],
  );
  const projectsQ = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "projects"), limit(500)) : null),
    [firestore],
  );

  const { data: empreendedores, isLoading: loadingEmp } =
    useCollection<Empreendedor>(empreendedoresQ);
  const { data: allProjects, isLoading: loadingProjects } =
    useCollection<Project>(projectsQ);

  const empreendedoresSorted = React.useMemo(
    () =>
      [...(empreendedores ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      ),
    [empreendedores],
  );

  const projectsForEmpreendedor = React.useMemo(() => {
    if (!form.empreendedorId) return [];
    return (allProjects ?? [])
      .filter((p) => p.empreendedorId === form.empreendedorId)
      .sort((a, b) => a.propertyName.localeCompare(b.propertyName, "pt-BR"));
  }, [allProjects, form.empreendedorId]);

  const set =
    (key: keyof ConsultoriaProjectFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleEmpreendedorChange = (empreendedorId: string) => {
    setForm((prev) => ({
      ...prev,
      empreendedorId,
      projectId: "",
    }));
  };

  const handleProjectChange = (projectId: string) => {
    const project = (allProjects ?? []).find((p) => p.id === projectId);
    setForm((prev) => ({
      ...prev,
      projectId,
      municipio: project?.municipio?.trim() || prev.municipio,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.empreendedorId) return;
    void onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initial ? "Editar projeto" : "Novo projeto de consultoria"}
            </DialogTitle>
            <DialogDescription>
              Vincule o caso a um empreendedor e, se aplicável, a um empreendimento
              cadastrado na plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="cp-code">Código</Label>
                <Input
                  id="cp-code"
                  value={form.code}
                  onChange={set("code")}
                  placeholder="PRJ-2026-001"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="cp-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, status: v as ConsultoriaProjectStatus }))
                  }
                >
                  <SelectTrigger id="cp-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(CONSULTORIA_PROJECT_STATUS_LABELS) as [
                        ConsultoriaProjectStatus,
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
              <Label htmlFor="cp-name">Nome do projeto *</Label>
              <Input
                id="cp-name"
                value={form.name}
                onChange={set("name")}
                placeholder="Ex.: UHE Araguari — Implantação"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cp-emp">Empreendedor *</Label>
              <Select
                value={form.empreendedorId || undefined}
                onValueChange={handleEmpreendedorChange}
                disabled={loadingEmp}
              >
                <SelectTrigger id="cp-emp">
                  <SelectValue
                    placeholder={
                      loadingEmp ? "Carregando…" : "Selecione o empreendedor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {empreendedoresSorted.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cp-project">Empreendimento (opcional)</Label>
              <Select
                value={form.projectId || undefined}
                onValueChange={handleProjectChange}
                disabled={!form.empreendedorId || loadingProjects}
              >
                <SelectTrigger id="cp-project">
                  <SelectValue
                    placeholder={
                      !form.empreendedorId
                        ? "Selecione um empreendedor primeiro"
                        : loadingProjects
                          ? "Carregando…"
                          : projectsForEmpreendedor.length === 0
                            ? "Nenhum empreendimento cadastrado"
                            : "Selecione o empreendimento"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projectsForEmpreendedor.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.propertyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cp-tipo">Tipo de atividade</Label>
                <Input
                  id="cp-tipo"
                  value={form.tipoAtividade}
                  onChange={set("tipoAtividade")}
                  placeholder="Ex.: Geração de energia"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-mun">Município</Label>
                <Input
                  id="cp-mun"
                  value={form.municipio}
                  onChange={set("municipio")}
                  placeholder="Ex.: Araguari — MG"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cp-area">Área</Label>
                <Input
                  id="cp-area"
                  value={form.area}
                  onChange={set("area")}
                  placeholder="Ex.: 1.850 ha"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-manager">Gestor / responsável</Label>
                <Input
                  id="cp-manager"
                  value={form.managerName}
                  onChange={set("managerName")}
                  placeholder="Nome do responsável técnico"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cp-desc">Descrição</Label>
              <Textarea
                id="cp-desc"
                value={form.description}
                onChange={set("description")}
                rows={3}
                placeholder="Resumo do escopo e conjunto de processos previstos…"
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
            <Button type="submit" disabled={saving || !form.name.trim() || !form.empreendedorId}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : initial ? (
                "Salvar"
              ) : (
                "Criar projeto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
