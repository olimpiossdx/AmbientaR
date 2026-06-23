"use client";
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Paperclip,
  Eye,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from "@/firebase";
import { collection, doc, query, where, limit, getDocs } from "firebase/firestore";
import type {
  EnvironmentalIntervention,
  Empreendedor,
  AppUser,
} from "@/lib/types";
import { permitStatusBadgeClassRich } from "@/lib/status-display-classes";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { IntervencaoForm } from "./intervencao-form";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { useToast } from "@/hooks/use-toast";
import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { backupAndDeleteParentWithCondicionantes } from "@/lib/deleted-data-backup";
import { CardSearchInput } from "@/components/card-search-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { fetchEmpreendedorIdsForPortalScope, isEmpreendedorScopedPortalRole } from "@/lib/portal-empreendedor-scope";
import { isClientePortalRole, canPerformOperationalWrite } from "@/lib/role-guards";

const canPerformWriteActions = (user: AppUser | null): boolean => {
  if (!user) return false;
  return canPerformOperationalWrite(user.role);
};

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null | number;
}) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">
      {value != null && value !== "" ? String(value) : "Não informado"}
    </p>
  </div>
);

export default function IntervencoesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewIntervencaoOpen, setIsViewIntervencaoOpen] = useState(false);
  const [viewIntervencao, setViewIntervencao] =
    useState<EnvironmentalIntervention | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] =
    useState<EnvironmentalIntervention | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<
    string[] | undefined
  >(undefined);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (isClientePortalRole(user?.role) && firestore) {
      setEmpreendedorIdsForUser(undefined);
      const currentUser = user as AppUser;
      const userDocuments = [
        currentUser.cpf || currentUser.userCpf,
        ...(currentUser.cnpjs || []),
      ].filter(Boolean) as string[];
      if (userDocuments.length > 0) {
        const empreendedoresRef = collection(firestore, "empreendedores");
        const q = query(
          empreendedoresRef,
          where("cpfCnpj", "in", userDocuments),
        );
        getDocs(q)
          .then((snapshot) => {
            const ids = snapshot.docs.map((d) => d.id);
            setEmpreendedorIdsForUser(
              ids.length > 0 ? ids : ["invalid-placeholder"],
            );
          })
          .catch(() => {
            setEmpreendedorIdsForUser(["invalid-placeholder"]);
          });
      } else {
        setEmpreendedorIdsForUser(["invalid-placeholder"]);
      }
    } else if (isEmpreendedorScopedPortalRole(user?.role) && !isClientePortalRole(user?.role) && firestore && user) {
      setEmpreendedorIdsForUser(undefined);
      fetchEmpreendedorIdsForPortalScope(firestore, user)
        .then(setEmpreendedorIdsForUser)
        .catch(() => setEmpreendedorIdsForUser(["invalid-placeholder"]));
    } else if (user) {
      setEmpreendedorIdsForUser([]);
    }
  }, [user, firestore]);

  const intervencoesQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined)
      return null;
    if (isEmpreendedorScopedPortalRole(user.role)) {
      if (empreendedorIdsForUser.length > 0) {
        return query(
          collection(firestore, "intervencoes"),
          where("empreendedorId", "in", empreendedorIdsForUser),
          limit(200),
        );
      }
      return query(
        collection(firestore, "intervencoes"),
        where("empreendedorId", "in", ["invalid-placeholder"]),
        limit(1),
      );
    }
    return query(collection(firestore, "intervencoes"), limit(200));
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: intervencoes, isLoading: isLoadingIntervencoes } =
    useCollection<EnvironmentalIntervention>(intervencoesQuery);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "empreendedores"), limit(200)) : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = useMemo(
    () => new Map(empreendedores?.map((c) => [c.id, c.name])),
    [empreendedores],
  );
  const getSortDateValue = (dateString?: string | null) => {
    if (!dateString) return Number.POSITIVE_INFINITY;
    const value = new Date(dateString).getTime();
    return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
  };
  const sortedIntervencoes = useMemo(
    () =>
      [...(intervencoes || [])].sort(
        (a, b) =>
          getSortDateValue(a.expirationDate) - getSortDateValue(b.expirationDate),
      ),
    [intervencoes],
  );
  const filteredIntervencoes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedIntervencoes;
    return sortedIntervencoes.filter((item) => {
      const empreendedor = (empreendedoresMap.get(item.empreendedorId) || "").toLowerCase();
      return (
        (item.processNumber || "").toLowerCase().includes(term) ||
        (item.description || "").toLowerCase().includes(term) ||
        (item.status || "").toLowerCase().includes(term) ||
        empreendedor.includes(term)
      );
    });
  }, [sortedIntervencoes, searchTerm, empreendedoresMap]);

  const isLoading =
    isLoadingIntervencoes ||
    isLoadingEmpreendedores ||
    (isEmpreendedorScopedPortalRole(user?.role) &&
      empreendedorIdsForUser === undefined);

  const handleAddNew = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: EnvironmentalIntervention) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const openViewIntervencao = (item: EnvironmentalIntervention) => {
    setViewIntervencao(item);
    setIsViewIntervencaoOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "intervencoes", itemToDelete);
    backupAndDeleteParentWithCondicionantes({
      firestore,
      collectionName: "intervencoes",
      documentId: itemToDelete,
      user,
      reason: "Exclusão manual na tela de intervenções",
    })
      .then(() => {
        toast({
          title: "DAIA deletada",
          description:
            "A DAIA e suas condicionantes relacionadas foram removidas com backup de segurança.",
        });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: "Erro ao excluir DAIA",
          context: { path: docRef.path, operation: "delete" },
        }),
      )
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  };

  const getStatusVariant = (status: EnvironmentalIntervention["status"]) =>
    permitStatusBadgeClassRich[status];

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Documentos de Autorização para Intervenção Ambiental (DAIA)">
          {canPerformWriteActions(user) && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Adicionar DAIA
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de DAIAs</CardTitle>
              <CardDescription>
                Acompanhe todas as autorizações para intervenção ambiental.
              </CardDescription>
              <CardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar processo, tipo, empreendedor..."
              />
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!isLoading &&
                    filteredIntervencoes.map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {empreendedoresMap.get(item.empreendedorId) ||
                                  "Empreendedor não encontrado"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Processo: {item.processNumber || "N/A"} · Venc.:{" "}
                                {formatDate(item.expirationDate)}
                              </p>
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {item.description || "N/A"}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn("w-fit", getStatusVariant(item.status))}
                              >
                                {item.status}
                              </Badge>
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
                                    onClick={() => openViewIntervencao(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Visualizar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar sem editar</p>
                                </TooltipContent>
                              </Tooltip>
                              {item.fileUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                      <a
                                        href={item.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="sr-only">Ver anexo</span>
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Fazer download</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {canPerformWriteActions(user) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() => handleEdit(item)}
                                    >
                                      <Upload className="h-4 w-4" />
                                      <span className="sr-only">Carregar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Carregar</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {canPerformWriteActions(user) && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        type="button"
                                        onClick={() => handleEdit(item)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                        type="button"
                                        onClick={() => openDeleteConfirm(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Deletar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Deletar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredIntervencoes.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhuma intervenção encontrada.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isViewIntervencaoOpen} onOpenChange={setIsViewIntervencaoOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar DAIA</DialogTitle>
            <DialogDescription>
              Somente leitura. Processo nº {viewIntervencao?.processNumber || "—"}
            </DialogDescription>
          </DialogHeader>
          {viewIntervencao && (
            <div className="space-y-4 text-sm">
              <DetailItem
                label="Empreendedor"
                value={empreendedoresMap.get(viewIntervencao.empreendedorId)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem
                  label="Nº do processo"
                  value={viewIntervencao.processNumber}
                />
                <DetailItem
                  label="Órgão emissor"
                  value={viewIntervencao.issuingBody}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem
                  label="Data de emissão"
                  value={formatDate(viewIntervencao.issueDate)}
                />
                <DetailItem
                  label="Vencimento"
                  value={formatDate(viewIntervencao.expirationDate)}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Badge
                  variant="outline"
                  className={cn(getStatusVariant(viewIntervencao.status))}
                >
                  {viewIntervencao.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Tipo / descrição</Label>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {viewIntervencao.description || "N/A"}
                </p>
              </div>
              <Separator />
              <AttachmentPreviewSection
                fileUrl={viewIntervencao.fileUrl}
                sectionLabel="Anexo"
                emptyLabel="Nenhum anexo."
                zoomTitle="Anexo da DAIA"
              />
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar DAIA" : "Adicionar Nova DAIA"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Atualize os detalhes da autorização abaixo."
                : "Preencha os detalhes para criar uma nova autorização."}
            </DialogDescription>
          </DialogHeader>
          <IntervencaoForm
            currentItem={editingItem}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente
              a autorização.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}




