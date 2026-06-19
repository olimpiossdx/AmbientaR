"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSearchInput } from "@/components/card-search-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Building2,
  ChevronRight,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Empreendedor, Project } from "@/lib/types";
import Link from "next/link";
import {
  GESTAO_PROCESSOS_PROJETOS_LABEL,
  GESTAO_PROCESSOS_FLUXO_PATH,
  gestaoProcessosProjetoDetailPath,
} from "@/lib/gestao-processos-menu";
import {
  canWriteGestaoProcessos,
  isGestaoProcessosPortalReadOnly,
} from "@/lib/gestao-processos/role-guards";
import type {
  ConsultoriaProject,
  OfficeProcess,
} from "@/lib/gestao-processos/types";
import {
  CONSULTORIA_PROJECT_STATUS_LABELS,
  buildConsultoriaProjectCode,
  consultoriaProjectSearchBlob,
  consultoriaProjectVisibleToPortal,
  countOrphanProcesses,
} from "@/lib/gestao-processos/consultoria-project-utils";
import { autoLinkProcessesToProjects, clearConsultoriaProjectLinks } from "@/lib/gestao-processos/office-process-import";
import {
  ConsultoriaProjectFormDialog,
  type ConsultoriaProjectFormValues,
} from "@/components/gestao-processos/consultoria-project-form-dialog";
import { fetchEmpreendedorIdsForProcessosPortal } from "@/lib/requests-portal-empreendedor-ids";
import { cn } from "@/lib/utils";

function omitUndefined(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );
}

function statusBadgeClass(status: ConsultoriaProject["status"]): string {
  return cn(
    status === "ativo" && "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    status === "suspenso" && "bg-amber-500/15 text-amber-800 border-amber-500/30",
    status === "concluido" && "bg-slate-500/15 text-slate-700 border-slate-500/30",
    status === "cancelado" && "bg-red-500/15 text-red-700 border-red-500/30",
  );
}

