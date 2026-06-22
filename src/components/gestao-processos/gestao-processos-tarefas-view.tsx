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
import { useToast } from "@/hooks/use-toast";
import type { AppUser, Empreendedor } from "@/lib/types";
import {
  GESTAO_PROCESSOS_TAREFAS_LABEL,
} from "@/lib/gestao-processos-menu";
import {
  canAccessOfficeTasks,
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
  formatOfficeTaskPrazo,
  isOfficeTaskOverdue,
  officeTaskSearchBlob,
  sortOfficeTasksByPrazo,
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
  const canWrite = canWriteGestaoProcessos(user?.role);

  const tasksQuery = useMemoFirebase(
    () => (firestore && canAccess ? collection(firestore, "officeTasks") : null),
    [firestore, canAccess],
  );
  const { data: tasks, isLoading } = useCollection<OfficeTask>(tasksQuery);

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

  const technicalUsers = React.useMemo(
    () =>
      users?.filter((u) =>
        ["admin", "technical", "gestor", "supervisor", "diretor_fauna", "advogado"].includes(
          u.role,
        ),
      ) ?? [],
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

  const filteredTasks = React.useMemo(() => {
    const projetoFilter = searchParams?.get("projeto");
    const processoFilter = searchParams?.get("processo");
    let base = filterOfficeTasksByTab(tasks ?? [], tab, user?.uid);
    if (projetoFilter) {
      base = base.filter((t) => t.consultoriaProjectId === projetoFilter);
    }
    if (processoFilter) {
      base = base.filter((t) => t.officeProcessId === processoFilter);
    }
    const q = search.trim().toLowerCase();
    const searched = q
      ? base.filter((t) => officeTaskSearchBlob(t).includes(q))
      : base;
    return sortOfficeTasksByPrazo(searched);
  }, [tasks, tab, user?.uid, search, searchParams]);

  const stats = React.useMemo(() => {
    const active = (tasks ?? []).filter(
      (t) => t.status !== "concluida" && t.status !== "cancelada",
    );
    return {
      total: active.length,
      minhas: user?.uid
        ? active.filter((t) => t.assigneeUid === user.uid).length
        : 0,
      atrasadas: active.filter((t) => isOfficeTaskOverdue(t)).length,
    };
  }, [tasks, user?.uid]);

  React.useEffect(() => {
    const taskId = searchParams?.get("tarefa");
    if (!taskId || !tasks?.length) return;
    const found = tasks.find((t) => t.id === taskId);
    if (found) {
      setSelectedTask(found);
      setDetailOpen(true);
    }
  }, [searchParams, tasks]);

  const resolveAssigneeName = (uid: string) => {
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

  const buildPayload = (values: OfficeTaskFormValues) =>
    omitUndefined({
      titulo: values.titulo.trim(),
      descricao: values.descricao.trim() || undefined,
      categoria: values.categoria,
      status: values.status,
      prioridade: values.prioridade || undefined,
      prazo: values.prazo || undefined,
      assigneeUid: values.assigneeUid || undefined,
      assigneeName: values.assigneeUid
        ? resolveAssigneeName(values.assigneeUid)
        : undefined,
      empreendedorId: values.empreendedorId || undefined,
      consultoriaProjectId: values.consultoriaProjectId || undefined,
      officeProcessId: values.officeProcessId || undefined,
      updatedAt: serverTimestamp(),
    });

  const persistTask = async (values: OfficeTaskFormValues) => {
    if (!firestore || !user) return;
    setSaving(true);
    try {
      const payload = buildPayload(values);
      if (editingTask) {
        await updateDoc(doc(firestore, "officeTasks", editingTask.id), payload);
        if (
          values.assigneeUid &&
          values.assigneeUid !== editingTask.assigneeUid
        ) {
          await notifyAssignee(values.assigneeUid, values.titulo.trim(), editingTask.id);
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
        if (values.assigneeUid) {
          await notifyAssignee(values.assigneeUid, values.titulo.trim(), ref.id);
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
        {canWrite ? (
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
              {canWrite ? (
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
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedTask(task);
                        setDetailOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{task.titulo}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {OFFICE_TASK_CATEGORIA_LABELS[task.categoria]}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {task.assigneeName ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-sm",
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
                  ))}
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
        technicalUsers={technicalUsers}
        empreendedores={empreendedores ?? []}
        consultoriaProjects={consultoriaProjects ?? []}
        officeProcesses={officeProcesses ?? []}
      />

      <OfficeTaskDetailSheet
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        canWrite={canWrite}
        currentUid={user?.uid}
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
