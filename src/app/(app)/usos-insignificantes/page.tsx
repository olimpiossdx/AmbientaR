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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  PlusCircle,
  Upload,
  Paperclip,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  errorEmitter,
  useAuth,
} from "@/firebase";
import { collection, doc, deleteDoc, query, where, getDocs } from "firebase/firestore";
import type {
  InsignificantWaterUse,
  InsignificantWaterUseType,
  Empreendedor,
  Project,
  AppUser,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { UsoInsignificanteForm } from "./uso-insignificante-form";
import { useToast } from "@/hooks/use-toast";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { FirestorePermissionError } from "@/firebase/errors";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CardSearchInput } from "@/components/card-search-input";
import { fetchEmpreendedorIdsForRepresentative } from "@/lib/representative-empreendedor-ids";
import { isClientePortalRole } from "@/lib/role-guards";
import { insignificantWaterUseOptions, permitStatusBadgeClassSimple } from "@/lib/status-display-classes";

import { canPerformOperationalWrite } from "@/lib/role-guards";

const canPerformWriteActions = (user: AppUser | null): boolean => {
  if (!user) return false;
  return canPerformOperationalWrite(user.role);
};

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">{value || "Não informado"}</p>
  </div>
);

export default function UsosInsignificantesPage() {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InsignificantWaterUse | null>(
    null,
  );
  const [viewingItem, setViewingItem] = useState<InsignificantWaterUse | null>(
    null,
  );
  const [selectedUsoType, setSelectedUsoType] =
    useState<InsignificantWaterUseType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<
    string[] | undefined
  >(undefined);

  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (isClientePortalRole(user?.role) && firestore) {
      setEmpreendedorIdsForUser(undefined);
      const currentUser = user!;
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

  const usosQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined)
      return null;

    if (isClientePortalRole(user.role) || user.role === "representative") {
      if (empreendedorIdsForUser.length > 0) {
        return query(
          collection(firestore, "usosInsignificantes"),
          where("empreendedorId", "in", empreendedorIdsForUser),
        );
      }
      return null;
    }

    return collection(firestore, "usosInsignificantes");
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: usos, isLoading: isLoadingUsos } =
    useCollection<InsignificantWaterUse>(usosQuery);

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

  const sortedUsos = useMemo(
    () =>
      [...(usos || [])].sort(
        (a, b) =>
          getSortDateValue(a.expirationDate) - getSortDateValue(b.expirationDate),
      ),
    [usos],
  );
  const filteredUsos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedUsos;
    return sortedUsos.filter((item) => {
      const empreendedor = (empreendedoresMap.get(item.empreendedorId) || "").toLowerCase();
      const empreendimento = (projectsMap.get(item.projectId || "") || "").toLowerCase();
      return (
        (item.usoType || "").toLowerCase().includes(term) ||
        (item.permitNumber || "").toLowerCase().includes(term) ||
        (item.status || "").toLowerCase().includes(term) ||
        empreendedor.includes(term) ||
        empreendimento.includes(term)
      );
    });
  }, [sortedUsos, searchTerm, empreendedoresMap, projectsMap]);

  const isLoading =
    isLoadingUsos ||
    isLoadingEmpreendedores ||
    isLoadingProjects ||
    ((isClientePortalRole(user?.role) || user?.role === "representative") &&
      empreendedorIdsForUser === undefined);

  const handleAddNew = (type: InsignificantWaterUseType) => {
    setEditingItem(null);
    setSelectedUsoType(type);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (item: InsignificantWaterUse) => {
    setEditingItem(item);
    setSelectedUsoType(item.usoType);
    setIsFormDialogOpen(true);
  };

  const handleView = (item: InsignificantWaterUse) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "usosInsignificantes", itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Registro removido",
          description: "O uso insignificante foi excluído.",
        });
      })
      .catch(() => {
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

  const getStatusVariant = (status: InsignificantWaterUse["status"]) =>
    permitStatusBadgeClassSimple[status];

  const closeFormDialog = (open: boolean) => {
    setIsFormDialogOpen(open);
    if (!open) {
      setEditingItem(null);
      setSelectedUsoType(null);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Usos Insignificantes de Água">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("usos-insignificantes-upload")
                        ?.click()
                    }
                  >
                    <Upload className="h-4 w-4" />
                    <span className="sr-only">Carregar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Carregar arquivo (referência)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <input
              id="usos-insignificantes-upload"
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              aria-label="Carregar arquivo de uso insignificante"
            />
            {canPerformWriteActions(user) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Adicionar Uso
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Selecione o tipo de uso</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {insignificantWaterUseOptions.map(({ type, label }) => (
                    <DropdownMenuItem key={type} onClick={() => handleAddNew(type)}>
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usos Insignificantes</CardTitle>
              <CardDescription>
                Cadastro no mesmo padrão das outorgas: empreendedor, empreendimento,
                prazos, finalidade e anexo. Os registros são salvos neste menu.
              </CardDescription>
              <CardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar tipo, empreendedor, empreendimento, documento..."
              />
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!isLoading &&
                    filteredUsos.map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {item.usoType}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {empreendedoresMap.get(item.empreendedorId) || "—"} ·{" "}
                                {projectsMap.get(item.projectId || "") || "—"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Doc.: {item.permitNumber} · Venc.:{" "}
                                {formatDate(item.expirationDate)}
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
                              {item.fileUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                    >
                                      <a
                                        href={item.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="sr-only">Anexo</span>
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Fazer download</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    type="button"
                                    onClick={() => handleView(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Ver</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar</p>
                                </TooltipContent>
                              </Tooltip>
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
                                        <span className="sr-only">Apagar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Apagar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredUsos.length === 0 && (
                    <div className="flex min-h-[7rem] items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 px-4 text-center text-sm text-muted-foreground">
                      Nenhum registro encontrado. Adicione um novo uso para começar.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={closeFormDialog}>
        <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col overflow-hidden">
          {(editingItem || selectedUsoType) && (
            <UsoInsignificanteForm
              key={editingItem?.id ?? selectedUsoType ?? "new"}
              usoType={selectedUsoType ?? undefined}
              currentItem={editingItem}
              onSuccess={() => closeFormDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Uso insignificante</DialogTitle>
            <DialogDescription>
              {viewingItem?.usoType} — {viewingItem?.permitNumber}
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-3 text-sm">
              <DetailItem label="Tipo" value={viewingItem.usoType} />
              <DetailItem
                label="Empreendedor"
                value={
                  empreendedoresMap.get(viewingItem.empreendedorId) ?? undefined
                }
              />
              <DetailItem
                label="Empreendimento"
                value={
                  projectsMap.get(viewingItem.projectId || "") ?? undefined
                }
              />
              <DetailItem label="Nº documento" value={viewingItem.permitNumber} />
              <DetailItem
                label="Nº processo"
                value={viewingItem.processNumber}
              />
              <DetailItem
                label="Emissão"
                value={formatDate(viewingItem.issueDate)}
              />
              <DetailItem
                label="Vencimento"
                value={formatDate(viewingItem.expirationDate)}
              />
              <DetailItem label="Status" value={viewingItem.status} />
              <DetailItem label="Finalidade" value={viewingItem.description} />
              <AttachmentPreviewSection
                fileUrl={viewingItem.fileUrl}
                sectionLabel="Anexo"
                emptyLabel="Nenhum anexo."
                zoomTitle="Anexo"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será removido do
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}