export default function GestaoProcessosProjetosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const createRequested = searchParams?.get("novo") === "1";
  const canWrite = canWriteGestaoProcessos(user?.role);
  const isPortalReadOnly = isGestaoProcessosPortalReadOnly(user?.role);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [portalEmpIds, setPortalEmpIds] = React.useState<string[] | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ConsultoriaProject | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ConsultoriaProject | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [autoLinking, setAutoLinking] = React.useState(false);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "consultoriaProjects") : null),
    [firestore],
  );
  const processesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "officeProcesses") : null),
    [firestore],
  );
  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const cadastroProjectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );

  const { data: projects, isLoading } =
    useCollection<ConsultoriaProject>(projectsQuery);
  const { data: officeProcesses } = useCollection<OfficeProcess>(processesQuery);
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const { data: cadastroProjects } = useCollection<Project>(cadastroProjectsQuery);

  React.useEffect(() => {
    if (!firestore || !user || !isPortalReadOnly) {
      setPortalEmpIds(null);
      return;
    }
    let cancelled = false;
    void fetchEmpreendedorIdsForProcessosPortal(firestore, user).then((ids) => {
      if (!cancelled) setPortalEmpIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [firestore, user, isPortalReadOnly]);

  React.useEffect(() => {
    if (!createRequested || !canWrite) return;
    setEditing(null);
    setFormOpen(true);
  }, [createRequested, canWrite]);

  const empreendedoresMap = React.useMemo(
    () => new Map((empreendedores ?? []).map((e) => [e.id, e.name])),
    [empreendedores],
  );

  const processCountByProject = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of officeProcesses ?? []) {
      if (!p.consultoriaProjectId) continue;
      map.set(p.consultoriaProjectId, (map.get(p.consultoriaProjectId) ?? 0) + 1);
    }
    return map;
  }, [officeProcesses]);

  const visibleProjects = React.useMemo(() => {
    let list = [...(projects ?? [])];
    if (isPortalReadOnly && portalEmpIds) {
      list = list.filter((p) => consultoriaProjectVisibleToPortal(p, portalEmpIds));
    }
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((p) => consultoriaProjectSearchBlob(p).includes(term));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [projects, searchTerm, isPortalReadOnly, portalEmpIds]);

  const suggestedCode = React.useMemo(
    () => buildConsultoriaProjectCode(projects ?? []),
    [projects],
  );

  const stats = React.useMemo(() => {
    const list = visibleProjects;
    const withProcesses = list.filter(
      (p) => (processCountByProject.get(p.id) ?? 0) > 0,
    ).length;
    const inTramitacao = (officeProcesses ?? []).filter(
      (p) =>
        p.consultoriaProjectId &&
        list.some((cp) => cp.id === p.consultoriaProjectId) &&
        p.fase !== "concluido" &&
        p.fase !== "arquivado",
    ).length;
    return {
      total: list.length,
      ativos: list.filter((p) => p.status === "ativo").length,
      comProcessos: withProcesses,
      emTramitacao: inTramitacao,
      orfaos: countOrphanProcesses(officeProcesses ?? []),
    };
  }, [visibleProjects, processCountByProject, officeProcesses]);

  const handleAutoLink = async () => {
    if (!firestore || !projects?.length || !officeProcesses?.length) return;
    setAutoLinking(true);
    try {
      const linked = await autoLinkProcessesToProjects(
        firestore,
        officeProcesses,
        projects,
      );
      toast({
        title: linked ? "Vínculos sugeridos aplicados" : "Nenhum vínculo automático",
        description: linked
          ? `${linked} processo(s) associado(s) com base em empreendedor e empreendimento.`
          : "Não há processos órfãos com correspondência única de projeto.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao vincular",
        description: (e as Error).message,
      });
    } finally {
      setAutoLinking(false);
    }
  };

  const clearCreateQuery = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("novo");
    const q = params.toString();
    router.replace(q ? `/gestao-processos/projetos?${q}` : "/gestao-processos/projetos", {
      scroll: false,
    });
  };

  const openCreateForm = () => {
    setEditing(null);
    setFormOpen(true);
    router.replace("/gestao-processos/projetos?novo=1", { scroll: false });
  };

  const persistProject = async (
    values: ConsultoriaProjectFormValues,
    existing?: ConsultoriaProject | null,
  ) => {
    if (!firestore) return;
    setSaving(true);
    try {
      const empreendedorName = empreendedoresMap.get(values.empreendedorId) ?? "";
      const empreendimentoName = values.projectId
        ? (cadastroProjects ?? []).find((p) => p.id === values.projectId)?.propertyName
        : undefined;

      const payload = omitUndefined({
        name: values.name.trim(),
        code: values.code.trim() || suggestedCode,
        status: values.status,
        empreendedorId: values.empreendedorId,
        empreendedorName: empreendedorName || undefined,
        projectId: values.projectId || undefined,
        empreendimentoName,
        tipoAtividade: values.tipoAtividade.trim() || undefined,
        municipio: values.municipio.trim() || undefined,
        area: values.area.trim() || undefined,
        description: values.description.trim() || undefined,
        plannedProcessTypes: values.plannedProcessTypes,
        managerName: values.managerName.trim() || user?.name || undefined,
        managerUid: user?.uid || undefined,
        updatedAt: serverTimestamp(),
      });

      if (existing?.id) {
        await updateDoc(doc(firestore, "consultoriaProjects", existing.id), payload);
        toast({ title: "Projeto atualizado" });
        clearCreateQuery();
      } else {
        const ref = doc(collection(firestore, "consultoriaProjects"));
        await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
        toast({ title: "Projeto criado" });
        router.push(gestaoProcessosProjetoDetailPath(ref.id));
      }
      setFormOpen(false);
      setEditing(null);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !deleteTarget) return;
    setDeleting(true);
    try {
      await clearConsultoriaProjectLinks(
        firestore,
        deleteTarget.id,
        officeProcesses ?? [],
      );
      await deleteDoc(doc(firestore, "consultoriaProjects", deleteTarget.id));
      toast({ title: "Projeto removido" });
      setDeleteTarget(null);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: (e as Error).message,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={GESTAO_PROCESSOS_PROJETOS_LABEL}
        description="Casos da consultoria e conjuntos de processos ambientais por empreendedor e empreendimento."
      >
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={autoLinking || !officeProcesses?.length}
              onClick={() => void handleAutoLink()}
            >
              {autoLinking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Sugerir vínculos automáticos
            </Button>
            <Button size="sm" onClick={openCreateForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo projeto
            </Button>
          </div>
        ) : null}
      </PageHeader>

      <div className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "Total de projetos", value: stats.total },
            { label: "Projetos ativos", value: stats.ativos },
            { label: "Com processos vinculados", value: stats.comProcessos },
            { label: "Processos em tramitação", value: stats.emTramitacao },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
          <Card
            className={cn(
              stats.orfaos > 0 && canWrite && "cursor-pointer transition-shadow hover:shadow-md",
            )}
            onClick={
              canWrite && stats.orfaos > 0
                ? () => router.push(`${GESTAO_PROCESSOS_FLUXO_PATH}?sem_projeto=1`)
                : undefined
            }
          >
            <CardContent className="p-4">
              <p
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  stats.orfaos > 0 && "text-amber-600",
                )}
              >
                {stats.orfaos}
              </p>
              <p className="text-xs text-muted-foreground">
                Processos sem projeto
                {canWrite && stats.orfaos > 0 ? (
                  <>
                    {" · "}
                    <Link
                      href={`${GESTAO_PROCESSOS_FLUXO_PATH}?sem_projeto=1`}
                      className="text-primary underline-offset-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ver no fluxo
                    </Link>
                  </>
                ) : null}
              </p>
            </CardContent>
          </Card>
        </div>

        <CardSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por projeto, empreendedor, município ou tipo…"
        />

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-lg" />
            ))}
          </div>
        ) : visibleProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-sm font-medium">Nenhum projeto cadastrado</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Crie um projeto de consultoria vinculado a um empreendedor e, se
                desejar, a um empreendimento já cadastrado. Depois associe os
                processos pelo detalhe do projeto, importação Excel ou vínculos
                automáticos.
              </p>
              {canWrite ? (
                <Button variant="outline" size="sm" onClick={openCreateForm}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo projeto
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((project) => {
              const procCount = processCountByProject.get(project.id) ?? 0;
              return (
                <Card
                  key={project.id}
                  className="cursor-pointer border-border/80 transition-shadow hover:shadow-md"
                  onClick={() =>
                    router.push(gestaoProcessosProjetoDetailPath(project.id))
                  }
                >
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      {project.code ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {project.code}
                        </span>
                      ) : (
                        <span />
                      )}
                      <Badge
                        variant="outline"
                        className={statusBadgeClass(project.status)}
                      >
                        {CONSULTORIA_PROJECT_STATUS_LABELS[project.status]}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold leading-snug">{project.name}</h3>
                      {project.tipoAtividade ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {project.tipoAtividade}
                        </p>
                      ) : null}
                    </div>

                    {project.empreendedorName ? (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{project.empreendedorName}</span>
                      </p>
                    ) : null}

                    {project.municipio ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {project.municipio}
                      </p>
                    ) : null}

                    {project.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {project.description}
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between border-t pt-2.5">
                      <span className="text-xs text-muted-foreground">
                        {project.managerName ?? "—"}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                        {procCount} processo{procCount !== 1 ? "s" : ""}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    {canWrite ? (
                      <div
                        className="flex gap-1 pt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Editar"
                          onClick={() => {
                            setEditing(project);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label="Excluir"
                          onClick={() => setDeleteTarget(project)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConsultoriaProjectFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            if (createRequested) clearCreateQuery();
          }
        }}
        initial={editing}
        suggestedCode={suggestedCode}
        saving={saving}
        onSubmit={(values) => persistProject(values, editing)}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto &quot;{deleteTarget?.name}&quot; será excluído. Os processos
              na plataforma não serão apagados — apenas perderão o vínculo com
              este projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
