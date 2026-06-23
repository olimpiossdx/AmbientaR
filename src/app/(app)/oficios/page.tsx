"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  PlusCircle,
  Trash2,
  Edit,
  Check,
  Eye,
  Undo2,
} from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from "@/firebase";
import {
  collection,
  doc,
  deleteDoc,
  runTransaction,
  query,
  where,
  limit,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import type { Oficio } from "@/lib/types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { CardSearchInput } from "@/components/card-search-input";
import {
  isClientePortalRole,
  isRepresentativeLikePortalRole,
  canApproveOficio,
  canConfigureOficioCounter,
  canAdministerOficios,
  canWriteOficioDraft,
} from "@/lib/role-guards";
import { OficioCounterSettings } from "./oficio-counter-settings";
import {
  formatOficioNumberFromSequence,
  getCurrentCalendarYear,
  nextSequenceAfterApproval,
} from "@/lib/oficio-counter";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyOficioRecipientPortalUsers } from "@/lib/notifications";
import {
  buildOficioConsolidatedText,
  composeOficioRecipient,
  formatOficioOfficialNumber,
} from "@/lib/oficio-format";
import { OficioExportButtons } from "@/components/oficios/oficio-export-buttons";

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
      {value?.trim() ? value : "Não informado"}
    </p>
  </div>
);

function formatOficioDate(timestamp: unknown): string {
  if (!timestamp) return "N/A";
  try {
    const date =
      typeof timestamp === "object" &&
      timestamp !== null &&
      "toDate" in timestamp &&
      typeof (timestamp as { toDate: () => Date }).toDate === "function"
        ? (timestamp as { toDate: () => Date }).toDate()
        : typeof timestamp === "object" &&
            timestamp !== null &&
            "seconds" in timestamp
          ? new Date((timestamp as { seconds: number }).seconds * 1000)
          : new Date(String(timestamp));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("pt-BR");
    }
  } catch (e) {
    console.error("Error formatting timestamp:", e);
  }
  return "Data inválida";
}

