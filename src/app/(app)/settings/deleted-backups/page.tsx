"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, RotateCcw } from "lucide-react";
import {
  useAuth,
  useCollection,
  useMemoFirebase,
  useFirestore,
} from "@/firebase";
import { collection, orderBy, query } from "firebase/firestore";
import { restoreDeletedBackup } from "@/lib/deleted-data-backup";

type DeletedBackup = {
  id: string;
  sourceCollection?: string;
  sourceType?: string;
  sourceId?: string;
  sourceData?: unknown;
  relatedCollection?: string | null;
  relatedIds?: string[];
  relatedData?: unknown[];
  relatedCount?: number;
  deletedBy?: {
    uid?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  deletedAt?: { toDate?: () => Date } | string;
  reason?: string | null;
  restoredAt?: { toDate?: () => Date } | string;
};

function formatDate(value: DeletedBackup["deletedAt"]) {
  if (!value) return "—";
  if (typeof value === "string") return new Date(value).toLocaleString("pt-BR");
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toLocaleString("pt-BR");
  }
  return "—";
}

export default function DeletedBackupsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selected, setSelected] = React.useState<DeletedBackup | null>(null);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);
  const [pendingRestore, setPendingRestore] =
    React.useState<DeletedBackup | null>(null);

  const backupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "deleted_data_backups"),
      orderBy("deletedAt", "desc"),
    );
  }, [firestore]);
  const { data: backups, isLoading } =
    useCollection<DeletedBackup>(backupsQuery);

  const handleRestore = async (item: DeletedBackup) => {
    if (!firestore) return;
    setRestoringId(item.id);
    try {
      await restoreDeletedBackup({
        firestore,
        backupId: item.id,
        user,
      });
      toast({
        title: "Restauração concluída",
        description:
          "Dados restaurados com sucesso a partir do backup selecionado.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha na restauração",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível restaurar o backup.",
      });
    } finally {
      setRestoringId(null);
      setPendingRestore(null);
    }
  };

  if (user && user.role !== "admin" && user.role !== "supervisor") {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Backup de Dados Apagados" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Somente administradores e supervisores podem visualizar esta
                área.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Backup de Dados Apagados" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Registros de segurança</CardTitle>
              <CardDescription>
                Cópias de segurança geradas automaticamente antes de exclusões
                com possível efeito dominó.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 6 }).map((_, idx) => (
                      <Skeleton
                        key={`sk-${idx}`}
                        className="h-28 w-full rounded-lg"
                      />
                    ))}
                  {!isLoading &&
                    (backups || []).map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                  {item.sourceCollection || "—"}
                                </Badge>
                                {item.restoredAt ? (
                                  <Badge
                                    className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                                    variant="outline"
                                  >
                                    Restaurado
                                  </Badge>
                                ) : (
                                  <Badge
                                    className="bg-amber-500/15 text-amber-700 border-amber-500/30"
                                    variant="outline"
                                  >
                                    Pendente
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs font-mono text-muted-foreground break-all">
                                {item.sourceId || "—"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(item.deletedAt)} · Relacionados:{" "}
                                {item.relatedCount ?? 0} ·{" "}
                                {item.deletedBy?.name ||
                                  item.deletedBy?.email ||
                                  "Usuário —"}
                              </p>
                            </div>
                            <Separator className="bg-border/60" />
                            <div className="flex flex-wrap items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    onClick={() => setSelected(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">
                                      Ver detalhes do backup
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    onClick={() => setPendingRestore(item)}
                                    disabled={
                                      !!item.restoredAt ||
                                      restoringId === item.id
                                    }
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                    <span className="sr-only">
                                      {restoringId === item.id
                                        ? "Restaurando"
                                        : "Restaurar dados"}
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {restoringId === item.id
                                      ? "Restaurando…"
                                      : "Restaurar a partir do backup"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && (!backups || backups.length === 0) && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhum backup de exclusão encontrado.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do backup</DialogTitle>
          </DialogHeader>
          {selected && (
            <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-words">
              {JSON.stringify(selected, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingRestore}
        onOpenChange={(open) => !open && setPendingRestore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar restauração</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá restaurar o documento principal e os registros
              relacionados salvos no backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingRestore && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">Coleção:</span>{" "}
                {pendingRestore.sourceCollection || "—"}
              </p>
              <p>
                <span className="font-medium">ID origem:</span>{" "}
                {pendingRestore.sourceId || "—"}
              </p>
              <p>
                <span className="font-medium">Relacionados:</span>{" "}
                {pendingRestore.relatedCount ?? 0}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!restoringId}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingRestore && handleRestore(pendingRestore)}
              disabled={!!restoringId}
            >
              {restoringId ? "Restaurando..." : "Confirmar restauração"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
