"use client";
import { useState, useMemo, useCallback } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  FileText,
  Pencil,
  Trash2,
  Eye,
  Upload,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  errorEmitter,
  useAuth,
} from "@/firebase";
import {
  collection,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import * as React from "react";
import {
  uploadFileToStorage,
  sanitizeStorageFileName,
} from "@/lib/storage-upload";
import { fetchBrandingImageAsBase64 } from "@/lib/branding-pdf";
import { useLocalBranding } from "@/hooks/use-local-branding";
import type {
  Contract,
  Client,
  CompanySettings,
  AppUser,
  CommercialProposal,
} from "@/lib/types";
import {
  canApproveContracts,
  canWriteContractsCommercial,
  isAdminOrFinancialRole,
  isClientePortalRole,
} from "@/lib/role-guards";
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
import { useToast } from "@/hooks/use-toast";
import { FirestorePermissionError } from "@/firebase/errors";
import { generateContractPdf } from "./contract-pdf";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { ContractForm } from "./contract-form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null | number;
}) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">{value || "Não informado"}</p>
  </div>
);

/** Variantes de CPF/CNPJ (original + só dígitos) para match no Firestore, máx 10. */
function documentVariants(
  cpf: string | undefined,
  cnpjs: string[] | undefined,
): string[] {
  const raw = [cpf, ...(cnpjs || [])].filter(Boolean) as string[];
  const set = new Set<string>();
  for (const v of raw) {
    set.add(v);
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 11) set.add(digits);
  }
  return Array.from(set).slice(0, 10);
}

