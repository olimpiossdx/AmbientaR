"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useCollection, useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ArrowLeft,
  Building2,
  Link2,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Empreendedor, Project } from "@/lib/types";
import {
  GESTAO_PROCESSOS_PROJETOS_PATH,
} from "@/lib/gestao-processos-menu";
import {
  canWriteGestaoProcessos,
  isGestaoProcessosPortalReadOnly,
} from "@/lib/gestao-processos/role-guards";
import type {
  ConsultoriaProject,
  ConsultoriaProjectPlannedProcessType,
  OfficeProcess,
} from "@/lib/gestao-processos/types";
import {
  CONSULTORIA_PROJECT_STATUS_LABELS,
  buildConsultoriaProjectCode,
  consultoriaProjectVisibleToPortal,
  PLANNED_PROCESS_TYPE_GROUP,
  PLANNED_PROCESS_TYPE_INTERVENCAO,
  PLANNED_PROCESS_TYPE_LABELS,
} from "@/lib/gestao-processos/consultoria-project-utils";
import { defaultPipelineFieldsForNewProcess } from "@/lib/gestao-processos/pipeline-utils";
import { buildOfficeProcessExternalKey } from "@/lib/gestao-processos/utils";
import {
  computeConsultoriaProjectProcessStats,
  summarizeProjectAlerts,
  PROCESS_ALERT_LABELS,
} from "@/lib/gestao-processos/process-alerts";
import { ConsultoriaProjectProcessGroups } from "@/components/gestao-processos/consultoria-project-process-groups";
import { Progress } from "@/components/ui/progress";
import {
  linkProcessToConsultoriaProject,
  linkProcessesToConsultoriaProject,
  clearConsultoriaProjectLinks,
} from "@/lib/gestao-processos/office-process-import";
import {
  ConsultoriaProjectFormDialog,
  type ConsultoriaProjectFormValues,
} from "@/components/gestao-processos/consultoria-project-form-dialog";
import {
  ProcessFormDialog,
  type ProcessFormValues,
} from "@/components/gestao-processos/process-form-dialog";
import { LinkProcessesDialog } from "@/components/gestao-processos/link-processes-dialog";
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

