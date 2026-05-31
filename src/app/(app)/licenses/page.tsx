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
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  errorEmitter,
} from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  collection,
  doc,
  documentId,
  query,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import type { License, Empreendedor, AppUser, Project } from "@/lib/types";
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
import { LicenseForm } from "./license-form";
import { useToast } from "@/hooks/use-toast";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
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
import { fetchEmpreendedorIdsForPortalScope, isEmpreendedorScopedPortalRole } from "@/lib/portal-empreendedor-scope";
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
    if ((user?.role === "client" || user?.role === "cliente_autonomo") && firestore) {
      setEmpreendedorIdsForUser(undefined);
      const empreendedoresRef = collection(firestore, "empreendedores");
      const uid = resolvePortalAuthUid(user);
      if (!uid) {
        setEmpreendedorIdsForUser(["invalid-placeholder"]);
        return;
      }
      const byUserId = query(empreendedoresRef, where("userId", "==", uid));
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
    } else if (
      (user?.role === "representative" ||
        user?.role === "consultor_representante") &&
      firestore
    ) {
      setEmpreendedorIdsForUser(undefined);
      fetchEmpreendedorIdsForPortalScope(firestore, user)
        .then(setEmpreendedorIdsForUser)
        .catch(() => setEmpreendedorIdsForUser(["invalid-placeholder"]));
    } else if (user) {
      setEmpreendedorIdsForUser([]);
    }
  }, [user, firestore]);

  const licensesQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined)
      return null;

    if (isEmpreendedorScopedPortalRole(user.role)) {
      if (empreendedorIdsForUser.length > 0) {
        return query(
          collection(firestore, "licenses"),
          where("empreendedorId", "in", empreendedorIdsForUser),
          limit(200),
        );
      }
      return query(
        collection(firestore, "licenses"),
        where("empreendedorId", "in", ["invalid-placeholder"]),
        limit(1),
      );
    }

    // For manager roles
    return query(collection(firestore, "licenses"), limit(200));
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: licenses, isLoading: isLoadingLicenses } =
    useCollection<License>(licensesQuery);

  const empreendedoresQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const portal = isEmpreendedorScopedPortalRole(user.role);
    if (portal) {
      if (empreendedorIdsForUser === undefined) return null;
      const ids = empreendedorIdsForUser.filter(
        (id) => id && !id.includes("placeholder") && !id.includes("invalid"),
      );
      if (ids.length === 0) return null;
      return query(
        collection(firestore, "empreendedores"),
        where(documentId(), "in", ids.slice(0, 10)),
      );
    }
    return query(collection(firestore, "empreendedores"), limit(200));
  }, [firestore, user, empreendedorIdsForUser]);
  const { data: allEmpreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const portal = isEmpreendedorScopedPortalRole(user.role);
    if (portal) {
      if (empreendedorIdsForUser === undefined) return null;
      const ids = empreendedorIdsForUser.filter(
        (id) => id && !id.includes("placeholder") && !id.includes("invalid"),
      );
      if (ids.length === 0) return null;
      return query(
        collection(firestore, "projects"),
        where("empreendedorId", "in", ids.slice(0, 10)),
      );
    }
    return query(collection(firestore, "projects"), limit(200));
  }, [firestore, user, empreendedorIdsForUser]);
  const { data: allProjects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const isLoading =
    isLoadingLicenses ||
    isLoadingEmpreendedores ||
    isLoadingProjects ||
    ((isEmpreendedorScopedPortalRole(user?.role)) &&
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

  const getStatusVariant = (status: License["status"]) =>
    permitStatusBadgeClassRich[status];

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
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!isLoading &&
                    filteredLicenses.map((license) => (
                      <Card
                        key={license.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {empreendedoresMap.get(license.empreendedorId) || "N/A"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {projectsMap.get(license.projectId) || "N/A"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Nº {license.permitNumber || "N/A"} · Venc.:{" "}
                                {formatDate(license.expirationDate || "")}
                                {license.processNumber
                                  ? ` · Proc.: ${license.processNumber}`
                                  : ""}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn("w-fit", getStatusVariant(license.status))}
                              >
                                {license.status}
                              </Badge>
                            </div>
                            <Separator className="bg-border/60" />
                            <div className="flex flex-wrap items-center gap-1">
                              {license.fileUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                    >
                                      <a
                                        href={license.fileUrl}
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
                                    className="h-9 w-9 shrink-0"
                                    type="button"
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
                                    className="h-9 w-9 shrink-0"
                                    type="button"
                                    onClick={handleGoToCondicionantes}
                                  >
                                    <ClipboardCheck className="h-4 w-4" />
                                    <span className="sr-only">Condicionantes</span>
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
                                        className="h-9 w-9 shrink-0"
                                        type="button"
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
                                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                        type="button"
                                        onClick={() => openDeleteConfirm(license.id)}
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
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredLicenses.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhuma licença encontrada.
                    </div>
                  )}
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
              <AttachmentPreviewSection
                fileUrl={viewingLicense.fileUrl}
                sectionLabel="Anexo"
                emptyLabel="Nenhum documento anexado."
                zoomTitle="Anexo da licença"
              />
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




