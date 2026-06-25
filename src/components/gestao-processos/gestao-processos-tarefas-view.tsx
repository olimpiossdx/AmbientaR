"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useOfficeTasksCollection } from "@/lib/gestao-processos/use-office-tasks-collection";
import { useToast } from "@/hooks/use-toast";
import type { AppUser, Empreendedor } from "@/lib/types";
import { GESTAO_PROCESSOS_INTERNAL_READ_ROLES } from "@/lib/gestao-processos-menu";
import { GESTAO_PROCESSOS_TAREFAS_LABEL } from "@/lib/gestao-processos-menu";
import {
  canAccessOfficeTasks,
  canAssignOfficeTaskToOthers,
  canCreateOfficeTask,
  canSeeAllOfficeTasks,
  canWriteGestaoProcessos,
} from "@/lib/gestao-processos/role-guards";
import type { ConsultoriaProject, OfficeProcess } from "@/lib/gestao-processos/types";
import type { OfficeTask, OfficeTaskFilterTab } from "@/lib/gestao-processos/task-types";
import {
  OFFICE_TASK_CATEGORIA_LABELS,
  OFFICE_TASK_FILTER_TAB_LABELS,
  OFFICE_TASK_STATUS_LABELS,
} from "@/lib/gestao-processos/task-types";
import {
  filterOfficeTasksByTab,
  filterOfficeTasksVisibleToUser,
  formatOfficeTaskPrazo,
  isOfficeTaskOverdue,
  officeTaskSearchBlob,
  officeTaskVisibleToUser,
  resolveOfficeTaskDisplayFields,
  sortOfficeTasksByPrazo,
  type OfficeTaskUserRef,
} from "@/lib/gestao-processos/task-utils";
import {
  OfficeTaskFormDialog,
  type OfficeTaskFormValues,
} from "@/components/gestao-processos/office-task-form-dialog";
import { OfficeTaskDetailSheet } from "@/components/gestao-processos/office-task-detail-sheet";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyPortalUsers } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { ListTodo, PlusCircle } from "lucide-react";

function omitUndefined(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );
}

function statusBadgeClass(status: OfficeTask["status"]): string {
  return cn(
    status === "pendente" && "bg-amber-500/15 text-amber-800 border-amber-500/30",
    status === "em_andamento" && "bg-blue-500/15 text-blue-800 border-blue-500/30",
    status === "aguardando" && "bg-violet-500/15 text-violet-800 border-violet-500/30",
    status === "concluida" && "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    status === "cancelada" && "bg-slate-500/15 text-slate-600 border-slate-500/30",
  );
}

function UserTableCell({ ref }: { ref: OfficeTaskUserRef | null }) {
  if (!ref) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="min-w-[8rem] text-sm">
      <p className="font-medium leading-tight">{ref.name}</p>
      {ref.roleLabel ? (
        <p className="text-xs text-muted-foreground">{ref.roleLabel}</p>
      ) : null}
    </div>
  );
}

