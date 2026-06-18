"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  GESTAO_PROCESSOS_MENU_LABEL,
  GESTAO_PROCESSOS_PLANILHA_PATH,
} from "@/lib/gestao-processos-menu";
import {
  canWriteGestaoProcessos,
  isGestaoProcessosPortalReadOnly,
} from "@/lib/gestao-processos/role-guards";
import type { OfficeProcess, OfficeProcessFase } from "@/lib/gestao-processos/types";
import {
  OFFICE_PROCESS_FASE_LABELS,
  buildOfficeProcessExternalKey,
  formatPrazoDisplay,
  officeProcessSearchBlob,
} from "@/lib/gestao-processos/utils";
import { officeProcessVisibleToPortal } from "@/lib/gestao-processos/match-empreendedor";
import { fetchEmpreendedorIdsForProcessosPortal } from "@/lib/requests-portal-empreendedor-ids";
import { ProcessDetailSheet } from "@/components/gestao-processos/process-detail-sheet";
import {
  ProcessFormDialog,
  type ProcessFormValues,
} from "@/components/gestao-processos/process-form-dialog";
import {
  FileSpreadsheet,
  Pencil,
  PlusCircle,
  Trash2,
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

export default function GestaoProcessosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const faseFilter = searchParams?.get("fase") as OfficeProcessFase | null;
  const selectedId = searchParams?.get("processo");

  const canWrite = canWriteGestaoProcessos(user?.role);
  const isPortalReadOnly = isGestaoProcessosPortalReadOnly(user?.role);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [portalEmpIds, setPortalEmpIds] = React.useState<string[] | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<OfficeProcess | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<OfficeProcess | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

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

  const { data: processes, isLoading } = useCollection<OfficeProcess>(processesQuery);
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const { data: projects } = useCollection<Project>(projectsQuery);
  const { data: requests } = useCollection<Request>(requestsQuery);

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

    if (term) {
      list = list.filter((p) => officeProcessSearchBlob(p).includes(term));
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
    isPortalReadOnly,
    portalEmpIds,
    empreendedorNameMap,
  ]);

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

  const openProcess = (id: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("processo", id);
    router.replace(`/gestao-processos?${params.toString()}`, { scroll: false });
  };

  const closeSheet = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("processo");
    const q = params.toString();
    router.replace(q ? `/gestao-processos?${q}` : "/gestao-processos", {
      scroll: false,
    });
    setSheetOpen(false);
  };

  const persistProcess = async (values: ProcessFormValues, existing?: OfficeProcess | null) => {
    if (!firestore) return;
    setSaving(true);
    try {
      const externalKey = buildOfficeProcessExternalKey(
        values.tipoProcesso,
        values.numeroProcesso,
      );
      const payload = {
        externalKey,
        tipoProcesso: values.tipoProcesso,
        numeroProcesso: values.numeroProcesso.trim(),
        empreendedorName: values.empreendedorName.trim() || "—",
        empreendimentoName: values.empreendimentoName.trim() || "—",
        municipio: values.municipio.trim() || undefined,
        tipoIntervencao: values.tipoIntervencao.trim() || undefined,
        fase: values.fase,
        statusDetalhe: values.statusDetalhe.trim() || undefined,
        prazo: values.prazo || undefined,
        observacoes: values.observacoes.trim() || undefined,
        fonte: "app" as const,
        updatedAt: serverTimestamp(),
      };

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
        openProcess(ref.id);
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

  const pageTitle =
    faseFilter === "elaboracao"
      ? "Em elaboração"
      : faseFilter === "protocolado"
        ? "Protocolados (SEI/SLA)"
        : GESTAO_PROCESSOS_MENU_LABEL;

  return (
    <>
      <PageHeader
        title={pageTitle}
        description="Processos em andamento no escritório — elaboração interna e protocolados no SEI/SLA."
      >
        {canWrite ? (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={GESTAO_PROCESSOS_PLANILHA_PATH}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Planilha
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo processo
            </Button>
          </>
        ) : null}
      </PageHeader>

      <div className="space-y-6 p-4 md:p-6">
        <CardSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por processo, empreendedor, empreendimento ou status…"
        />

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Processos ({filteredProcesses.length})
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredProcesses.length === 0 ? (
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Nenhum processo encontrado.
              {canWrite ? (
                <Button
                  variant="link"
                  className="ml-1"
                  asChild
                >
                  <Link href={GESTAO_PROCESSOS_PLANILHA_PATH}>
                    Importar planilha
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : (
            <TooltipProvider delayDuration={300}>
              <div className="space-y-3">
                {filteredProcesses.map((item) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Card
                        className="cursor-pointer border-border/80 transition-shadow hover:shadow-md"
                        onClick={() => openProcess(item.id)}
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
                              <Badge
                                variant="outline"
                                className={faseBadgeClass(item.fase)}
                              >
                                {OFFICE_PROCESS_FASE_LABELS[item.fase]}
                              </Badge>
                              {item.statusDetalhe ? (
                                <Badge variant="secondary" className="max-w-[200px] truncate">
                                  {item.statusDetalhe}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-sm">
                              <span className="text-muted-foreground">
                                Empreendedor:{" "}
                              </span>
                              {item.empreendedorName}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">
                                Empreendimento:{" "}
                              </span>
                              {item.empreendimentoName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.municipio ? `${item.municipio} · ` : ""}
                              Prazo: {formatPrazoDisplay(item.prazo)}
                            </p>
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
                                onClick={() => {
                                  setEditing(item);
                                  setFormOpen(true);
                                }}
                                aria-label="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteTarget(item)}
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
                      <p className="text-xs">{item.statusDetalhe ?? "Sem status"}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          )}
        </div>

        {!faseFilter && activeRequests.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Trâmites de Licenciamento em andamento ({activeRequests.length})
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
      />

      <ProcessFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        saving={saving}
        onSubmit={(values) => persistProcess(values, editing)}
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
