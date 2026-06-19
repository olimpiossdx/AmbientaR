"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { CardSearchInput } from "@/components/card-search-input";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { Empreendedor, Project, Request } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  GESTAO_PROCESSOS_FLUXO_PATH,
  GESTAO_PROCESSOS_FLUXO_LABEL,
} from "@/lib/gestao-processos-menu";
import { consultoriaProjectLabel } from "@/lib/gestao-processos/consultoria-project-utils";
import { inferProcessGroup } from "@/lib/gestao-processos/consultoria-project-utils";
import {
  commitOfficeProcessImport,
  moveProcessEtapa,
} from "@/lib/gestao-processos/office-process-import";
import {
  buildProtocolTransitionPayload,
  computeFluxoKpiStats,
  defaultPipelineFieldsForNewProcess,
  etapaLabel,
  resolveProcessPipelineState,
} from "@/lib/gestao-processos/pipeline-utils";
import {
  canWriteGestaoProcessos,
  isGestaoProcessosPortalReadOnly,
} from "@/lib/gestao-processos/role-guards";
import type {
  ConsultoriaEtapa,
  ConsultoriaProject,
  OfficeProcess,
  OfficeProcessFase,
  OfficeProcessImportPreview,
  OrgaoEtapa,
} from "@/lib/gestao-processos/types";
import {
  OFFICE_PROCESS_FASE_LABELS,
  buildOfficeProcessExternalKey,
  detectTipoProcesso,
  formatPrazoDisplay,
} from "@/lib/gestao-processos/utils";
import {
  formatOfficeProcessCoordinates,
  officeProcessSearchBlobWithCadastro,
} from "@/lib/gestao-processos/cadastro-coordinates";
import {
  officeProcessVisibleToPortal,
  resolveEmpreendedorIdByName,
} from "@/lib/gestao-processos/match-empreendedor";
import { fetchEmpreendedorIdsForProcessosPortal } from "@/lib/requests-portal-empreendedor-ids";
import { ProcessDetailSheet } from "@/components/gestao-processos/process-detail-sheet";
import {
  ProcessFormDialog,
  type ProcessFormValues,
} from "@/components/gestao-processos/process-form-dialog";
import {
  summarizeProjectAlerts,
  PROCESS_ALERT_LABELS,
} from "@/lib/gestao-processos/process-alerts";
import { ProcessAlertsBadges } from "@/components/gestao-processos/process-alerts-badges";
import { FluxoKanban, type FluxoKanbanPipeline } from "@/components/gestao-processos/fluxo-kanban";
import { ProtocolarProcessDialog } from "@/components/gestao-processos/protocolar-process-dialog";
import { ExcelImportDialog } from "@/components/gestao-processos/excel-import-dialog";
import { downloadOfficeProcessExport } from "@/lib/gestao-processos/excel";
import {
  FileDown,
  LayoutGrid,
  List,
  Pencil,
  PlusCircle,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getLicenciamentoStatusLabel,
  formatLicenciamentoSolicitationNumber,
} from "@/lib/licenciamento-tramite-report";
import { LICENCIAMENTO_REQUESTS_PATH } from "@/lib/licenciamento-menu";
import { cn } from "@/lib/utils";

function faseBadgeClass(fase: OfficeProcessFase): string {
  return cn(
    fase === "concluido" && "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    fase === "em_analise" && "bg-blue-500/15 text-blue-800 border-blue-500/30",
    fase === "exigencia" && "bg-amber-500/15 text-amber-800 border-amber-500/30",
    fase === "protocolado" && "bg-violet-500/15 text-violet-800 border-violet-500/30",
    fase === "elaboracao" && "bg-slate-500/15 text-slate-800 border-slate-500/30",
  );
}

function omitUndefinedValues(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );
}