export function GestaoProcessosTarefasView() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const [tab, setTab] = React.useState<OfficeTaskFilterTab>("todas");
  const [search, setSearch] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<OfficeTask | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<OfficeTask | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<OfficeTask | null>(null);
  const [saving, setSaving] = React.useState(false);

  const canAccess = canAccessOfficeTasks(user?.role);
  const canCreate = canCreateOfficeTask(user?.role);
  const canAssign = canAssignOfficeTaskToOthers(user?.role);
  const canSeeAll = canSeeAllOfficeTasks(user?.role);
  const canWriteProcess = canWriteGestaoProcessos(user?.role);

  const { data: tasks, isLoading } = useOfficeTasksCollection(
    Boolean(firestore && canAccess),
    user?.uid,
    canSeeAll,
  );

  const usersQuery = useMemoFirebase(
    () => (firestore && canAccess ? collection(firestore, "users") : null),
    [firestore, canAccess],
  );
  const { data: users } = useCollection<AppUser>(usersQuery);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore && canAccess ? collection(firestore, "empreendedores") : null),
    [firestore, canAccess],
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore && canAccess ? collection(firestore, "consultoriaProjects") : null),
    [firestore, canAccess],
  );
  const { data: consultoriaProjects } = useCollection<ConsultoriaProject>(projectsQuery);

  const processesQuery = useMemoFirebase(
    () => (firestore && canAccess ? collection(firestore, "officeProcesses") : null),
    [firestore, canAccess],
  );
  const { data: officeProcesses } = useCollection<OfficeProcess>(processesQuery);

  const internalUsers = React.useMemo(
    () =>
      users?.filter((u) => GESTAO_PROCESSOS_INTERNAL_READ_ROLES.includes(u.role)) ?? [],
    [users],
  );

  const usersByUid = React.useMemo(
    () => new Map(users?.map((u) => [u.uid, u]) ?? []),
    [users],
  );

  const empreendedoresById = React.useMemo(
    () => new Map(empreendedores?.map((e) => [e.id, e]) ?? []),
    [empreendedores],
  );

  const projectsById = React.useMemo(
    () => new Map(consultoriaProjects?.map((p) => [p.id, p]) ?? []),
    [consultoriaProjects],
  );

  const processesById = React.useMemo(
    () => new Map(officeProcesses?.map((p) => [p.id, p]) ?? []),
    [officeProcesses],
  );

  const displayContext = React.useMemo(
    () => ({
      usersByUid,
      empreendedoresById,
      projectsById,
      processesById,
    }),
    [usersByUid, empreendedoresById, projectsById, processesById],
  );

  const visibleTasks = React.useMemo(
    () => filterOfficeTasksVisibleToUser(tasks ?? [], user?.uid, canSeeAll),
    [tasks, user?.uid, canSeeAll],
  );

  const filteredTasks = React.useMemo(() => {
    const projetoFilter = searchParams?.get("projeto");
    const processoFilter = searchParams?.get("processo");
    let base = filterOfficeTasksByTab(visibleTasks, tab, user?.uid);
    if (projetoFilter) {
      base = base.filter((t) => t.consultoriaProjectId === projetoFilter);
    }
    if (processoFilter) {
      base = base.filter((t) => t.officeProcessId === processoFilter);
    }
    const q = search.trim().toLowerCase();
    const searched = q
      ? base.filter((t) => {
          const display = resolveOfficeTaskDisplayFields(t, displayContext);
          return officeTaskSearchBlob(t, display).includes(q);
        })
      : base;
    return sortOfficeTasksByPrazo(searched);
  }, [visibleTasks, tab, user?.uid, search, searchParams, displayContext]);

  const stats = React.useMemo(() => {
    const active = visibleTasks.filter(
      (t) => t.status !== "concluida" && t.status !== "cancelada",
    );
    return {
      total: active.length,
      minhas: user?.uid
        ? active.filter((t) => t.assigneeUid === user.uid).length
        : 0,
      atrasadas: active.filter((t) => isOfficeTaskOverdue(t)).length,
    };
  }, [visibleTasks, user?.uid]);

  React.useEffect(() => {
    const taskId = searchParams?.get("tarefa");
    if (!taskId || !tasks?.length) return;
    const found = tasks.find((t) => t.id === taskId);
    if (found && officeTaskVisibleToUser(found, user?.uid, canSeeAll)) {
      setSelectedTask(found);
      setDetailOpen(true);
    }
  }, [searchParams, tasks, user?.uid, canSeeAll]);

  const resolveUserName = (uid: string) => {
    const u = usersByUid.get(uid);
    return u?.name || u?.email || uid;
  };

  const notifyAssignee = async (assigneeUid: string, titulo: string, taskId: string) => {
    if (!firestore || !assigneeUid || assigneeUid === user?.uid) return;
    await notifyPortalUsers(firestore, [assigneeUid], {
      title: "Nova tarefa atribuída",
      description: titulo,
      link: `${NOTIFICATION_LINKS.gestaoProcessosTarefas}?tarefa=${encodeURIComponent(taskId)}`,
      sourceType: NOTIFICATION_SOURCE.office_task_assigned,
      sourceId: taskId,
      actorRole: user?.role ?? "gestor",
    });
  };

  const buildPayload = (values: OfficeTaskFormValues) => {
    const selfUid = user!.uid;
    const selfName = user!.name || user!.email || selfUid;

    if (canAssign) {
      const demandanteUid = values.demandanteUid || undefined;
      const assigneeUid = values.assigneeUid || undefined;
      const isPessoal =
        Boolean(assigneeUid && demandanteUid && assigneeUid === demandanteUid) &&
        assigneeUid === selfUid &&
        !values.officeProcessId;

      return omitUndefined({
        titulo: values.titulo.trim(),
        descricao: values.descricao.trim() || undefined,
        categoria: values.categoria,
        status: values.status,
        prioridade: values.prioridade || undefined,
        prazo: values.prazo || undefined,
        demandanteUid,
        demandanteName: demandanteUid ? resolveUserName(demandanteUid) : undefined,
        assigneeUid,
        assigneeName: assigneeUid ? resolveUserName(assigneeUid) : undefined,
        isOrganizacaoPessoal: isPessoal || undefined,
        empreendedorId: values.empreendedorId || undefined,
        consultoriaProjectId: values.consultoriaProjectId || undefined,
        officeProcessId: values.officeProcessId || undefined,
        updatedAt: serverTimestamp(),
      });
    }

    return omitUndefined({
      titulo: values.titulo.trim(),
      descricao: values.descricao.trim() || undefined,
      categoria: values.categoria,
      status: values.status,
      prioridade: values.prioridade || undefined,
      prazo: values.prazo || undefined,
      demandanteUid: selfUid,
      demandanteName: selfName,
      assigneeUid: selfUid,
      assigneeName: selfName,
      isOrganizacaoPessoal: true,
      updatedAt: serverTimestamp(),
    });
  };

  const canManageTask = (task: OfficeTask) =>
    canAssign ||
    canWriteProcess ||
    officeTaskVisibleToUser(task, user?.uid, false);

  const canDeleteTask = (task: OfficeTask) =>
    canAssign || canWriteProcess || (task.isOrganizacaoPessoal && task.createdByUid === user?.uid);

  const persistTask = async (values: OfficeTaskFormValues) => {
    if (!firestore || !user) return;
    setSaving(true);
    try {
      const payload = buildPayload(values);
      if (editingTask) {
        await updateDoc(doc(firestore, "officeTasks", editingTask.id), payload);
        const newAssignee = payload.assigneeUid as string | undefined;
        if (canAssign && newAssignee && newAssignee !== editingTask.assigneeUid) {
          await notifyAssignee(newAssignee, values.titulo.trim(), editingTask.id);
        }
        toast({ title: "Tarefa atualizada" });
      } else {
        const ref = doc(collection(firestore, "officeTasks"));
        await setDoc(ref, {
          ...payload,
          createdByUid: user.uid,
          createdByName: user.name || user.email || user.uid,
          createdAt: serverTimestamp(),
        });
        const newAssignee = payload.assigneeUid as string | undefined;
        if (canAssign && newAssignee && newAssignee !== user.uid) {
          await notifyAssignee(newAssignee, values.titulo.trim(), ref.id);
        }
        toast({ title: "Tarefa criada" });
      }
      setFormOpen(false);
      setEditingTask(null);
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

  const updateTaskStatus = async (
    task: OfficeTask,
    status: OfficeTask["status"],
    extra?: Record<string, unknown>,
  ) => {
    if (!firestore) return;
    setSaving(true);
    try {
      await updateDoc(
        doc(firestore, "officeTasks", task.id),
        omitUndefined({
          status,
          updatedAt: serverTimestamp(),
          ...extra,
        }),
      );
      setSelectedTask((prev) =>
        prev?.id === task.id ? { ...prev, status, ...extra } as OfficeTask : prev,
      );
      toast({ title: OFFICE_TASK_STATUS_LABELS[status] });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAssume = async (task: OfficeTask) => {
    if (!firestore || !user) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "officeTasks", task.id), {
        assigneeUid: user.uid,
        assigneeName: user.name || user.email || user.uid,
        status: "em_andamento",
        isOrganizacaoPessoal: false,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Tarefa assumida" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (task: OfficeTask, nota: string) => {
    const today = new Date().toISOString().slice(0, 10);
    await updateTaskStatus(task, "concluida", {
      conclusaoNota: nota.trim() || undefined,
      concluidaEm: today,
    });
    setDetailOpen(false);
  };

  const handleDelete = async () => {
    if (!firestore || !deleteTarget) return;
    setSaving(true);
    try {
      await deleteDoc(doc(firestore, "officeTasks", deleteTarget.id));
      toast({ title: "Tarefa removida" });
      setDeleteTarget(null);
      setDetailOpen(false);
      setSelectedTask(null);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Acesso restrito à equipa interna.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={GESTAO_PROCESSOS_TAREFAS_LABEL}
        description="Demandas avulsas do dia a dia — mapas, correções, ligações, procurações e outros pedidos com prazo."
      >
        {canCreate ? (
          <Button
            onClick={() => {
              setEditingTask(null);
              setFormOpen(true);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova tarefa
          </Button>
        ) : null}
      </PageHeader>

      <div className="space-y-4 p-4 md:p-6">
        <div className="grid grid-cols-3 gap-3 md:max-w-lg">
          {[
            { label: "Ativas", value: stats.total },
            { label: "Minhas", value: stats.minhas },
            { label: "Atrasadas", value: stats.atrasadas, warn: true },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p
                  className={cn(
                    "text-2xl font-semibold tabular-nums",
                    stat.warn && stat.value > 0 && "text-red-600",
                  )}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as OfficeTaskFilterTab)}
          >
            <TabsList className="flex h-auto flex-wrap">
              {(Object.keys(OFFICE_TASK_FILTER_TAB_LABELS) as OfficeTaskFilterTab[]).map(
                (key) => (
                  <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
                    {OFFICE_TASK_FILTER_TAB_LABELS[key]}
                  </TabsTrigger>
                ),
              )}
            </TabsList>
          </Tabs>
          <CardSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar tarefa..."
            className="w-full sm:max-w-xs"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <ListTodo className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma tarefa neste filtro.
              </p>
              {canCreate ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTask(null);
                    setFormOpen(true);
                  }}
                >
                  Criar primeira tarefa
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[10rem]">Título</TableHead>
                    <TableHead className="min-w-[11rem] whitespace-nowrap">
                      SEI/SLA/Avulso
                    </TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[8rem]">
                      Empreendedor
                    </TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[8rem]">
                      Empreendimento
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="min-w-[8rem]">Demandante</TableHead>
                    <TableHead className="min-w-[8rem]">Responsável</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const display = resolveOfficeTaskDisplayFields(task, displayContext);
                    return (
                      <TableRow
                        key={task.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedTask(task);
                          setDetailOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{task.titulo}</span>
                            {display.isPessoal ? (
                              <Badge variant="secondary" className="text-[10px]">
                                Pessoal
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {display.seiSlaAvulso.kind === "avulso" ? (
                            <span className="text-muted-foreground">Avulso</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {display.seiSlaAvulso.tipo}
                              </Badge>
                              <span
                                className="max-w-[7rem] truncate font-mono text-xs"
                                title={display.seiSlaAvulso.numero}
                              >
                                {display.seiSlaAvulso.numero}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[10rem] truncate text-sm text-muted-foreground">
                          {display.empreendedorName}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[10rem] truncate text-sm text-muted-foreground">
                          {display.empreendimentoName}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {OFFICE_TASK_CATEGORIA_LABELS[task.categoria]}
                        </TableCell>
                        <TableCell>
                          <UserTableCell ref={display.demandante} />
                        </TableCell>
                        <TableCell>
                          <UserTableCell ref={display.responsavel} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-sm whitespace-nowrap",
                            isOfficeTaskOverdue(task) && "font-medium text-red-600",
                          )}
                        >
                          {formatOfficeTaskPrazo(task.prazo)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadgeClass(task.status)}>
                            {OFFICE_TASK_STATUS_LABELS[task.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <OfficeTaskFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTask(null);
        }}
        initial={editingTask}
        saving={saving}
        onSubmit={persistTask}
        internalUsers={internalUsers}
        canAssignToOthers={!!canAssign}
        empreendedores={empreendedores ?? []}
        consultoriaProjects={consultoriaProjects ?? []}
        officeProcesses={officeProcesses ?? []}
      />

      <OfficeTaskDetailSheet
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canManage={!!(selectedTask && canManageTask(selectedTask))}
        canAssignToOthers={!!canAssign}
        canDelete={!!(selectedTask && canDeleteTask(selectedTask))}
        currentUid={user?.uid}
        usersByUid={usersByUid}
        empreendedoresById={empreendedoresById}
        consultoriaProjects={consultoriaProjects ?? []}
        officeProcesses={officeProcesses ?? []}
        saving={saving}
        onEdit={() => {
          if (!selectedTask) return;
          setEditingTask(selectedTask);
          setFormOpen(true);
        }}
        onDelete={() => selectedTask && setDeleteTarget(selectedTask)}
        onAssume={() => selectedTask && void handleAssume(selectedTask)}
        onStatusChange={(status) =>
          selectedTask && void updateTaskStatus(selectedTask, status)
        }
        onComplete={(nota) =>
          selectedTask && void handleComplete(selectedTask, nota)
        }
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pedido &quot;{deleteTarget?.titulo}&quot; será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
