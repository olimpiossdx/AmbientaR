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
} from "@/firebase";
import {
  collection,
  doc,
  documentId,
  query,
  where,
  limit,
} from "firebase/firestore";
import type { Tac, Empreendedor, AppUser, Project } from "@/lib/types";
import { tacStatusBadgeClassRich } from "@/lib/status-display-classes";
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
import { useToast } from "@/hooks/use-toast";
import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
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
import {
  fetchEmpreendedorIdsForPortalScope,
  isEmpreendedorScopedPortalRole,
} from "@/lib/portal-empreendedor-scope";
import { canPerformOperationalWrite } from "@/lib/role-guards";
import { EmpreendedorProjectFilter } from "@/components/documentos-ambientais/empreendedor-project-filter";

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

export function TacsListView() {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewingTac, setViewingTac] = useState<Tac | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEmpreendedorId, setFilterEmpreendedorId] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = useState<
    string[] | undefined
  >(undefined);

  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isEmpreendedorScopedPortalRole(user?.role) && firestore && user) {
      setEmpreendedorIdsForUser(undefined);
      fetchEmpreendedorIdsForPortalScope(firestore, user)
        .then(setEmpreendedorIdsForUser)
        .catch(() => setEmpreendedorIdsForUser(["invalid-placeholder"]));
    } else if (user) {
      setEmpreendedorIdsForUser([]);
    }
  }, [user, firestore]);

  const tacsQuery = useMemoFirebase(() => {
    if (!firestore || !user || empreendedorIdsForUser === undefined)
      return null;

    if (isEmpreendedorScopedPortalRole(user.role)) {
      if (empreendedorIdsForUser.length > 0) {
        return query(
          collection(firestore, "tacs"),
          where("empreendedorId", "in", empreendedorIdsForUser),
          limit(200),
        );
      }
      return query(
        collection(firestore, "tacs"),
        where("empreendedorId", "in", ["invalid-placeholder"]),
        limit(1),
      );
    }

    return query(collection(firestore, "tacs"), limit(200));
  }, [firestore, user, empreendedorIdsForUser]);

  const { data: tacs, isLoading: isLoadingTacs } =
    useCollection<Tac>(tacsQuery);

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
    isLoadingTacs ||
    isLoadingEmpreendedores ||
    isLoadingProjects ||
    (isEmpreendedorScopedPortalRole(user?.role) &&
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

  const sortedTacs = useMemo(
    () =>
      [...(tacs || [])].sort(
        (a, b) =>
          getSortDateValue(a.expirationDate || a.issueDate) -
          getSortDateValue(b.expirationDate || b.issueDate),
      ),
    [tacs],
  );

  const scopedTacs = useMemo(() => {
    let list = sortedTacs;
    if (filterEmpreendedorId) {
      list = list.filter((t) => t.empreendedorId === filterEmpreendedorId);
    }
    if (filterProjectId) {
      list = list.filter((t) => t.projectId === filterProjectId);
    }
    return list;
  }, [sortedTacs, filterEmpreendedorId, filterProjectId]);

  const filteredTacs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return scopedTacs;
    return scopedTacs.filter((tac) => {
      const empreendedor = (
        empreendedoresMap.get(tac.empreendedorId) || ""
      ).toLowerCase();
      const empreendimento = (
        projectsMap.get(tac.projectId || "") || ""
      ).toLowerCase();
      return (
        (tac.tacNumber || "").toLowerCase().includes(term) ||
        (tac.processNumber || "").toLowerCase().includes(term) ||
        (tac.protocolNumber || "").toLowerCase().includes(term) ||
        (tac.gtacId || "").toLowerCase().includes(term) ||
        (tac.status || "").toLowerCase().includes(term) ||
        empreendedor.includes(term) ||
        empreendimento.includes(term)
      );
    });
  }, [scopedTacs, searchTerm, empreendedoresMap, projectsMap]);

  const showEntityFilter = !isEmpreendedorScopedPortalRole(user?.role);

  const handleAddNew = () => {
    router.push("/tacs/new");
  };

  const handleEdit = (tac: Tac) => {
    router.push(`/tacs/${tac.id}/edit`);
  };

  const handleGoToCondicionantes = () => {
    router.push("/compliance");
  };

  const handleView = (tac: Tac) => {
    setViewingTac(tac);
    setIsViewDialogOpen(true);
  };

  const openDeleteConfirm = (tacId: string) => {
    setItemToDelete(tacId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const tacDocRef = doc(firestore, "tacs", itemToDelete);
    backupAndDeleteParentWithCondicionantes({
      firestore,
      collectionName: "tacs",
      documentId: itemToDelete,
      user,
      reason: "Exclusão manual na tela de TACs",
    })
      .then(() => {
        toast({
          title: "TAC deletado",
          description:
            "O TAC e suas condicionantes relacionadas foram removidos com backup de segurança.",
        });
        setIsAlertOpen(false);
        setItemToDelete(null);
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: "Erro ao excluir TAC",
          context: {
            path: tacDocRef.path,
            operation: "delete",
          },
        }),
      )
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  };

  const getStatusVariant = (status: Tac["status"]) =>
    tacStatusBadgeClassRich[status];

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="TAC — Termo de Ajust. de Conduta">
          {canPerformWriteActions(user) && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Adicionar TAC
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de TACs</CardTitle>
              <CardDescription>
                Acompanhe Termos de Ajustamento de Conduta e suas obrigações
                vinculadas.
              </CardDescription>
              {showEntityFilter && (
                <EmpreendedorProjectFilter
                  empreendedores={allEmpreendedores}
                  allProjects={allProjects}
                  empreendedorId={filterEmpreendedorId}
                  projectId={filterProjectId}
                  onEmpreendedorIdChange={setFilterEmpreendedorId}
                  onProjectIdChange={setFilterProjectId}
                  isLoading={isLoadingEmpreendedores || isLoadingProjects}
                  className="pt-2"
                />
              )}
              <CardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar processo SEI, protocolo, GTAC, empreendedor..."
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
                    filteredTacs.map((tac) => (
                      <Card
                        key={tac.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {empreendedoresMap.get(tac.empreendedorId) ||
                                  "N/A"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {projectsMap.get(tac.projectId) || "N/A"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                SEI: {tac.processNumber || "N/A"}
                                {tac.tacNumber ? ` · TAC: ${tac.tacNumber}` : ""}
                                {tac.expirationDate
                                  ? ` · Venc.: ${formatDate(tac.expirationDate)}`
                                  : ""}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn("w-fit", getStatusVariant(tac.status))}
                              >
                                {tac.status}
                              </Badge>
                            </div>
                            <Separator className="bg-border/60" />
                            <div className="flex flex-wrap items-center gap-1">
                              {tac.fileUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                    >
                                      <a
                                        href={tac.fileUrl}
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
                                      onClick={() => handleEdit(tac)}
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
                                    onClick={() => handleView(tac)}
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
                                        onClick={() => handleEdit(tac)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar TAC</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                        type="button"
                                        onClick={() => openDeleteConfirm(tac.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Deletar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Deletar TAC</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredTacs.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhum TAC encontrado.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do TAC</DialogTitle>
            <DialogDescription>
              Visualização dos dados cadastrados para o processo{" "}
              {viewingTac?.processNumber}.
            </DialogDescription>
          </DialogHeader>
          {viewingTac && (
            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Empreendedor"
                  value={empreendedoresMap.get(viewingTac.empreendedorId)}
                />
                <DetailItem
                  label="Empreendimento"
                  value={projectsMap.get(viewingTac.projectId)}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="ID GTAC" value={viewingTac.gtacId} />
                <DetailItem
                  label="Nº Protocolo"
                  value={viewingTac.protocolNumber}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Nº Processo SEI"
                  value={viewingTac.processNumber}
                />
                <DetailItem label="Nº TAC" value={viewingTac.tacNumber} />
              </div>
              <DetailItem
                label="Unidade Administrativa"
                value={viewingTac.issuingBody}
              />
              <Separator />
              <div className="grid grid-cols-3 gap-4">
                <DetailItem
                  label="Assinatura"
                  value={formatDate(viewingTac.issueDate)}
                />
                <DetailItem
                  label="Publicação"
                  value={formatDate(viewingTac.publicationDate)}
                />
                <DetailItem
                  label="Vencimento"
                  value={formatDate(viewingTac.expirationDate)}
                />
              </div>
              <div className="space-y-1">
                <Label>Situação</Label>
                <div>
                  <Badge
                    variant="outline"
                    className={cn(getStatusVariant(viewingTac.status))}
                  >
                    {viewingTac.status}
                  </Badge>
                </div>
              </div>
              <Separator />
              <DetailItem
                label="Processo de licenciamento anterior"
                value={viewingTac.licensingProcessBeforeTac}
              />
              <DetailItem
                label="Processo formalizado após TAC"
                value={viewingTac.licensingProcessAfterTac}
              />
              <div className="space-y-1">
                <Label>Descrição / Observações</Label>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {viewingTac.description || "N/A"}
                </p>
              </div>
              <AttachmentPreviewSection
                fileUrl={viewingTac.fileUrl}
                sectionLabel="Anexo"
                emptyLabel="Nenhum documento anexado."
                zoomTitle="Anexo do TAC"
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
              o TAC e suas condicionantes vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
