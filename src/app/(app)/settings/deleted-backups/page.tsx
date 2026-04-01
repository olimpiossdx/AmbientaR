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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Coleção</TableHead>
                    <TableHead>ID origem</TableHead>
                    <TableHead>Relacionados</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 6 }).map((_, idx) => (
                      <TableRow key={`sk-${idx}`}>
                        <TableCell>
                          <Skeleton className="h-4 w-36" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-36 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading &&
                    (backups || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.deletedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.sourceCollection || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.sourceId || "—"}
                        </TableCell>
                        <TableCell>{item.relatedCount ?? 0}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.deletedBy?.name || item.deletedBy?.email || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelected(item)}
                            >
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setPendingRestore(item)}
                              disabled={
                                !!item.restoredAt || restoringId === item.id
                              }
                            >
                              {restoringId === item.id
                                ? "Restaurando..."
                                : "Restaurar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && (!backups || backups.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhum backup de exclusão encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
