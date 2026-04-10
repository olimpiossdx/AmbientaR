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
import type { WaterPermit, Empreendedor, AppUser, Project } from "@/lib/types";
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
import { OutorgaForm } from "./outorga-form";
import { useToast } from "@/hooks/use-toast";
import { FirestorePermissionError } from "@/firebase/errors";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { backupAndDeleteParentWithCondicionantes } from "@/lib/deleted-data-backup";
import { CardSearchInput } from "@/components/card-search-input";
import { fetchEmpreendedorIdsForRepresentative } from "@/lib/representative-empreendedor-ids";
import { isClientePortalRole } from "@/lib/role-guards";

const canPerformWriteActions = (user: AppUser | null): boolean => {
  if (!user) return false;
  return (
    user.role === "admin" ||
    user.role === "gestor" ||
    user.role === "supervisor"
  );
};

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null | string[];
}) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">
      {Array.isArray(value) ? value.join(", ") : value || "Não informado"}
    </p>
  </div>
);

export default function OutorgasPage() {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<WaterPermit | null>(null);
  const [viewingItem, setViewingItem] = useState<WaterPermit | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<
    string[] | undefined
  >(undefined);

  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isClientePortalRole(user?.role) && firestore) {
      setEmpreendedorIdsForUser(undefined);
      const userDocuments = [
        user.cpf || user.userCpf,
        ...(user.cnpjs || []),
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

  const outorgasQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined)
      return null;

    if (isClientePortalRole(user.role) || user.role === "representative") {
      if (empreendedorIdsForUser.length > 0) {
        return query(
          collection(firestore, "outorgas"),
          where("empreendedorId", "in", empreendedorIdsForUser),
        );
      }
      return null;
    }

    return collection(firestore, "outorgas");
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: outorgas, isLoading: isLoadingOutorgas } =
    useCollection<WaterPermit>(outorgasQuery);

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

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );
  const { data: projects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);
  const projectsMap = useMemo(
    () => new Map(projects?.map((p) => [p.id, p.propertyName])),
    [projects],
  );
  const getSortDateValue = (dateString?: string | null) => {
    if (!dateString) return Number.POSITIVE_INFINITY;
    const value = new Date(dateString).getTime();
    return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
  };
  const sortedOutorgas = useMemo(
    () =>
      [...(outorgas || [])].sort(
        (a, b) =>
          getSortDateValue(a.expirationDate) - getSortDateValue(b.expirationDate),
      ),
    [outorgas],
  );
  const filteredOutorgas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedOutorgas;
    return sortedOutorgas.filter((item) => {
      const empreendedor = (empreendedoresMap.get(item.empreendedorId) || "").toLowerCase();
      const empreendimento = (projectsMap.get(item.projectId || "") || "").toLowerCase();
      return (
        (item.permitNumber || "").toLowerCase().includes(term) ||
        (item.processNumber || "").toLowerCase().includes(term) ||
        (item.status || "").toLowerCase().includes(term) ||
        (item.interventionType || "").toLowerCase().includes(term) ||
        empreendedor.includes(term) ||
        empreendimento.includes(term)
      );
    });
  }, [sortedOutorgas, searchTerm, empreendedoresMap, projectsMap]);

  const isLoading =
    isLoadingOutorgas ||
    isLoadingEmpreendedores ||
    isLoadingProjects ||
    ((isClientePortalRole(user?.role) || user?.role === "representative") &&
      empreendedorIdsForUser === undefined);

  // #region agent log — Etapa 6: Gestão Ambiental → Outorgas
  useEffect(() => {
    if (!user || isLoading) return;
    fetch("http://127.0.0.1:7696/ingest/fb1ebcbd-0311-40d2-a3c0-dd5658623339", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "79ee00",
      },
      body: JSON.stringify({
        sessionId: "79ee00",
        location: "outorgas/page.tsx:etapa6",
        message: "Gestão Ambiental → Outorgas carregado",
        data: {
          role: user.role,
          count: outorgas?.length ?? 0,
          canWrite: canPerformWriteActions(user),
          empreendedorIdsLen: empreendedorIdsForUser?.length ?? null,
        },
        hypothesisId: "etapa6",
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [user, isLoading, outorgas?.length, empreendedorIdsForUser]);
  // #endregion

  const handleAddNew = () => {
    router.push("/outorgas/new");
  };

  const handleEdit = (item: WaterPermit) => {
    router.push(`/outorgas/${item.id}/edit`);
  };

  const handleView = (item: WaterPermit) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "outorgas", itemToDelete);
    backupAndDeleteParentWithCondicionantes({
      firestore,
      collectionName: "outorgas",
      documentId: itemToDelete,
      user,
      reason: "Exclusão manual na tela de outorgas",
    })
      .then(() => {
        toast({
          title: "Outorga deletada",
          description:
            "A outorga e suas condicionantes relacionadas foram removidas com backup de segurança.",
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

  const getStatusVariant = (status: WaterPermit["status"]) => {
    switch (status) {
      case "Válida":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
      case "Em Renovação":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "Vencida":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      case "Suspensa":
      case "Cancelada":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
      default:
        return "bg-slate-500/20 text-slate-700 border-slate-500/30";
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Outorgas de Uso de Água">
          {canPerformWriteActions(user) && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Outorga
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Outorgas</CardTitle>
              <CardDescription>
                Acompanhe e gerencie todas as outorgas de uso de água dos seus
                clientes.
              </CardDescription>
              <CardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar outorga, processo, empreendedor..."
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
                    filteredOutorgas.map((item) => (
                      <Card key={item.id} className="rounded-xl border-border/70 shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {empreendedoresMap.get(item.empreendedorId) ||
                                  "Não encontrado"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {projectsMap.get(item.projectId || "") || "N/A"}
                              </p>
                            </div>
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
                                Nº Portaria:
                              </span>{" "}
                              {item.permitNumber || "N/A"}
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Vencimento:
                              </span>{" "}
                              {formatDate(item.expirationDate)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {item.fileUrl && (
                              <Button asChild variant="ghost" size="icon">
                                <a
                                  href={item.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Paperclip className="h-4 w-4" />
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
                  {!isLoading && filteredOutorgas.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                      Nenhuma outorga encontrada.
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendedor</TableHead>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Nº da Portaria
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Vencimento
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-24 rounded-full" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-24" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoading &&
                      filteredOutorgas.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {empreendedoresMap.get(item.empreendedorId) ||
                              "Não encontrado"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {projectsMap.get(item.projectId || "") || "N/A"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {item.permitNumber}
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
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {item.fileUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button asChild variant="ghost" size="icon">
                                      <a
                                        href={item.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="sr-only">
                                          Ver anexo
                                        </span>
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
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
                              {canPerformWriteActions(user) && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(item)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar outorga</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() =>
                                          openDeleteConfirm(item.id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Deletar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Deletar outorga</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && filteredOutorgas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhuma outorga encontrada.
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

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
          <OutorgaForm
            currentItem={editingItem}
            onSuccess={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Outorga</DialogTitle>
            <DialogDescription>
              Visualização dos dados para a outorga #{viewingItem?.permitNumber}
              .
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Empreendedor"
                  value={empreendedoresMap.get(viewingItem.empreendedorId)}
                />
                <DetailItem
                  label="Empreendimento"
                  value={projectsMap.get(viewingItem.projectId || "")}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Nº da Portaria"
                  value={viewingItem.permitNumber}
                />
                <DetailItem
                  label="Nº do Processo"
                  value={viewingItem.processNumber}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Data de Emissão"
                  value={formatDate(viewingItem.issueDate)}
                />
                <DetailItem
                  label="Data de Vencimento"
                  value={formatDate(viewingItem.expirationDate)}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <div>
                  <Badge
                    variant={"outline"}
                    className={cn(getStatusVariant(viewingItem.status))}
                  >
                    {viewingItem.status}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <Label>Finalidade</Label>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {viewingItem.description || "N/A"}
                </p>
              </div>
              {viewingItem.fileUrl && (
                <div className="space-y-1">
                  <Label>Anexo</Label>
                  <p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={viewingItem.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="text-primary underline flex items-center gap-2"
                        >
                          <Paperclip className="h-4 w-4" />
                          Ver documento
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Fazer download</p>
                      </TooltipContent>
                    </Tooltip>
                  </p>
                </div>
              )}
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

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente
              o pedido de outorga.
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
