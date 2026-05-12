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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
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
  errorEmitter,
} from "@/firebase";
import { collection, doc, query, where, getDocs } from "firebase/firestore";
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
import { FirestorePermissionError } from "@/firebase/errors";
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
import { fetchEmpreendedorIdsForRepresentative } from "@/lib/representative-empreendedor-ids";
import { isClientePortalRole } from "@/lib/role-guards";

const canPerformWriteActions = (user: AppUser | null): boolean => {
  if (!user) return false;
  return (
    user.role === "admin" ||
    user.role === "gestor" ||
    user.role === "supervisor" ||
    user.role === "cliente_autonomo"
  );
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
      {value != null && value !== "" ? String(value) : "NÃ£o informado"}
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
    } else if (user?.role === "representative" && firestore) {
      setEmpreendedorIdsForUser(undefined);
      fetchEmpreendedorIdsForRepresentative(firestore, user)
        .then(setEmpreendedorIdsForUser)
        .catch(() => setEmpreendedorIdsForUser(["invalid-placeholder"]));
    } else if (user) {
      setEmpreendedorIdsForUser([]);
    }
  }, [user, firestore]);

  const intervencoesQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined)
      return null;
    if (isClientePortalRole(user.role) || user.role === "representative") {
      if (empreendedorIdsForUser.length > 0) {
        return query(
          collection(firestore, "intervencoes"),
          where("empreendedorId", "in", empreendedorIdsForUser),
        );
      }
      return query(
        collection(firestore, "intervencoes"),
        where("empreendedorId", "in", ["invalid-placeholder"]),
      );
    }
    return collection(firestore, "intervencoes");
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: intervencoes, isLoading: isLoadingIntervencoes } =
    useCollection<EnvironmentalIntervention>(intervencoesQuery);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
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
    ((isClientePortalRole(user?.role) || user?.role === "representative") &&
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
      reason: "ExclusÃ£o manual na tela de intervenÃ§Ãµes",
    })
      .then(() => {
        toast({
          title: "DAIA deletada",
          description:
            "A DAIA e suas condicionantes relacionadas foram removidas com backup de seguranÃ§a.",
        });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      })
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
        <PageHeader title="Documentos de AutorizaÃ§Ã£o para IntervenÃ§Ã£o Ambiental (DAIA)">
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
                Acompanhe todas as autorizaÃ§Ãµes para intervenÃ§Ã£o ambiental.
              </CardDescription>
              <CardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar processo, tipo, empreendedor..."
              />
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-3 md:hidden">
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4 space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-28" />
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading &&
                    filteredIntervencoes.map((item) => (
                      <Card key={item.id} className="rounded-xl border-border/70 shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium min-w-0 truncate">
                              {empreendedoresMap.get(item.empreendedorId) ||
                                "Empreendedor nÃ£o encontrado"}
                            </p>
                            <Badge
                              variant={"outline"}
                              className={cn(getStatusVariant(item.status))}
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <p>
                              <span className="text-muted-foreground">
                                Processo:
                              </span>{" "}
                              {item.processNumber || "N/A"}
                            </p>
                            <p className="line-clamp-2">
                              <span className="text-muted-foreground">
                                Tipo:
                              </span>{" "}
                              {item.description || "N/A"}
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Vencimento:
                              </span>{" "}
                              {formatDate(item.expirationDate)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
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
                              <Button asChild variant="ghost" size="icon">
                                <a
                                  href={item.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Abrir anexo em nova aba"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  <span className="sr-only">Ver anexo</span>
                                </a>
                              </Button>
                            )}
                            {canPerformWriteActions(user) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(item)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
                            {canPerformWriteActions(user) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => openDeleteConfirm(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredIntervencoes.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                      Nenhuma intervenÃ§Ã£o encontrada.
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendedor</TableHead>
                      <TableHead className="hidden md:table-cell">
                        NÂº do Processo
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Tipo de IntervenÃ§Ã£o
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Vencimento
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Anexo</TableHead>
                      {canPerformWriteActions(user) && (
                        <TableHead>
                          <span className="sr-only">AÃ§Ãµes</span>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-24 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-6" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoading &&
                      filteredIntervencoes.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {empreendedoresMap.get(item.empreendedorId) ||
                              "Empreendedor nÃ£o encontrado"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {item.processNumber}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {item.description}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {formatDate(item.expirationDate)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={"outline"}
                              className={cn(getStatusVariant(item.status))}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
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
                                  <Button asChild variant="ghost" size="icon">
                                    <a
                                      href={item.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Abrir anexo em nova aba"
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
                          </TableCell>
                          {canPerformWriteActions(user) && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>AÃ§Ãµes</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(item)}
                                  >
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => openDeleteConfirm(item.id)}
                                  >
                                    Deletar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    {!isLoading && filteredIntervencoes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhuma intervenÃ§Ã£o encontrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
              Somente leitura. Processo nÂº {viewIntervencao?.processNumber || "â€”"}
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
                  label="NÂº do processo"
                  value={viewIntervencao.processNumber}
                />
                <DetailItem
                  label="Ã“rgÃ£o emissor"
                  value={viewIntervencao.issuingBody}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem
                  label="Data de emissÃ£o"
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
                <Label className="text-sm font-medium">Tipo / descriÃ§Ã£o</Label>
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
                ? "Atualize os detalhes da autorizaÃ§Ã£o abaixo."
                : "Preencha os detalhes para criar uma nova autorizaÃ§Ã£o."}
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
            <AlertDialogTitle>VocÃª tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta aÃ§Ã£o nÃ£o pode ser desfeita. Isso irÃ¡ deletar permanentemente
              a autorizaÃ§Ã£o.
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




