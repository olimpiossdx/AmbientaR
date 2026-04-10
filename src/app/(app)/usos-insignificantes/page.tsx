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
import { FirestorePermissionError } from "@/firebase/errors";
import { Label } from "@/components/ui/label";
import { CardSearchInput } from "@/components/card-search-input";
import { fetchEmpreendedorIdsForRepresentative } from "@/lib/representative-empreendedor-ids";

const tiposDeUso: { type: InsignificantWaterUseType; label: string }[] = [
  { type: "Poço Tubular", label: "Poço Tubular" },
  { type: "Captação Superficial", label: "Captação Superficial" },
  { type: "Captação Em Barramento", label: "Captação Em Barramento" },
  { type: "Barramento Sem Captação", label: "Barramento Sem Captação" },
  { type: "Captação em Nascente", label: "Captação em Nascente" },
  { type: "Captação em Cisterna", label: "Captação em Cisterna" },
];

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
    if (user?.role === "client" && firestore) {
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

  const usosQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined)
      return null;

    if (user.role === "client" || user.role === "representative") {
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
    ((user?.role === "client" || user?.role === "representative") &&
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

  const getStatusVariant = (status: InsignificantWaterUse["status"]) => {
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
                  {tiposDeUso.map(({ type, label }) => (
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
                <div className="space-y-3 md:hidden">
                  {isLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i} className="rounded-xl border-border/70 shadow-sm">
                        <CardContent className="p-4 space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-32" />
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading &&
                    filteredUsos.map((item) => (
                      <Card
                        key={item.id}
                        className="rounded-xl border-border/70 shadow-sm"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {item.usoType}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {empreendedoresMap.get(item.empreendedorId) ||
                                  "—"}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(getStatusVariant(item.status))}
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="text-muted-foreground">
                                Doc.:
                              </span>{" "}
                              {item.permitNumber}
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Venc.:
                              </span>{" "}
                              {formatDate(item.expirationDate)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
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
                  {!isLoading && filteredUsos.length === 0 && (
                    <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-lg text-sm text-muted-foreground text-center px-4">
                      Nenhum registro encontrado. Adicione um novo uso para começar.
                    </div>
                  )}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de uso</TableHead>
                        <TableHead>Empreendedor</TableHead>
                        <TableHead>Empreendimento</TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Nº doc.
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
                            <TableCell colSpan={7}>
                              <Skeleton className="h-8 w-full" />
                            </TableCell>
                          </TableRow>
                        ))}
                      {!isLoading &&
                        filteredUsos.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.usoType}
                            </TableCell>
                            <TableCell>
                              {empreendedoresMap.get(item.empreendedorId) ||
                                "—"}
                            </TableCell>
                            <TableCell>
                              {projectsMap.get(item.projectId || "") || "—"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {item.permitNumber}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {formatDate(item.expirationDate)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(getStatusVariant(item.status))}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
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
                                      className="text-destructive"
                                      onClick={() => openDeleteConfirm(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      {!isLoading && filteredUsos.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="h-24 text-center text-muted-foreground"
                          >
                            Nenhum registro encontrado. Use &quot;Adicionar
                            Uso&quot; para cadastrar.
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
              {viewingItem.fileUrl && (
                <a
                  href={viewingItem.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline text-sm"
                >
                  Abrir anexo
                </a>
              )}
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
