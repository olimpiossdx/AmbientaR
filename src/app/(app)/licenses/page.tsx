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
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  errorEmitter,
} from "@/firebase";
import { collection, doc, query, where, getDocs } from "firebase/firestore";
import type { License, Empreendedor, AppUser, Project } from "@/lib/types";
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
import { LicenseForm } from "./license-form";
import { useToast } from "@/hooks/use-toast";
import { FirestorePermissionError } from "@/firebase/errors";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
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
  value?: string | null;
}) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">{value ?? "Não informado"}</p>
  </div>
);

export default function LicensesPage() {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [viewingLicense, setViewingLicense] = useState<License | null>(null);
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
      const empreendedoresRef = collection(firestore, "empreendedores");
      const byUserId = query(empreendedoresRef, where("userId", "==", user.id));
      const variants = [user.cpf || user.userCpf, ...(user.cnpjs || [])].filter(
        Boolean,
      ) as string[];
      const normalized = new Set<string>();
      variants.forEach((v) => {
        normalized.add(v);
        const d = v.replace(/\D/g, "");
        if (d.length >= 11) normalized.add(d);
      });
      const variantList = Array.from(normalized).slice(0, 10);
      const byCpf =
        variantList.length > 0
          ? query(empreendedoresRef, where("cpfCnpj", "in", variantList))
          : null;
      Promise.all([
        getDocs(byUserId),
        byCpf ? getDocs(byCpf) : Promise.resolve({ docs: [] }),
      ])
        .then(([snapU, snapCpf]) => {
          const ids = new Set<string>([
            ...snapU.docs.map((d) => d.id),
            ...snapCpf.docs.map((d) => d.id),
          ]);
          setEmpreendedorIdsForUser(
            ids.size > 0 ? Array.from(ids) : ["invalid-placeholder"],
          );
        })
        .catch(() => setEmpreendedorIdsForUser(["invalid-placeholder"]));
    } else if (user?.role === "representative" && firestore) {
      setEmpreendedorIdsForUser(undefined);
      fetchEmpreendedorIdsForRepresentative(firestore, user)
        .then(setEmpreendedorIdsForUser)
        .catch(() => setEmpreendedorIdsForUser(["invalid-placeholder"]));
    } else if (user) {
      setEmpreendedorIdsForUser([]);
    }
  }, [user, firestore]);

  const licensesQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined)
      return null;

    if (isClientePortalRole(user.role) || user.role === "representative") {
      if (empreendedorIdsForUser.length > 0) {
        return query(
          collection(firestore, "licenses"),
          where("empreendedorId", "in", empreendedorIdsForUser),
        );
      }
      return query(
        collection(firestore, "licenses"),
        where("empreendedorId", "in", ["invalid-placeholder"]),
      );
    }

    // For manager roles
    return collection(firestore, "licenses");
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: licenses, isLoading: isLoadingLicenses } =
    useCollection<License>(licensesQuery);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const { data: allEmpreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );
  const { data: allProjects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const isLoading =
    isLoadingLicenses ||
    isLoadingEmpreendedores ||
    isLoadingProjects ||
    ((isClientePortalRole(user?.role) || user?.role === "representative") &&
      empreendedorIdsForUser === undefined);

  const empreendedoresMap = useMemo(
    () => new Map(allEmpreendedores?.map((e) => [e.id, e.name])),
    [allEmpreendedores],
  );
  const projectsMap = useMemo(
    () => new Map(allProjects?.map((p) => [p.id, p.propertyName])),
    [allProjects],
  );
  const getSortDateValue = (dateString?: string | null) => {
    if (!dateString) return Number.POSITIVE_INFINITY;
    const value = new Date(dateString).getTime();
    return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
  };
  const sortedLicenses = useMemo(
    () =>
      [...(licenses || [])].sort(
        (a, b) =>
          getSortDateValue(a.expirationDate) - getSortDateValue(b.expirationDate),
      ),
    [licenses],
  );
  const filteredLicenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedLicenses;
    return sortedLicenses.filter((license) => {
      const empreendedor = (empreendedoresMap.get(license.empreendedorId) || "").toLowerCase();
      const empreendimento = (projectsMap.get(license.projectId || "") || "").toLowerCase();
      return (
        (license.licenseNumber || "").toLowerCase().includes(term) ||
        (license.processNumber || "").toLowerCase().includes(term) ||
        (license.status || "").toLowerCase().includes(term) ||
        (license.permitType || "").toLowerCase().includes(term) ||
        empreendedor.includes(term) ||
        empreendimento.includes(term)
      );
    });
  }, [sortedLicenses, searchTerm, empreendedoresMap, projectsMap]);

  const handleAddNew = () => {
    router.push("/licenses/new");
  };

  const handleEdit = (license: License) => {
    router.push(`/licenses/${license.id}/edit`);
  };

  const handleGoToCondicionantes = () => {
    router.push("/compliance");
  };

  const handleView = (license: License) => {
    setViewingLicense(license);
    setIsViewDialogOpen(true);
  };

  const openDeleteConfirm = (licenseId: string) => {
    setItemToDelete(licenseId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const licenseDocRef = doc(firestore, "licenses", itemToDelete);
    backupAndDeleteParentWithCondicionantes({
      firestore,
      collectionName: "licenses",
      documentId: itemToDelete,
      user,
      reason: "Exclusão manual na tela de licenças",
    })
      .then(() => {
        toast({
          title: "Licença deletada",
          description:
            "A licença e suas condicionantes relacionadas foram removidas com backup de segurança.",
        });
        setIsAlertOpen(false);
        setItemToDelete(null);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: licenseDocRef.path,
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

  const getStatusVariant = (status: License["status"]) => {
    switch (status) {
      case "Válida":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "Em Renovação":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      case "Vencida":
        return "bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      case "Suspensa":
      case "Cancelada":
      case "Em Andamento":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20";
      default:
        return "bg-slate-500/20 text-slate-700 border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
    }
  };

  const getPermitTypeLabel = (type: License["permitType"]) => {
    const types = {
      LP: "LP - Licença Prévia",
      LI: "LI - Licença de Instalação",
      LO: "LO - Licença de Operação",
      LAS: "LAS - Licença Ambiental Simplificada",
      AAF: "AAF - Autorização Ambiental de Funcionamento",
      Outra: "Outra",
    };
    return types[type] || type;
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Licenças Ambientais">
          {canPerformWriteActions(user) && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Licença
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Licenças</CardTitle>
              <CardDescription>
                Acompanhe e gerencie todas as licenças ambientais dos seus
                clientes.
              </CardDescription>
              <CardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar nº licença, processo, empreendedor..."
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
                    filteredLicenses.map((license) => (
                      <Card key={license.id} className="rounded-xl border-border/70 shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {empreendedoresMap.get(license.empreendedorId) || "N/A"}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {projectsMap.get(license.projectId) || "N/A"}
                              </p>
                            </div>
                            <Badge
                              variant={"outline"}
                              className={cn(getStatusVariant(license.status))}
                            >
                              {license.status}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <p>
                              <span className="text-muted-foreground">
                                Nº Licença:
                              </span>{" "}
                              {license.permitNumber || "N/A"}
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Vencimento:
                              </span>{" "}
                              {formatDate(license.expirationDate || "")}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {license.fileUrl && (
                              <Button asChild variant="ghost" size="icon">
                                <a
                                  href={license.fileUrl}
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
                                onClick={() => handleEdit(license)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(license)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleGoToCondicionantes}
                            >
                              <ClipboardCheck className="h-4 w-4" />
                            </Button>
                            {canPerformWriteActions(user) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(license)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => openDeleteConfirm(license.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredLicenses.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                      Nenhuma licença encontrada.
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendedor</TableHead>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead>Nº da Licença</TableHead>
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
                          <TableCell>
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
                      filteredLicenses.map((license) => (
                        <TableRow key={license.id}>
                          <TableCell className="font-medium">
                            {empreendedoresMap.get(license.empreendedorId) ||
                              "N/A"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {projectsMap.get(license.projectId) || "N/A"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {license.permitNumber || "N/A"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {formatDate(license.expirationDate || "")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={"outline"}
                              className={cn(getStatusVariant(license.status))}
                            >
                              {license.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {license.fileUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button asChild variant="ghost" size="icon">
                                      <a
                                        href={license.fileUrl}
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
                                      onClick={() => handleEdit(license)}
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
                                    onClick={() => handleView(license)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Visualizar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleGoToCondicionantes}
                                  >
                                    <ClipboardCheck className="h-4 w-4" />
                                    <span className="sr-only">
                                      Ver condicionantes
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver condicionantes</p>
                                </TooltipContent>
                              </Tooltip>
                              {canPerformWriteActions(user) && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(license)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar licença</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() =>
                                          openDeleteConfirm(license.id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Deletar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Deletar licença</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && filteredLicenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhuma licença encontrada.
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
          <LicenseForm
            currentLicense={editingLicense}
            onSuccess={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Licença</DialogTitle>
            <DialogDescription>
              Visualização dos dados cadastrados para a licença #
              {viewingLicense?.permitNumber}.
            </DialogDescription>
          </DialogHeader>
          {viewingLicense && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Empreendedor"
                  value={empreendedoresMap.get(viewingLicense.empreendedorId)}
                />
                <DetailItem
                  label="Empreendimento"
                  value={projectsMap.get(viewingLicense.projectId)}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Nº da Licença"
                  value={viewingLicense.permitNumber}
                />
                <DetailItem
                  label="Nº do Processo"
                  value={viewingLicense.processNumber}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Tipo"
                  value={getPermitTypeLabel(viewingLicense.permitType)}
                />
                <DetailItem
                  label="Órgão Emissor"
                  value={viewingLicense.issuingBody}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Data de Emissão"
                  value={formatDate(viewingLicense.issueDate)}
                />
                <DetailItem
                  label="Data de Vencimento"
                  value={formatDate(viewingLicense.expirationDate)}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <div>
                  <Badge
                    variant={"outline"}
                    className={cn(getStatusVariant(viewingLicense.status))}
                  >
                    {viewingLicense.status}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <Label>Descrição / Objeto</Label>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {viewingLicense.description || "N/A"}
                </p>
              </div>
              {viewingLicense.fileUrl && (
                <div className="space-y-1">
                  <Label>Anexo</Label>
                  <p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={viewingLicense.fileUrl}
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
              <Button variant="outline">Fechar</Button>
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
              a licença.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