export default function OficiosPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isRevertOpen, setIsRevertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToRevert, setItemToRevert] = useState<Oficio | null>(null);
  const [itemToView, setItemToView] = useState<Oficio | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const isPortalReadOnly =
    isClientePortalRole(user?.role) || isRepresentativeLikePortalRole(user?.role);
  const canManage = canWriteOficioDraft(user?.role);
  const canApprove = canApproveOficio(user?.role);
  const isAdmin = canAdministerOficios(user?.role);
  const showCounterSettings = canConfigureOficioCounter(user?.role);

  const oficiosQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (isRepresentativeLikePortalRole(user.role)) return null;
    if (isClientePortalRole(user.role)) {
      return query(
        collection(firestore, "oficios"),
        where("recipient", "==", user.name),
        limit(200),
      );
    }
    return query(collection(firestore, "oficios"), limit(200));
  }, [firestore, user]);

  const { data: oficios, isLoading } = useCollection<Oficio>(oficiosQuery);

  const getCreatedAtMs = (item: Oficio): number => {
    const t = item.createdAt;
    if (!t) return 0;
    try {
      if (
        typeof t === "object" &&
        t !== null &&
        "toDate" in t &&
        typeof (t as { toDate: () => Date }).toDate === "function"
      ) {
        return (t as { toDate: () => Date }).toDate().getTime();
      }
      if (typeof t === "object" && t !== null && "seconds" in t) {
        return (t as { seconds: number }).seconds * 1000;
      }
      const parsed = new Date(String(t)).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  };

  const sortedOficios = useMemo(
    () =>
      [...(oficios || [])].sort(
        (a, b) => getCreatedAtMs(b) - getCreatedAtMs(a),
      ),
    [oficios],
  );

  const filteredOficios = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sortedOficios;
    return sortedOficios.filter((item) => {
      const hay = [
        item.oficioNumber,
        item.recipient,
        item.recipientName,
        item.recipientOrganization,
        item.reference,
        item.referente,
        item.processoSei,
        item.subject,
        item.status,
        item.creatorName,
        item.assinanteNome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sortedOficios, searchTerm]);

  const handleAddNew = () => {
    router.push("/oficios/new");
  };

  const handleEdit = (item: Oficio) => {
    if (item.status === "Concluído" && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Ação não permitida",
        description: "Ofícios aprovados só podem ser editados pelo administrador.",
      });
      return;
    }
    router.push(`/oficios/${item.id}/edit`);
  };

  const handleView = (item: Oficio) => {
    setItemToView(item);
    setIsViewOpen(true);
  };

  const handleAprovar = async (item: Oficio) => {
    if (!firestore) return;
    if (!canApprove) {
      toast({
        variant: "destructive",
        title: "Sem permissão",
        description: "Apenas administrador, supervisor ou gestor podem aprovar ofícios.",
      });
      return;
    }

    const year = getCurrentCalendarYear();
    const counterRef = doc(firestore, "oficioCounters", String(year));
    const oficioRef = doc(firestore, "oficios", item.id);

    let assignedSequence = 1;
    try {
      await runTransaction(firestore, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        const counterLast = counterDoc.exists()
          ? (counterDoc.data().lastSequence as number | undefined)
          : null;
        const newSequence = nextSequenceAfterApproval(
          counterLast,
          oficios ?? [],
          year,
        );
        assignedSequence = newSequence;

        const oficioNumber = `${String(newSequence).padStart(3, "0")}/${year}`;

        transaction.set(counterRef, { lastSequence: newSequence }, { merge: true });
        transaction.update(oficioRef, {
          status: "Concluído",
          oficioNumber,
          sequence: newSequence,
          year,
          completedAt: new Date().toISOString(),
        });
      });

      toast({
        title: "Ofício aprovado",
        description: `Numerado como ${formatOficioNumberFromSequence(assignedSequence, year)}.`,
      });

      try {
        await notifyOficioRecipientPortalUsers(
          firestore,
          item.recipientName?.trim() || item.recipient,
          {
            title: "Novo ofício recebido",
            description: `Ofício nº ${String(assignedSequence).padStart(3, "0")}/${year} — ${item.subject || "sem assunto"}.`,
            link: NOTIFICATION_LINKS.oficios,
            sourceType: NOTIFICATION_SOURCE.oficio,
            sourceId: item.id,
            actorRole: user?.role,
          },
          { excludeUserId: user?.uid },
        );
      } catch (notifyErr) {
        console.warn("[Ofícios] notificação:", notifyErr);
      }
    } catch (e) {
      console.error("Transaction failed: ", e);
      toast({
        variant: "destructive",
        title: "Erro ao aprovar",
        description: "Não foi possível gerar o número do ofício.",
      });
    }
  };

  const openRevertConfirm = (item: Oficio) => {
    setItemToRevert(item);
    setIsRevertOpen(true);
  };

  const handleRevert = async () => {
    if (!firestore || !itemToRevert || !isAdmin) return;
    const oficioRef = doc(firestore, "oficios", itemToRevert.id);
    try {
      await updateDoc(oficioRef, {
        status: "Rascunho",
        oficioNumber: deleteField(),
        sequence: deleteField(),
        year: deleteField(),
        completedAt: deleteField(),
      });
      toast({
        title: "Ofício revertido para rascunho",
        description:
          "A numeração foi removida. O contador anual não foi alterado — ajuste-o em Configuração de numeração, se necessário.",
      });
      setIsRevertOpen(false);
      setItemToRevert(null);
      if (itemToView?.id === itemToRevert.id) {
        setItemToView({ ...itemToView, status: "Rascunho", oficioNumber: undefined });
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erro ao reverter",
        description: "Não foi possível reverter o ofício.",
      });
    }
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "oficios", itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Ofício deletado",
          description: "O ofício foi removido com sucesso.",
        });
      })
      .catch((error) =>
        handleFirestoreFormError(error, {
          toast,
          title: 'Erro ao excluir ofício',
          context: {
          path: docRef.path,
          operation: 'delete',
        },
        }),
      )
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const canDelete = (item: Oficio) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (item.status === "Rascunho" && item.createdBy === user.uid) return true;
    return false;
  };

  const canEditItem = (item: Oficio) =>
    item.status !== "Concluído" || isAdmin;

  const statusBadgeClass = (status?: string) =>
    cn(
      status === "Concluído" &&
        "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    );

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Ofícios">
          {canManage && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Novo Ofício
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Ofícios</CardTitle>
              <CardDescription>
                {isPortalReadOnly
                  ? "Consulte os ofícios enviados para você."
                  : canApprove
                    ? "Salve rascunhos, edite e exclua antes de aprovar. Ao aprovar, o ofício recebe numeração oficial para encaminhamento."
                    : "Crie e edite rascunhos de ofícios."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="flex flex-col gap-4">
                  {showCounterSettings && (
                    <OficioCounterSettings oficios={oficios ?? undefined} />
                  )}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      {oficios?.length
                        ? `Total: ${oficios.length} ofício(s)`
                        : null}
                    </div>
                    <CardSearchInput
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Buscar por nº, destinatário, assunto ou status..."
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-4">
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-28 w-full rounded-lg"
                        />
                      ))}
                    {!isLoading &&
                      filteredOficios.map((item) => (
                        <Card
                          key={item.id}
                          className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                      {item.subject || "Sem assunto"}
                                    </h3>
                                    <Badge
                                      variant={
                                        item.status === "Concluído"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className={statusBadgeClass(item.status)}
                                    >
                                      {item.status === "Concluído"
                                        ? "Aprovado"
                                        : item.status || "Rascunho"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-foreground">
                                    <span className="text-muted-foreground">
                                      Destinatário:{" "}
                                    </span>
                                    {item.recipient}
                                  </p>
                                  <p className="font-mono text-sm tabular-nums text-muted-foreground">
                                    {item.oficioNumber
                                      ? formatOficioOfficialNumber(item.oficioNumber)
                                      : "Rascunho (sem numeração)"}
                                  </p>
                                  <p className="text-xs text-muted-foreground sm:text-sm">
                                    Criado em {formatOficioDate(item.createdAt)}
                                    {item.creatorName && canManage
                                      ? ` · por ${item.creatorName}`
                                      : ""}
                                  </p>
                                </div>
                              </div>
                              <Separator className="bg-border/60" />
                              <div className="flex flex-wrap items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      onClick={() => handleView(item)}
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">Visualizar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Visualizar detalhes</p>
                                  </TooltipContent>
                                </Tooltip>
                                <OficioExportButtons oficio={item} />
                                {canManage && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 shrink-0"
                                          onClick={() => handleEdit(item)}
                                          disabled={!canEditItem(item)}
                                        >
                                          <Edit className="h-4 w-4" />
                                          <span className="sr-only">Editar</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          {item.status === "Concluído" && isAdmin
                                            ? "Editar (admin)"
                                            : "Editar rascunho"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                    {item.status === "Rascunho" && canApprove && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 shrink-0 text-emerald-600 hover:text-emerald-700"
                                            onClick={() => handleAprovar(item)}
                                          >
                                            <Check className="h-4 w-4" />
                                            <span className="sr-only">
                                              Aprovar
                                            </span>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Aprovar e numerar</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    {item.status === "Concluído" && isAdmin && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 shrink-0"
                                            onClick={() => openRevertConfirm(item)}
                                          >
                                            <Undo2 className="h-4 w-4" />
                                            <span className="sr-only">
                                              Reverter
                                            </span>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Reverter para rascunho (admin)</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                          onClick={() =>
                                            openDeleteConfirm(item.id)
                                          }
                                          disabled={!canDelete(item)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Deletar</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Deletar ofício</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    {!isLoading && filteredOficios.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                        {searchTerm.trim()
                          ? "Nenhum ofício encontrado para o filtro atual."
                          : "Nenhum ofício cadastrado."}
                      </div>
                    )}
                  </div>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{itemToView?.subject || "Ofício"}</DialogTitle>
            <DialogDescription>
              {itemToView?.oficioNumber
                ? `Nº ${itemToView.oficioNumber}`
                : "Rascunho"}{" "}
              · {itemToView?.status || "Rascunho"}
            </DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Data de criação"
                  value={formatOficioDate(itemToView.createdAt)}
                />
                <DetailItem label="Status" value={itemToView.status} />
              </div>
              {canManage && (
                <DetailItem
                  label="Criado por"
                  value={itemToView.creatorName}
                />
              )}
              <Separator />
              <h4 className="font-semibold text-foreground">
                Texto consolidado (modelo Word)
              </h4>
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm text-foreground font-sans leading-relaxed">
                {buildOficioConsolidatedText({
                  ...itemToView,
                  assinanteNome: itemToView.assinanteNome,
                  assinanteCargo: itemToView.assinanteCargo,
                })}
              </pre>
              <Separator />
              <h4 className="font-semibold text-foreground">Campos</h4>
              <DetailItem label="Referente" value={itemToView.referente} />
              <DetailItem label="Processo SEI/SLA" value={itemToView.processoSei} />
              <DetailItem label="Assunto" value={itemToView.subject} />
              <DetailItem label="Referência (legado)" value={itemToView.reference} />
              <DetailItem label="Corpo" value={itemToView.body} />
              <DetailItem label="Solicitante" value={itemToView.solicitante} />
              <DetailItem
                label="Assinatura p/p"
                value={itemToView.signatoryProcuracao}
              />
              <DetailItem
                label="Destinatário (final)"
                value={composeOficioRecipient(itemToView) || itemToView.recipient}
              />
              <DetailItem
                label="Responsável interno"
                value={
                  itemToView.assinanteNome
                    ? `${itemToView.assinanteNome}${itemToView.assinanteCargo ? ` — ${itemToView.assinanteCargo}` : ""}`
                    : undefined
                }
              />
            </div>
          )}
          <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {itemToView && (
              <OficioExportButtons oficio={itemToView} variant="default" />
            )}
            <div className="flex flex-wrap justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Fechar
              </Button>
            </DialogClose>
            {canManage && itemToView && canEditItem(itemToView) && (
                <Button
                  type="button"
                  onClick={() => {
                    setIsViewOpen(false);
                    handleEdit(itemToView);
                  }}
                >
                  {itemToView.status === "Concluído" ? "Editar (admin)" : "Editar rascunho"}
                </Button>
              )}
            {itemToView?.status === "Concluído" && isAdmin && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsViewOpen(false);
                  openRevertConfirm(itemToView);
                }}
              >
                Reverter para rascunho
              </Button>
            )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e irá deletar o ofício
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRevertOpen} onOpenChange={setIsRevertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverter ofício aprovado?</AlertDialogTitle>
            <AlertDialogDescription>
              O ofício{" "}
              {itemToRevert?.oficioNumber
                ? formatOficioOfficialNumber(itemToRevert.oficioNumber)
                : ""}{" "}
              voltará a rascunho sem numeração. O contador anual não é reduzido
              automaticamente — ajuste manualmente se precisar reutilizar o número.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert}>
              Reverter para rascunho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