export default function ContractsPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Contract | null>(null);
  const [viewingItem, setViewingItem] = useState<Contract | null>(null);
  const [uploadingItem, setUploadingItem] = useState<Contract | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFromProposalOpen, setIsFromProposalOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState("");
  const [filterCliente, setFilterCliente] = useState("");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterValorMin, setFilterValorMin] = useState("");
  const [filterValorMax, setFilterValorMax] = useState("");
  const router = useRouter();

  const { user } = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const [clientIdsForUser, setClientIdsForUser] = useState<string[] | null>(
    null,
  );

  // Resolve os clientIds que o usuário (cliente ou representante) pode ver.
  React.useEffect(() => {
    if (!firestore || !user) return;

    // Cliente titular.
    if (isClientePortalRole(user.role)) {
      const isSelfRegistered = !!(user as any).package;
      const cRef = collection(firestore, "clients");
      const userCpf = user.cpf || user.userCpf;
      const userDocs = documentVariants(userCpf, user.cnpjs);

      if (isSelfRegistered) {
        const q = query(cRef, where("userId", "==", user.id));

        // Fallback: se `userId` não casar com os dados do client no Firestore,
        // tenta também por CPF/CNPJ.
        const qByDoc =
          userDocs.length > 0
            ? query(cRef, where("cpfCnpj", "in", userDocs))
            : null;

        const snapsPromises = qByDoc
          ? [getDocs(q), getDocs(qByDoc)]
          : [getDocs(q)];
        Promise.all(snapsPromises)
          .then((snaps) => {
            const ids = new Set<string>();
            snaps.forEach((snap) => snap.docs.forEach((d) => ids.add(d.id)));
            setClientIdsForUser(Array.from(ids));
          })
          .catch(() => setClientIdsForUser([]));
      } else {
        if (userDocs.length > 0) {
          const q = query(cRef, where("cpfCnpj", "in", userDocs));
          getDocs(q)
            .then((snap) => setClientIdsForUser(snap.docs.map((d) => d.id)))
            .catch(() => setClientIdsForUser([]));
        } else setClientIdsForUser([]);
      }
      return;
    }

    // Representante: clientes que o titular aprovou.
    if (user.role === "representative") {
      const repUid = user.id || (user as any).uid;
      if (!repUid) {
        setClientIdsForUser([]);
        return;
      }
      const cRef = collection(firestore, "clients");
      const q = query(cRef, where("approvedUserIds", "array-contains", repUid));
      getDocs(q)
        .then((snap) => setClientIdsForUser(snap.docs.map((d) => d.id)))
        .catch(() => setClientIdsForUser([]));
      return;
    }

    setClientIdsForUser(null);
  }, [firestore, user]);

  const contractsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Busca geral; o filtro por perfil é aplicado em memória
    // para suportar contratos legados (clientId) e novos (contratante.clientId).
    return collection(firestore, "contracts");
  }, [firestore, user]);

  const { data: contracts, isLoading: isLoadingContracts } =
    useCollection<Contract>(contractsQuery);
  const acceptedProposalsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, "commercialProposals"),
            where("status", "==", "Accepted"),
          )
        : null,
    [firestore],
  );
  const { data: acceptedProposals } = useCollection<CommercialProposal>(
    acceptedProposalsQuery,
  );
  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "clients") : null),
    [firestore],
  );
  const { data: clients } = useCollection<Client>(clientsQuery);

  const { data: brandingData } = useLocalBranding();

  const handleAddNew = () => {
    setEditingItem(null);
    setSelectedProposalId("");
    setIsDialogOpen(true);
  };
  const handleOpenFromProposal = () => {
    setSelectedProposalId("");
    setIsFromProposalOpen(true);
  };
  const handleCreateFromProposal = () => {
    if (!selectedProposal) return;
    setEditingItem(null);
    setIsFromProposalOpen(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Contract) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleView = (item: Contract) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const handleOpenUpload = (item: Contract) => {
    setUploadingItem(item);
    setIsUploadOpen(true);
    setFileToUpload(null);
  };

  const handleFileUpload = async () => {
    if (!fileToUpload || !uploadingItem || !firestore) return;
    setIsUploading(true);

    try {
      const safe = sanitizeStorageFileName(fileToUpload.name);
      const downloadUrl = await uploadFileToStorage(
        fileToUpload,
        `signed-contracts/${uploadingItem.id}/${Date.now()}-${safe}`,
      );

      const docRef = doc(firestore, "contracts", uploadingItem.id);
      await updateDoc(docRef, { fileUrl: downloadUrl });

      toast({
        title: "Upload Concluído",
        description: "O contrato assinado foi anexado com sucesso.",
      });
      setIsUploadOpen(false);
      setFileToUpload(null);
    } catch (error) {
      console.error("Error uploading signed contract:", error);
      toast({
        variant: "destructive",
        title: "Erro no Upload",
        description: "Não foi possível enviar o arquivo.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleApprove = async (contractId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, "contracts", contractId);
    try {
      await updateDoc(docRef, { status: "Aprovado" });
      toast({
        title: "Contrato Aprovado",
        description: "O contrato foi movido para a lista de finalizados.",
      });
    } catch (error) {
      console.error("Error approving contract:", error);
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: "update",
        requestResourceData: { status: "Aprovado" },
      });
      errorEmitter.emit("permission-error", permissionError);
    }
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "contracts", itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Contrato deletado",
          description: "O contrato foi removido com sucesso.",
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

  const handleGeneratePdf = async (contract: Contract) => {
    try {
      await generateContractPdf(
        contract,
        brandingData ?? undefined,
        fetchBrandingImageAsBase64,
      );
      toast({
        title: "PDF gerado",
        description:
          "O contrato foi exportado com todas as cláusulas e assinaturas.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao gerar PDF",
        description:
          err instanceof Error
            ? err.message
            : "Não foi possível gerar o PDF do contrato.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value ?? 0);

  const visibleContracts = useMemo(() => {
    const all = contracts || [];
    if (!user) return all;
    if (!isClientePortalRole(user.role) && user.role !== "representative")
      return all;
    if (!clientIdsForUser || clientIdsForUser.length === 0) return [];
    const allowedIds = new Set(clientIdsForUser);
    return all.filter((contract) => {
      const legacyClientId = (contract as any).clientId as string | undefined;
      const nestedClientId = contract.contratante?.clientId;
      return (
        (legacyClientId && allowedIds.has(legacyClientId)) ||
        (nestedClientId && allowedIds.has(nestedClientId))
      );
    });
  }, [contracts, user, clientIdsForUser]);

  const draftContracts = useMemo(
    () => visibleContracts.filter((c) => c.status !== "Aprovado"),
    [visibleContracts],
  );
  const approvedContracts = useMemo(
    () => visibleContracts.filter((c) => c.status === "Aprovado"),
    [visibleContracts],
  );

  const applyContractFilters = useCallback(
    (list: Contract[]) => {
      return list.filter((c) => {
        const nome = c.contratante?.nome ?? "";
        if (
          filterCliente.trim() &&
          !nome.toLowerCase().includes(filterCliente.trim().toLowerCase())
        )
          return false;
        const dataStr = c.dataContrato?.slice(0, 10) ?? "";
        if (filterDataInicio && dataStr < filterDataInicio) return false;
        if (filterDataFim && dataStr > filterDataFim) return false;
        const valor = c.pagamento?.valorTotal ?? 0;
        const vMin = filterValorMin !== "" ? parseFloat(filterValorMin) : null;
        const vMax = filterValorMax !== "" ? parseFloat(filterValorMax) : null;
        if (vMin != null && !Number.isNaN(vMin) && valor < vMin) return false;
        if (vMax != null && !Number.isNaN(vMax) && valor > vMax) return false;
        return true;
      });
    },
    [
      filterCliente,
      filterDataInicio,
      filterDataFim,
      filterValorMin,
      filterValorMax,
    ],
  );
  const filteredDraftContracts = useMemo(
    () =>
      [...applyContractFilters(draftContracts ?? [])].sort((a, b) =>
        (a.contratante?.nome || "").localeCompare(
          b.contratante?.nome || "",
          "pt-BR",
          { sensitivity: "base" },
        ),
      ),
    [draftContracts, applyContractFilters],
  );
  const filteredApprovedContracts = useMemo(
    () =>
      [...applyContractFilters(approvedContracts ?? [])].sort((a, b) =>
        (a.contratante?.nome || "").localeCompare(
          b.contratante?.nome || "",
          "pt-BR",
          { sensitivity: "base" },
        ),
      ),
    [approvedContracts, applyContractFilters],
  );
  const clientsMap = useMemo(
    () => new Map((clients || []).map((client) => [client.id, client])),
    [clients],
  );
  const availableAcceptedProposals = useMemo(
    () => (acceptedProposals || []).filter((p) => !p.contractId),
    [acceptedProposals],
  );
  const selectedProposal = useMemo(
    () =>
      availableAcceptedProposals.find((p) => p.id === selectedProposalId) ||
      null,
    [availableAcceptedProposals, selectedProposalId],
  );

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Contratos">
          {canWriteContractsCommercial(user?.role) && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={handleOpenFromProposal}
              >
                <PlusCircle className="h-4 w-4" />
                De proposta aceita
              </Button>
              <Button size="sm" className="gap-1" onClick={handleAddNew}>
                <PlusCircle className="h-4 w-4" />
                Novo Contrato
              </Button>
            </div>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <div className="flex flex-wrap items-end gap-2 p-3 rounded-lg bg-muted/50">
            <Search className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label className="text-xs">Contratante</Label>
                <Input
                  placeholder="Nome"
                  className="h-8 w-40"
                  value={filterCliente}
                  onChange={(e) => setFilterCliente(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Data início</Label>
                <Input
                  type="date"
                  className="h-8 w-36"
                  value={filterDataInicio}
                  onChange={(e) => setFilterDataInicio(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Data fim</Label>
                <Input
                  type="date"
                  className="h-8 w-36"
                  value={filterDataFim}
                  onChange={(e) => setFilterDataFim(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Valor mín.</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-8 w-24"
                  value={filterValorMin}
                  onChange={(e) => setFilterValorMin(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Valor máx.</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-8 w-24"
                  value={filterValorMax}
                  onChange={(e) => setFilterValorMax(e.target.value)}
                />
              </div>
            </div>
          </div>
          {canWriteContractsCommercial(user?.role) && (
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Contratos</CardTitle>
                <CardDescription>
                  Crie, edite e gerencie seus contratos de prestação de serviço.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <div className="space-y-4">
                    {isLoadingContracts &&
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-lg" />
                      ))}
                    {!isLoadingContracts &&
                      filteredDraftContracts?.map((item) => (
                        <Card
                          key={item.id}
                          className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4">
                              <div className="min-w-0 space-y-2">
                                <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                  {item.contratante?.nome}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(item.dataContrato)}
                                </p>
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                  {item.objeto.servicos}
                                </p>
                                <Badge variant="outline" className="w-fit">
                                  {item.status || "Rascunho"}
                                </Badge>
                              </div>
                              <Separator className="bg-border/60" />
                              <div className="flex flex-wrap items-center gap-1">
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
                                      onClick={() => handleEdit(item)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Editar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar contrato</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() => handleGeneratePdf(item)}
                                    >
                                      <FileText className="h-4 w-4" />
                                      <span className="sr-only">PDF</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Gerar PDF</p>
                                  </TooltipContent>
                                </Tooltip>
                                {canApproveContracts(user?.role) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        type="button"
                                        onClick={() => handleApprove(item.id)}
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="sr-only">Aprovar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Aprovar contrato</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
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
                                    <p>Deletar contrato</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    {!isLoadingContracts && filteredDraftContracts?.length === 0 && (
                      <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                        {draftContracts?.length === 0
                          ? "Nenhum contrato em gerenciamento."
                          : "Nenhum contrato corresponde aos filtros."}
                      </div>
                    )}
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Contratos Finalizados/Assinados</CardTitle>
              <CardDescription>
                Visualize contratos aprovados e faça upload da versão assinada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoadingContracts &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!isLoadingContracts &&
                    filteredApprovedContracts?.map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {item.contratante?.nome}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(item.dataContrato)}
                              </p>
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {item.objeto.servicos}
                              </p>
                              <Badge variant="outline" className="w-fit">
                                {item.status || "Aprovado"}
                              </Badge>
                            </div>
                            <Separator className="bg-border/60" />
                            <div className="flex flex-wrap items-center gap-1">
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
                                    onClick={() => handleGeneratePdf(item)}
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span className="sr-only">PDF</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Gerar PDF</p>
                                </TooltipContent>
                              </Tooltip>
                              {item.fileUrl ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                      <a
                                        href={item.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <span className="sr-only">Assinado</span>
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver contrato assinado</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : canWriteContractsCommercial(user?.role) ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() => handleOpenUpload(item)}
                                    >
                                      <Upload className="h-4 w-4" />
                                      <span className="sr-only">Upload</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Upload contrato assinado</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                              {isAdminOrFinancialRole(user?.role) && (
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
                                    <p>Deletar contrato</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoadingContracts && filteredApprovedContracts?.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      {approvedContracts?.length === 0
                        ? "Nenhum contrato finalizado."
                        : "Nenhum contrato corresponde aos filtros."}
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl h-full max-h-[90dvh] flex flex-col">
          <ContractForm
            currentItem={editingItem}
            sourceProposal={editingItem ? null : selectedProposal}
            onSuccess={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isFromProposalOpen} onOpenChange={setIsFromProposalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerar contrato por proposta aceita</DialogTitle>
            <DialogDescription>
              Selecione uma proposta aceita para reaproveitar os serviços no
              contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Proposta aceita</Label>
            <select
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={selectedProposalId}
              onChange={(e) => setSelectedProposalId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {availableAcceptedProposals.map((proposal) => (
                <option key={proposal.id} value={proposal.id}>
                  {proposal.proposalNumber} -{" "}
                  {clientsMap.get(proposal.clientId)?.name || "Cliente"} -{" "}
                  {formatCurrency(proposal.amount)}
                </option>
              ))}
            </select>
            {selectedProposal && (
              <div className="rounded-md border p-3 text-sm space-y-1">
                <p>
                  <strong>Cliente:</strong>{" "}
                  {clientsMap.get(selectedProposal.clientId)?.name || "N/A"}
                </p>
                <p>
                  <strong>Proposta:</strong> {selectedProposal.proposalNumber}
                </p>
                <p>
                  <strong>Serviços:</strong>{" "}
                  {selectedProposal.items?.length || 0} item(ns)
                </p>
              </div>
            )}
            {availableAcceptedProposals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma proposta aceita disponível sem contrato vinculado.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFromProposalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateFromProposal}
              disabled={!selectedProposal}
            >
              Usar proposta e continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Contrato Assinado</DialogTitle>
            <DialogDescription>
              Anexe o arquivo PDF do contrato assinado para{" "}
              {uploadingItem?.contratante.nome}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="signed-contract-file">
              Arquivo do Contrato (PDF)
            </Label>
            <Input
              id="signed-contract-file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
              disabled={isUploading}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadOpen(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFileUpload}
              disabled={!fileToUpload || isUploading}
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato</DialogTitle>
            <DialogDescription>
              Visualização do contrato com {viewingItem?.contratante.nome}.
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              <h4 className="font-semibold text-foreground">Contratante</h4>
              <DetailItem label="Nome" value={viewingItem.contratante.nome} />
              <DetailItem
                label="CPF/CNPJ"
                value={viewingItem.contratante.cpfCnpj}
              />
              <DetailItem
                label="Endereço"
                value={`${viewingItem.contratante.endereco || ""}, ${viewingItem.contratante.numero || ""}`}
              />
              <Separator />

              <h4 className="font-semibold text-foreground">Contratado</h4>
              <DetailItem label="Nome" value={viewingItem.contratado.name} />
              <DetailItem label="CNPJ" value={viewingItem.contratado.cnpj} />
              <Separator />

              <h4 className="font-semibold text-foreground">
                Responsável Técnico
              </h4>
              <DetailItem
                label="Nome"
                value={viewingItem.responsavelTecnico.name}
              />
              <DetailItem
                label="Profissão"
                value={viewingItem.responsavelTecnico.profession}
              />
              <Separator />

              <h4 className="font-semibold text-foreground">Objeto</h4>
              <DetailItem
                label="Empreendimento"
                value={viewingItem.objeto.empreendimento}
              />
              <p className="text-sm font-medium">Serviços</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {viewingItem.objeto.servicos}
              </p>
              {viewingItem.objeto.itens &&
                viewingItem.objeto.itens.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Itens de Serviço:
                    </p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {viewingItem.objeto.itens.map((item, index) => (
                        <li key={index}>
                          {item.descricao} -{" "}
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.valor)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              <Separator />

              <h4 className="font-semibold text-foreground">Pagamento</h4>
              <DetailItem
                label="Valor Total"
                value={new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(viewingItem.pagamento.valorTotal)}
              />
              <DetailItem
                label="Valor por Extenso"
                value={viewingItem.pagamento.valorExtenso}
              />
              <DetailItem
                label="Forma de Pagamento"
                value={viewingItem.pagamento.forma}
              />
              <AttachmentPreviewSection
                fileUrl={viewingItem.fileUrl}
                sectionLabel="Contrato assinado (PDF)"
                emptyLabel="Nenhum arquivo anexado."
                zoomTitle="Anexo do contrato"
                zoomDescription="Visualização ampliada do PDF."
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

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente
              o contrato.
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