export default function ConsultoriaProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id ?? "";
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const canWrite = canWriteGestaoProcessos(user?.role);
  const isPortalReadOnly = isGestaoProcessosPortalReadOnly(user?.role);

  const [portalEmpIds, setPortalEmpIds] = React.useState<string[] | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [activePlannedType, setActivePlannedType] =
    React.useState<ConsultoriaProjectPlannedProcessType | null>(null);
  const [processFormOpen, setProcessFormOpen] = React.useState(false);
  const [linking, setLinking] = React.useState(false);
  const [unlinkingId, setUnlinkingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savingProcess, setSavingProcess] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const projectRef = useMemoFirebase(
    () =>
      firestore && projectId
        ? doc(firestore, "consultoriaProjects", projectId)
        : null,
    [firestore, projectId],
  );
  const { data: project, isLoading } = useDoc<ConsultoriaProject>(projectRef);

  const allProjectsQuery = useMemoFirebase(
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

  const { data: allConsultoriaProjects } =
    useCollection<ConsultoriaProject>(allProjectsQuery);
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
    if (!project || !isPortalReadOnly || !portalEmpIds) return;
    if (!consultoriaProjectVisibleToPortal(project, portalEmpIds)) {
      router.replace(GESTAO_PROCESSOS_PROJETOS_PATH);
    }
  }, [project, isPortalReadOnly, portalEmpIds, router]);

  const linkedProcesses = React.useMemo(
    () =>
      (officeProcesses ?? []).filter((p) => p.consultoriaProjectId === projectId),
    [officeProcesses, projectId],
  );

  const projectStats = React.useMemo(
    () => computeConsultoriaProjectProcessStats(linkedProcesses),
    [linkedProcesses],
  );

  const projectAlerts = React.useMemo(
    () => summarizeProjectAlerts(linkedProcesses),
    [linkedProcesses],
  );

  const processDefaults = React.useMemo<Partial<ProcessFormValues> | undefined>(() => {
    if (!project || !activePlannedType) return undefined;
    const shortCode: Record<ConsultoriaProjectPlannedProcessType, string> = {
      licenca_ambiental: "LIC",
      daia_supressao: "DAIA",
      outorga: "OUT",
      uso_insignificante: "USI",
    };
    return {
      tipoProcesso: "sei",
      numeroProcesso: `${project.code ?? "PRJ"}-${shortCode[activePlannedType]}`,
      empreendedorName: project.empreendedorName ?? "",
      empreendimentoName: project.empreendimentoName ?? project.name,
      municipio: project.municipio ?? "",
      tipoIntervencao: PLANNED_PROCESS_TYPE_INTERVENCAO[activePlannedType],
      fase: "elaboracao",
      prioridade: "media",
      statusDetalhe: "Previsto / em preparação",
      observacoes: `Processo criado a partir da frente ${PLANNED_PROCESS_TYPE_LABELS[activePlannedType]} do projeto ${project.name}.`,
    };
  }, [activePlannedType, project]);

  const openLinkForPlannedType = (
    plannedType?: ConsultoriaProjectPlannedProcessType,
  ) => {
    setActivePlannedType(plannedType ?? null);
    setLinkOpen(true);
  };

  const openCreateProcessForPlannedType = (
    plannedType: ConsultoriaProjectPlannedProcessType,
  ) => {
    setActivePlannedType(plannedType);
    setProcessFormOpen(true);
  };

  const handleLinkProcesses = async (processIds: string[]) => {
    if (!firestore || !project) return;
    setLinking(true);
    try {
      const count = await linkProcessesToConsultoriaProject(
        firestore,
        processIds,
        project.id,
        activePlannedType,
      );
      toast({
        title: "Processos vinculados",
        description: `${count} processo(s) associado(s) ao projeto${
          activePlannedType
            ? ` na frente ${PLANNED_PROCESS_TYPE_LABELS[activePlannedType]}`
            : ""
        }.`,
      });
      setLinkOpen(false);
      setActivePlannedType(null);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao vincular",
        description: (e as Error).message,
      });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkProcess = async (processId: string) => {
    if (!firestore) return;
    setUnlinkingId(processId);
    try {
      await linkProcessToConsultoriaProject(firestore, processId, null);
      toast({ title: "Processo desvinculado" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao desvincular",
        description: (e as Error).message,
      });
    } finally {
      setUnlinkingId(null);
    }
  };

  const persistOfficeProcess = async (values: ProcessFormValues) => {
    if (!firestore || !project || !activePlannedType) return;
    setSavingProcess(true);
    try {
      const numeroProcesso = values.numeroProcesso.trim();
      const externalKey = buildOfficeProcessExternalKey(
        values.tipoProcesso,
        numeroProcesso,
      );
      const ref = doc(collection(firestore, "officeProcesses"));
      await setDoc(ref, omitUndefined({
        externalKey,
        tipoProcesso: values.tipoProcesso,
        numeroProcesso,
        empreendedorName: values.empreendedorName.trim() || project.empreendedorName || "—",
        empreendimentoName:
          values.empreendimentoName.trim() || project.empreendimentoName || project.name,
        municipio: values.municipio.trim() || project.municipio,
        tipoIntervencao:
          values.tipoIntervencao.trim() ||
          PLANNED_PROCESS_TYPE_INTERVENCAO[activePlannedType],
        processGroup: PLANNED_PROCESS_TYPE_GROUP[activePlannedType],
        plannedProcessType: activePlannedType,
        fase: values.fase,
        prioridade: values.prioridade || undefined,
        statusDetalhe: values.statusDetalhe.trim() || undefined,
        prazo: values.prazo || undefined,
        observacoes: values.observacoes.trim() || undefined,
        empreendedorId: project.empreendedorId,
        projectId: project.projectId,
        consultoriaProjectId: project.id,
        fonte: "app",
        ...defaultPipelineFieldsForNewProcess(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
      toast({
        title: "Processo criado",
        description: `${PLANNED_PROCESS_TYPE_LABELS[activePlannedType]} vinculado ao projeto.`,
      });
      setProcessFormOpen(false);
      setActivePlannedType(null);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao criar processo",
        description: (e as Error).message,
      });
    } finally {
      setSavingProcess(false);
    }
  };

  const empreendedoresMap = React.useMemo(
    () => new Map((empreendedores ?? []).map((e) => [e.id, e.name])),
    [empreendedores],
  );

  const persistProject = async (values: ConsultoriaProjectFormValues) => {
    if (!firestore || !project) return;
    setSaving(true);
    try {
      const empreendedorName = empreendedoresMap.get(values.empreendedorId) ?? "";
      const empreendimentoName = values.projectId
        ? (cadastroProjects ?? []).find((p) => p.id === values.projectId)?.propertyName
        : undefined;

      const payload = omitUndefined({
        name: values.name.trim(),
        code: values.code.trim() || project.code,
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
        managerName: values.managerName.trim() || project.managerName,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(firestore, "consultoriaProjects", project.id), payload);
      toast({ title: "Projeto atualizado" });
      setFormOpen(false);
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
    if (!firestore || !project) return;
    setDeleting(true);
    try {
      await clearConsultoriaProjectLinks(
        firestore,
        project.id,
        officeProcesses ?? [],
      );
      await deleteDoc(doc(firestore, "consultoriaProjects", project.id));
      toast({ title: "Projeto removido" });
      router.push(GESTAO_PROCESSOS_PROJETOS_PATH);
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

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
        <Button variant="link" className="mt-2 px-0" asChild>
          <Link href={GESTAO_PROCESSOS_PROJETOS_PATH}>Voltar para projetos</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader title={project.name} description={project.code ?? undefined}>
        {canWrite ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        ) : null}
      </PageHeader>

      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" size="sm" className="-mt-2" asChild>
          <Link href={GESTAO_PROCESSOS_PROJETOS_PATH}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para projetos
          </Link>
        </Button>

        {linkedProcesses.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                { label: "Processos", value: projectStats.total },
                { label: "Em tramitação", value: projectStats.emTramitacao },
                { label: "Exigências", value: projectStats.exigencia, warn: true },
                { label: "Prazos vencidos", value: projectStats.prazosVencidos, warn: true },
                { label: "Concluídos", value: projectStats.concluidos },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <p
                      className={cn(
                        "text-2xl font-semibold tabular-nums",
                        stat.warn && stat.value > 0 && "text-amber-600",
                      )}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso geral</span>
                  <span className="font-medium tabular-nums">
                    {projectStats.progressPct}%
                  </span>
                </div>
                <Progress value={projectStats.progressPct} className="h-2" />
              </CardContent>
            </Card>

            {projectAlerts.length > 0 ? (
              <Card className="border-amber-500/40 bg-amber-500/5">
                <CardContent className="flex flex-wrap items-center gap-2 p-4">
                  <span className="text-sm font-medium">Alertas:</span>
                  {projectAlerts.map(({ kind, count }) => (
                    <Badge key={kind} variant="outline">
                      {count} {PROCESS_ALERT_LABELS[kind].toLowerCase()}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                {project.code ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {project.code}
                  </span>
                ) : null}
                <Badge variant="outline" className={statusBadgeClass(project.status)}>
                  {CONSULTORIA_PROJECT_STATUS_LABELS[project.status]}
                </Badge>
              </div>
              <CardTitle className="text-xl">{project.name}</CardTitle>
              {project.tipoAtividade ? (
                <p className="text-sm text-muted-foreground">{project.tipoAtividade}</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {project.empreendedorName ? (
                <div className="flex gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Empreendedor</p>
                    <p className="font-medium">{project.empreendedorName}</p>
                  </div>
                </div>
              ) : null}
              {project.empreendimentoName ? (
                <div>
                  <p className="text-xs text-muted-foreground">Empreendimento</p>
                  <p className="font-medium">{project.empreendimentoName}</p>
                </div>
              ) : null}
              {project.municipio ? (
                <div className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Município</p>
                    <p>{project.municipio}</p>
                  </div>
                </div>
              ) : null}
              {project.area ? (
                <div>
                  <p className="text-xs text-muted-foreground">Área</p>
                  <p>{project.area}</p>
                </div>
              ) : null}
              {project.managerName ? (
                <div>
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p>{project.managerName}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">
              Frentes ambientais do projeto
            </CardTitle>
            {canWrite ? (
              <Button size="sm" variant="outline" onClick={() => openLinkForPlannedType()}>
                <Link2 className="mr-2 h-4 w-4" />
                Vincular processos
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            <ConsultoriaProjectProcessGroups
              plannedProcessTypes={project.plannedProcessTypes}
              processes={linkedProcesses}
              canWrite={canWrite}
              unlinkingId={unlinkingId}
              onCreateFromPlanned={canWrite ? openCreateProcessForPlannedType : undefined}
              onLink={canWrite ? openLinkForPlannedType : undefined}
              onUnlink={canWrite ? handleUnlinkProcess : undefined}
              defaultOpenAll={!isPortalReadOnly}
            />
          </CardContent>
        </Card>
      </div>

      <LinkProcessesDialog
        open={linkOpen}
        onOpenChange={(open) => {
          setLinkOpen(open);
          if (!open) setActivePlannedType(null);
        }}
        project={project}
        processes={officeProcesses ?? []}
        plannedProcessType={activePlannedType}
        linking={linking}
        onConfirm={handleLinkProcesses}
      />

      <ProcessFormDialog
        open={processFormOpen}
        onOpenChange={(open) => {
          setProcessFormOpen(open);
          if (!open) setActivePlannedType(null);
        }}
        defaults={processDefaults}
        saving={savingProcess}
        onSubmit={persistOfficeProcess}
      />

      <ConsultoriaProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={project}
        suggestedCode={buildConsultoriaProjectCode(allConsultoriaProjects ?? [])}
        saving={saving}
        onSubmit={persistProject}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto &quot;{project.name}&quot; será excluído permanentemente.
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