export function GestaoProcessosFluxoView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const faseFilter = searchParams?.get("fase") as OfficeProcessFase | null;
  const semProjetoFilter = searchParams?.get("sem_projeto") === "1";
  const selectedId = searchParams?.get("processo");
  const createRequested = searchParams?.get("novo") === "1";

  const canWrite = canWriteGestaoProcessos(user?.role);
  const isPortalReadOnly = isGestaoProcessosPortalReadOnly(user?.role);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [portalEmpIds, setPortalEmpIds] = React.useState<string[] | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<OfficeProcess | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<OfficeProcess | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [pipelineTab, setPipelineTab] = React.useState<FluxoKanbanPipeline>("orgao");
  const [viewMode, setViewMode] = React.useState<"kanban" | "lista">("kanban");
  const [protocolTarget, setProtocolTarget] = React.useState<OfficeProcess | null>(null);
  const [protocolSaving, setProtocolSaving] = React.useState(false);

  const processesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "officeProcesses") : null),
    [firestore],
  );
  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );
  const requestsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "requests") : null),
    [firestore],
  );
  const consultoriaProjectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "consultoriaProjects") : null),
    [firestore],
  );

  const { data: processes, isLoading } = useCollection<OfficeProcess>(processesQuery);
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const { data: projects } = useCollection<Project>(projectsQuery);
  const { data: requests } = useCollection<Request>(requestsQuery);
  const { data: consultoriaProjects } =
    useCollection<ConsultoriaProject>(consultoriaProjectsQuery);

  const existingByKey = React.useMemo(() => {
    const map = new Map<string, OfficeProcess>();
    for (const p of processes ?? []) {
      map.set(
        p.externalKey || buildOfficeProcessExternalKey(p.tipoProcesso, p.numeroProcesso),
        p,
      );
    }
    return map;
  }, [processes]);

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

  const empreendedorNameMap = React.useMemo(
    () => new Map((empreendedores ?? []).map((e) => [e.id, e.name])),
    [empreendedores],
  );

  const projectsMap = React.useMemo(
    () => new Map((projects ?? []).map((p) => [p.id, p.propertyName])),
    [projects],
  );

  const cadastroById = React.useMemo(
    () => new Map((projects ?? []).map((p) => [p.id, p])),
    [projects],
  );

  const empreendedoresMap = empreendedorNameMap;

  const filteredProcesses = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = [...(processes ?? [])];

    if (isPortalReadOnly && portalEmpIds) {
      list = list.filter((p) =>
        officeProcessVisibleToPortal(p, portalEmpIds, empreendedorNameMap),
      );
    }

    if (faseFilter) {
      list = list.filter((p) => p.fase === faseFilter);
    }

    if (semProjetoFilter) {
      list = list.filter((p) => !p.consultoriaProjectId);
    }

    if (term) {
      list = list.filter((p) =>
        officeProcessSearchBlobWithCadastro(
          p,
          cadastroById,
          consultoriaProjects ?? [],
        ).includes(term),
      );
    }

    return list.sort((a, b) =>
      a.numeroProcesso.localeCompare(b.numeroProcesso, "pt-BR", {
        sensitivity: "base",
      }),
    );
  }, [
    processes,
    searchTerm,
    faseFilter,
    semProjetoFilter,
    isPortalReadOnly,
    portalEmpIds,
    empreendedorNameMap,
    cadastroById,
    consultoriaProjects,
  ]);

  const pipelineFilteredProcesses = React.useMemo(() => {
    return filteredProcesses.filter((p) => {
      const { pipeline } = resolveProcessPipelineState(p);
      if (pipelineTab === "consultoria") return pipeline === "consultoria";
      return pipeline === "orgao" || pipeline === "encerrado";
    });
  }, [filteredProcesses, pipelineTab]);

  const kpiStats = React.useMemo(
    () => computeFluxoKpiStats(filteredProcesses),
    [filteredProcesses],
  );

  const fluxoAlerts = React.useMemo(
    () => summarizeProjectAlerts(filteredProcesses),
    [filteredProcesses],
  );

  const activeRequests = React.useMemo(() => {
    let list = (requests ?? []).filter((r) => r.status !== "Completed");
    if (isPortalReadOnly && portalEmpIds) {
      list = list.filter((r) => portalEmpIds.includes(r.empreendedorId));
    }
    return list.sort((a, b) =>
      (a.solicitationNumber ?? a.id).localeCompare(
        b.solicitationNumber ?? b.id,
        "pt-BR",
      ),
    );
  }, [requests, isPortalReadOnly, portalEmpIds]);

  const selectedProcess = React.useMemo(
    () => filteredProcesses.find((p) => p.id === selectedId) ?? null,
    [filteredProcesses, selectedId],
  );

  React.useEffect(() => {
    setSheetOpen(Boolean(selectedId && selectedProcess));
  }, [selectedId, selectedProcess]);

  React.useEffect(() => {
    if (!createRequested || !canWrite) return;
    setEditing(null);
    setFormOpen(true);
  }, [createRequested, canWrite]);

  const replaceProcessQuery = (params: URLSearchParams) => {
    const q = params.toString();
    router.replace(q ? `${GESTAO_PROCESSOS_FLUXO_PATH}?${q}` : GESTAO_PROCESSOS_FLUXO_PATH, {
      scroll: false,
    });
  };

  const removeCreateRequest = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("novo");
    replaceProcessQuery(params);
  };

  const openCreateForm = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("processo");
    params.set("novo", "1");
    setEditing(null);
    setFormOpen(true);
    replaceProcessQuery(params);
  };

  const openProcess = (id: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("novo");
    params.set("processo", id);
    replaceProcessQuery(params);
  };

  const closeSheet = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("processo");
    replaceProcessQuery(params);
    setSheetOpen(false);
  };

  const persistProcess = async (values: ProcessFormValues, existing?: OfficeProcess | null) => {
    if (!firestore) return;
    setSaving(true);
    try {
      let createdProcessId: string | null = null;
      const externalKey = buildOfficeProcessExternalKey(
        values.tipoProcesso,
        values.numeroProcesso,
      );
      const payload = omitUndefinedValues({
        externalKey,
        tipoProcesso: values.tipoProcesso,
        numeroProcesso: values.numeroProcesso.trim(),
        empreendedorName: values.empreendedorName.trim() || "—",
        empreendimentoName: values.empreendimentoName.trim() || "—",
        municipio: values.municipio.trim() || undefined,
        tipoIntervencao: values.tipoIntervencao.trim() || undefined,
        processGroup: inferProcessGroup(values.tipoIntervencao.trim() || undefined),
        fase: values.fase,
        prioridade: values.prioridade || undefined,
        statusDetalhe: values.statusDetalhe.trim() || undefined,
        prazo: values.prazo || undefined,
        observacoes: values.observacoes.trim() || undefined,
        fonte: "app" as const,
        updatedAt: serverTimestamp(),
        ...(existing
          ? {}
          : defaultPipelineFieldsForNewProcess()),
      });

      if (existing?.id) {
        await updateDoc(doc(firestore, "officeProcesses", existing.id), payload);
        toast({ title: "Processo atualizado" });
      } else {
        const ref = doc(collection(firestore, "officeProcesses"));
        await setDoc(ref, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Processo criado" });
        createdProcessId = ref.id;
      }
      setFormOpen(false);
      setEditing(null);
      if (createdProcessId) {
        openProcess(createdProcessId);
      } else if (createRequested) {
        removeCreateRequest();
      }
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

  const orphanCount = React.useMemo(
    () => (processes ?? []).filter((p) => !p.consultoriaProjectId).length,
    [processes],
  );

  const runImport = async (
    preview: OfficeProcessImportPreview,
    options: { seedValidation: boolean },
  ) => {
    if (!firestore) return;
    setImporting(true);
    try {
      const result = await commitOfficeProcessImport(firestore, preview, {
        seedValidation: options.seedValidation,
        empreendedores: empreendedores ?? undefined,
        consultoriaProjects: consultoriaProjects ?? undefined,
        existingByKey,
      });
      const unresolved =
        result.unresolvedProjects.length > 0
          ? ` ${result.unresolvedProjects.length} projeto(s) não reconhecido(s) na coluna PROJETO.`
          : "";
      toast({
        title: "Importação concluída",
        description: `${result.created} criado(s), ${result.updated} atualizado(s), ${result.linked} vinculado(s) a projetos.${unresolved}`,
      });
      setImportOpen(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: (e as Error).message,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleMoveEtapa = async (
    process: OfficeProcess,
    etapa: ConsultoriaEtapa | OrgaoEtapa,
  ) => {
    if (!firestore) return;
    const pipeline =
      pipelineTab === "orgao" && etapa === "concluido_arquivado"
        ? "encerrado"
        : pipelineTab;
    try {
      await moveProcessEtapa(firestore, process.id, pipeline, etapa);
      toast({ title: "Etapa atualizada" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao mover",
        description: (e as Error).message,
      });
    }
  };

  const handleProtocolConfirm = async (values: {
    numeroProcesso: string;
    dataProtocolo: string;
  }) => {
    if (!firestore || !protocolTarget) return;
    setProtocolSaving(true);
    try {
      const transition = buildProtocolTransitionPayload(
        values.numeroProcesso,
        values.dataProtocolo,
      );
      await moveProcessEtapa(
        firestore,
        protocolTarget.id,
        "orgao",
        "entrada_protocolo",
        transition,
      );
      toast({
        title: "Processo protocolado",
        description: "Movido para o pipeline do órgão.",
      });
      setProtocolTarget(null);
      setPipelineTab("orgao");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao protocolar",
        description: (e as Error).message,
      });
    } finally {
      setProtocolSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!firestore || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(firestore, "officeProcesses", deleteTarget.id));
      toast({ title: "Processo removido" });
      if (selectedId === deleteTarget.id) closeSheet();
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

  const pageTitle = semProjetoFilter
    ? "Processos sem projeto"
    : faseFilter === "elaboracao"
      ? "Em elaboração"
      : faseFilter === "protocolado"
        ? "Protocolados (SEI/SLA)"
        : GESTAO_PROCESSOS_FLUXO_LABEL;

  return (
    <>
      <PageHeader
        title={pageTitle}
        description={
          isPortalReadOnly
            ? "Acompanhamento dos processos dos seus empreendimentos (somente consulta)."
            : "Acompanhamento unificado de processos, protocolos e trâmites de licenciamento."
        }
      >
        {canWrite ? (
          <Button size="sm" onClick={openCreateForm}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo processo
          </Button>
        ) : null}
      </PageHeader>

      <div className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Em tramitação", value: kpiStats.emTramitacao },
            { label: "Prioridade alta", value: kpiStats.prioridadeAlta, warn: true },
            { label: "Prazos vencidos", value: kpiStats.prazosVencidos, warn: true },
            { label: "Concluídos", value: kpiStats.concluidos },
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

        {fluxoAlerts.length > 0 ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="text-sm font-medium">Alertas na seleção atual</p>
              <div className="flex flex-wrap gap-2">
                {fluxoAlerts.map(({ kind, count }) => (
                  <Badge key={kind} variant="outline" className="text-xs">
                    {count} {PROCESS_ALERT_LABELS[kind].toLowerCase()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <CardSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por processo, empreendedor, coordenadas ou status…"
        />

        {canWrite && orphanCount > 0 ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{orphanCount}</strong>{" "}
                processo(s) ainda sem projeto de consultoria vinculado.
              </p>
              <Button
                type="button"
                variant={semProjetoFilter ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams?.toString() ?? "");
                  if (semProjetoFilter) params.delete("sem_projeto");
                  else params.set("sem_projeto", "1");
                  replaceProcessQuery(params);
                }}
              >
                {semProjetoFilter ? "Ver todos" : "Mostrar sem projeto"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {canWrite ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Ferramentas de acompanhamento</p>
                <p className="text-xs text-muted-foreground">
                  Importe dados de Excel ou exporte a base atual sem sair de Fluxo de Processos.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImportOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Excel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadOfficeProcessExport(
                      processes ?? [],
                      "gestao-processos-export.xlsx",
                      consultoriaProjects ?? undefined,
                    )
                  }
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Tabs
          value={pipelineTab}
          onValueChange={(v) => setPipelineTab(v as FluxoKanbanPipeline)}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="consultoria">Consultoria (pré-protocolo)</TabsTrigger>
              <TabsTrigger value="orgao">Órgão (pós-protocolo)</TabsTrigger>
            </TabsList>
            <div className="flex rounded-md border p-0.5">
              <Button
                type="button"
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Kanban
              </Button>
              <Button
                type="button"
                variant={viewMode === "lista" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setViewMode("lista")}
              >
                <List className="h-3.5 w-3.5" />
                Lista
              </Button>
            </div>
          </div>
        </Tabs>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {pipelineTab === "consultoria" ? "Pipeline consultoria" : "Pipeline órgão"} (
            {pipelineFilteredProcesses.length})
          </h2>
          {viewMode === "kanban" ? (
            <FluxoKanban
              pipeline={pipelineTab}
              processes={pipelineFilteredProcesses}
              consultoriaProjects={consultoriaProjects ?? []}
              cadastroById={cadastroById}
              isLoading={isLoading}
              canWrite={canWrite}
              onOpenProcess={openProcess}
              onMoveEtapa={handleMoveEtapa}
              onProtocolar={setProtocolTarget}
              onEdit={(item) => {
                setEditing(item);
                setFormOpen(true);
              }}
              onDelete={setDeleteTarget}
            />
          ) : (
            <ProcessListSection
              processes={pipelineFilteredProcesses}
              isLoading={isLoading}
              canWrite={canWrite}
              consultoriaProjects={consultoriaProjects ?? []}
              cadastroById={cadastroById}
              onOpenProcess={openProcess}
              onEdit={(item) => {
                setEditing(item);
                setFormOpen(true);
              }}
              onDelete={setDeleteTarget}
            />
          )}
        </div>

        {!faseFilter && activeRequests.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Trâmites de licenciamento integrados ({activeRequests.length})
            </h2>
            <div className="space-y-2">
              {activeRequests.map((req) => (
                <Card key={req.id} className="border-border/60">
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {formatLicenciamentoSolicitationNumber(req)}
                        </span>
                        <Badge variant="outline">Licenciamento</Badge>
                        <Badge variant="secondary">
                          {getLicenciamentoStatusLabel(req.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {empreendedoresMap.get(req.empreendedorId) ?? "—"} ·{" "}
                        {projectsMap.get(req.projectId) ?? "—"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`${LICENCIAMENTO_REQUESTS_PATH}/${req.id}/edit`}>
                          Abrir trâmite
                        </Link>
                      </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <ProcessDetailSheet
        process={selectedProcess}
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) closeSheet();
          else setSheetOpen(true);
        }}
        canWrite={canWrite}
        consultoriaProjects={consultoriaProjects ?? undefined}
      />

      <ProcessFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            if (createRequested) removeCreateRequest();
          }
        }}
        initial={editing}
        saving={saving}
        cadastroById={cadastroById}
        consultoriaProjects={consultoriaProjects ?? []}
        onSubmit={(values) => persistProcess(values, editing)}
      />

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        importing={importing}
        onConfirm={runImport}
      />

      <ProtocolarProcessDialog
        open={Boolean(protocolTarget)}
        onOpenChange={(open) => !open && setProtocolTarget(null)}
        process={protocolTarget}
        saving={protocolSaving}
        onConfirm={handleProtocolConfirm}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover processo?</AlertDialogTitle>
            <AlertDialogDescription>
              O processo {deleteTarget?.numeroProcesso} será excluído permanentemente.
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

type ProcessListSectionProps = {
  processes: OfficeProcess[];
  isLoading: boolean;
  canWrite: boolean;
  consultoriaProjects: ConsultoriaProject[];
  cadastroById: ReadonlyMap<string, Project>;
  onOpenProcess: (id: string) => void;
  onEdit: (process: OfficeProcess) => void;
  onDelete: (process: OfficeProcess) => void;
};

function ProcessListSection({
  processes,
  isLoading,
  canWrite,
  consultoriaProjects,
  cadastroById,
  onOpenProcess,
  onEdit,
  onDelete,
}: ProcessListSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Nenhum processo neste pipeline.
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        {processes.map((item) => {
          const { etapa, pipeline } = resolveProcessPipelineState(item);
          const coordResumo = formatOfficeProcessCoordinates(
            item,
            cadastroById,
            consultoriaProjects,
          );
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Card
                  className="cursor-pointer border-border/80 transition-shadow hover:shadow-md"
                  onClick={() => onOpenProcess(item.id)}
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold sm:text-base">
                          {item.numeroProcesso}
                        </span>
                        <Badge variant="outline" className="text-xs uppercase">
                          {item.tipoProcesso}
                        </Badge>
                        <Badge variant="outline" className={faseBadgeClass(item.fase)}>
                          {OFFICE_PROCESS_FASE_LABELS[item.fase]}
                        </Badge>
                        {item.consultoriaProjectId ? (
                          <Badge variant="secondary" className="max-w-[180px] truncate">
                            {consultoriaProjectLabel(
                              item.consultoriaProjectId,
                              consultoriaProjects,
                            ) ?? "Projeto"}
                          </Badge>
                        ) : null}
                        {item.prioridade === "alta" ? (
                          <Badge variant="destructive" className="text-xs">
                            Alta
                          </Badge>
                        ) : null}
                      </div>
                      <ProcessAlertsBadges process={item} className="mt-1" />
                      <p className="text-xs text-muted-foreground">
                        Etapa:{" "}
                        {etapaLabel(pipeline, etapa)}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Empreendedor: </span>
                        {item.empreendedorName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.municipio ? `${item.municipio} · ` : ""}
                        Prazo: {formatPrazoDisplay(item.prazo)}
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
                    {canWrite ? (
                      <div
                        className="flex shrink-0 gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(item)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => onDelete(item)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <p className="font-medium">{item.numeroProcesso}</p>
                <p className="text-xs text-muted-foreground">
                  {item.tipoIntervencao ?? "Tipo não informado"}
                </p>
                {coordResumo ? (
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {coordResumo}
                  </p>
                ) : null}
                <p className="text-xs">{item.statusDetalhe ?? "Sem status"}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
