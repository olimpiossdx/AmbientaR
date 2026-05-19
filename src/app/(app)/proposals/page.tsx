"use client";
import { useMemo, useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isAdminOrSupervisorRole,
  isClientePortalRole,
  canManageProposalsAndCommercialQuotes,
} from "@/lib/role-guards";
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
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import {
  fetchBrandingImageAsBase64,
  getImageDimensions,
  calcPdfImageSize,
  applyImageOpacity,
  downloadJsPdf,
} from "@/lib/branding-pdf";
import { useLocalBranding } from "@/hooks/use-local-branding";
import type { Proposal, Client, CompanySettings, Contract, AppUser } from "@/lib/types";
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
import { FirestorePermissionError } from "@/firebase/errors";
import jsPDF from "jspdf";
import { logUserAction } from "@/lib/audit-log";
import { ProposalForm } from "./proposal-form";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import {
  fetchClientIdsForTitularPortalUser,
  fetchClientIdsForRepresentativeUser,
} from "@/lib/portal-titular-client-ids";

/** Adiciona numeração de páginas no rodapé no formato página/total. */
function addPageNumbers(doc: jsPDF, bottomMarginMm: number = 10) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${i}/${pageCount}`,
      pageWidth - bottomMarginMm,
      pageHeight - bottomMarginMm,
      { align: "right" },
    );
  }
}

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

export default function ProposalsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Proposal | null>(null);
  const [viewingItem, setViewingItem] = useState<Proposal | null>(null);
  const router = useRouter();

  const { firestore, auth, user } = useFirebase();
  const { toast } = useToast();

  const [clientIdsForUser, setClientIdsForUser] = useState<string[] | null>(
    null,
  );

  useEffect(() => {
    if (!firestore || !user) return;
    if (user.role === "client" || user.role === "cliente_autonomo") {
      fetchClientIdsForTitularPortalUser(firestore, user as AppUser)
        .then(setClientIdsForUser)
        .catch(() => setClientIdsForUser([]));
      return;
    }
    if (user.role === "representative") {
      const repUid = user.id || (user as { uid?: string }).uid;
      if (!repUid) {
        setClientIdsForUser([]);
        return;
      }
      fetchClientIdsForRepresentativeUser(firestore, repUid)
        .then(setClientIdsForUser)
        .catch(() => setClientIdsForUser([]));
      return;
    }
    setClientIdsForUser(null);
  }, [firestore, user]);

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (
      user.role === "client" ||
      user.role === "cliente_autonomo" ||
      user.role === "representative"
    ) {
      if (!clientIdsForUser || clientIdsForUser.length === 0) return null;
      return query(
        collection(firestore, "proposals"),
        where("clientId", "in", clientIdsForUser),
      );
    }
    return collection(firestore, "proposals");
  }, [firestore, user, clientIdsForUser]);

  const { data: proposals, isLoading: isLoadingProposals } =
    useCollection<Proposal>(proposalsQuery);

  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "clients") : null),
    [firestore],
  );
  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Client>(clientsQuery);
  const clientsMap = useMemo(
    () => new Map(clients?.map((c) => [c.id, c])),
    [clients],
  );

  const contractsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "contracts") : null),
    [firestore],
  );
  const { data: contracts, isLoading: isLoadingContracts } =
    useCollection<Contract>(contractsQuery);
  const contractsMap = useMemo(
    () => new Map(contracts?.map((c) => [c.id, c])),
    [contracts],
  );

  const { data: brandingData, isLoading: isLoadingBranding } =
    useLocalBranding();

  const isLoading =
    isLoadingProposals ||
    isLoadingClients ||
    isLoadingBranding ||
    isLoadingContracts;

  const { activeProposals, finalizedProposals } = useMemo(() => {
    if (!proposals) return { activeProposals: [], finalizedProposals: [] };

    const active = proposals
      .filter((p) => p.status === "Draft" || p.status === "Sent")
      .sort((a, b) =>
        b.proposalNumber.localeCompare(a.proposalNumber, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

    const finalized = proposals
      .filter((p) => p.status === "Accepted" || p.status === "Rejected")
      .sort((a, b) =>
        b.proposalNumber.localeCompare(a.proposalNumber, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

    return { activeProposals: active, finalizedProposals: finalized };
  }, [proposals]);

  // Para `client` e `representative`, a regra é exibir/baixar apenas itens "aprovados".
  // No fluxo de Orçamentos, "aprovado" corresponde ao status `Accepted`.
  const isClientOrRep =
    isClientePortalRole(user?.role) || user?.role === "representative";
  const displayActiveProposals = isClientOrRep ? [] : activeProposals;
  const displayFinalizedProposals = isClientOrRep
    ? finalizedProposals.filter((p) => p.status === "Accepted")
    : finalizedProposals;

  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Proposal) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleView = (item: Proposal) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleUpdateStatus = async (
    proposalId: string,
    status: "Accepted" | "Rejected",
  ) => {
    if (!firestore) return;
    const docRef = doc(firestore, "proposals", proposalId);
    try {
      await updateDoc(docRef, { status });
      toast({
        title: `Orçamento ${status === "Accepted" ? "Aceito" : "Rejeitado"}`,
        description: "O status do orçamento foi atualizado.",
      });
    } catch (error) {
      console.error(`Error updating proposal status:`, error);
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: "update",
        requestResourceData: { status },
      });
      errorEmitter.emit("permission-error", permissionError);
    }
  };

  const handleDelete = () => {
    if (!firestore || !auth || !itemToDelete) return;

    const docRef = doc(firestore, "proposals", itemToDelete);
    const deletedItem = proposals?.find((p) => p.id === itemToDelete);

    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Orçamento deletado",
          description: "O orçamento foi removido com sucesso.",
        });
        if (deletedItem) {
          logUserAction(firestore, auth, "delete_proposal", {
            proposalId: itemToDelete,
            proposalNumber: deletedItem.proposalNumber,
          });
        }
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

  const handleExportPdf = async (proposal: Proposal) => {
    const client = clientsMap.get(proposal.clientId);
    const contract = proposal.contractId
      ? contractsMap.get(proposal.contractId)
      : null;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const headerBase64 = await fetchBrandingImageAsBase64(
      brandingData?.headerImageUrl,
    );
    const footerBase64 = await fetchBrandingImageAsBase64(
      brandingData?.footerImageUrl,
    );
    const watermarkBase64Raw = await fetchBrandingImageAsBase64(
      brandingData?.watermarkImageUrl,
    );
    const watermarkBase64 = watermarkBase64Raw
      ? await applyImageOpacity(watermarkBase64Raw, 0.15)
      : null;

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margins = { top: 15, bottom: 25, left: 15, right: 15 };
    const contentWidth = pageWidth - margins.left - margins.right;

    // Header: alinhado à esquerda, tamanho original preservado
    let headerRenderedH = 0;
    if (headerBase64) {
      const dims = await getImageDimensions(headerBase64);
      const { w, h } = calcPdfImageSize(dims, contentWidth, 30);
      doc.addImage(
        headerBase64,
        "PNG",
        margins.left,
        10,
        w,
        h,
        undefined,
        "FAST",
      );
      headerRenderedH = h;
    }

    let yPos = headerBase64 ? 10 + headerRenderedH + 5 : 22;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Orçamento #${proposal.proposalNumber}`, 105, yPos, {
      align: "center",
    });
    yPos += 10;

    doc.setFontSize(10);
    doc.text(
      `Data: ${new Date(proposal.proposalDate).toLocaleDateString("pt-BR")}`,
      14,
      yPos,
    );
    yPos += 6;
    doc.text(
      `Válido até: ${new Date(proposal.validUntilDate).toLocaleDateString("pt-BR")}`,
      14,
      yPos,
    );
    yPos += 12;

    if (client) {
      doc.setFontSize(12);
      doc.setFont("Helvetica", "bold");
      doc.text("Cliente:", 14, yPos, { align: "justify" });
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      yPos += 6;
      doc.text(client.name, 14, yPos, { align: "justify" });
      yPos += 6;
      doc.text(client.cpfCnpj || "", 14, yPos, { align: "justify" });
      yPos += 6;
      doc.text(client.email || "", 14, yPos, { align: "justify" });
      yPos += 10;
    }

    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("Serviços Propostos:", 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");

    (proposal.items || []).forEach((item) => {
      const splitDescription = doc.splitTextToSize(item.description, 130);
      doc.text(splitDescription, 14, yPos, { align: "justify" });
      doc.text(formatCurrency(item.value), 196, yPos, { align: "right" });
      yPos += splitDescription.length * 5 + 4;
    });

    yPos += 6;
    doc.setLineWidth(0.5);
    doc.line(14, yPos - 4, 196, yPos - 4);

    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("Valor Total:", 150, yPos, { align: "right" });
    doc.text(formatCurrency(proposal.amount), 196, yPos, { align: "right" });

    yPos += 15;

    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    doc.text("Status:", 14, yPos);
    doc.setFont("Helvetica", "normal");
    doc.text(proposal.status, 30, yPos);

    if (proposal.fileUrl) {
      yPos += 10;
      doc.textWithLink("Ver Anexo", 14, yPos, { url: proposal.fileUrl });
    }

    // Marca d'água e rodapé em todas as páginas
    const totalPages = doc.getNumberOfPages();
    if (watermarkBase64) {
      const imgProps = doc.getImageProperties(watermarkBase64);
      const aspectRatio = imgProps.width / imgProps.height;
      const watermarkWidth = 100;
      const watermarkHeight = watermarkWidth / aspectRatio;
      const wX = (pageWidth - watermarkWidth) / 2;
      const wY = (pageHeight - watermarkHeight) / 2;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.addImage(
          watermarkBase64,
          "PNG",
          wX,
          wY,
          watermarkWidth,
          watermarkHeight,
          undefined,
          "FAST",
        );
      }
    }
    if (footerBase64) {
      const fDims = await getImageDimensions(footerBase64);
      const { w: fw, h: fh } = calcPdfImageSize(fDims, pageWidth - 20, 20);
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.addImage(footerBase64, "PNG", 10, pageHeight - fh - 5, fw, fh);
      }
    }

    // Numeração de páginas alinhada à direita no rodapé.
    addPageNumbers(doc, 10);
    downloadJsPdf(doc, `orcamento_${proposal.proposalNumber}.pdf`);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const getStatusVariant = (status: Proposal["status"]) => {
    switch (status) {
      case "Accepted":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
      case "Sent":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "Rejected":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      default: // Draft
        return "bg-slate-500/20 text-slate-700 border-slate-500/30";
    }
  };

  const getStatusLabel = (status: Proposal["status"]) => {
    switch (status) {
      case "Draft":
        return "Rascunho";
      case "Sent":
        return "Enviado";
      case "Accepted":
        return "Aceito";
      case "Rejected":
        return "Rejeitado";
      default:
        return status;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Orçamentos">
          {canManageProposalsAndCommercialQuotes(user?.role) && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Criar Orçamento
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Orçamentos</CardTitle>
              <CardDescription>
                Crie, edite e gerencie seus orçamentos. Ações para Aceitar ou
                Rejeitar movem o orçamento para a lista de finalizados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-28 w-full rounded-lg"
                      />
                    ))}
                  {!isLoading &&
                    displayActiveProposals?.map((proposal) => (
                      <Card
                        key={proposal.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                Orçamento #{proposal.proposalNumber}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {clientsMap.get(proposal.clientId)?.name ||
                                  "Cliente não encontrado"}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "w-fit",
                                    getStatusVariant(proposal.status),
                                  )}
                                >
                                  {getStatusLabel(proposal.status)}
                                </Badge>
                                {proposal.contractId ? (
                                  <Badge variant="secondary">
                                    Vinculado a contrato
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Data:{" "}
                                {new Date(
                                  proposal.proposalDate,
                                ).toLocaleDateString("pt-BR")}{" "}
                                · Valor: {formatCurrency(proposal.amount)}
                              </p>
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
                                    onClick={() => handleView(proposal)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">
                                      Visualizar
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar</p>
                                </TooltipContent>
                              </Tooltip>
                              {user?.role !== "client" &&
                                user?.role !== "cliente_autonomo" && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 shrink-0"
                                          type="button"
                                          onClick={() => handleEdit(proposal)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                          <span className="sr-only">
                                            Editar
                                          </span>
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
                                          className="h-9 w-9 shrink-0"
                                          type="button"
                                          onClick={() =>
                                            handleExportPdf(proposal)
                                          }
                                        >
                                          <FileText className="h-4 w-4" />
                                          <span className="sr-only">
                                            Exportar PDF
                                          </span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Exportar PDF</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 shrink-0"
                                          type="button"
                                          onClick={() =>
                                            handleUpdateStatus(
                                              proposal.id,
                                              "Accepted",
                                            )
                                          }
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                          <span className="sr-only">
                                            Marcar como aceito
                                          </span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como aceito</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 shrink-0"
                                          type="button"
                                          onClick={() =>
                                            handleUpdateStatus(
                                              proposal.id,
                                              "Rejected",
                                            )
                                          }
                                        >
                                          <XCircle className="h-4 w-4 text-red-500" />
                                          <span className="sr-only">
                                            Marcar como rejeitado
                                          </span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como rejeitado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                          type="button"
                                          onClick={() =>
                                            openDeleteConfirm(proposal.id)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">
                                            Deletar
                                          </span>
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
                  {!isLoading && displayActiveProposals?.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhum orçamento em andamento.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orçamentos Finalizados</CardTitle>
              <CardDescription>
                Lista de orçamentos que foram aceitos ou rejeitados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-28 w-full rounded-lg"
                      />
                    ))}
                  {!isLoading &&
                    displayFinalizedProposals?.map((proposal) => (
                      <Card
                        key={proposal.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                Orçamento #{proposal.proposalNumber}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {clientsMap.get(proposal.clientId)?.name ||
                                  "Cliente não encontrado"}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "w-fit",
                                    getStatusVariant(proposal.status),
                                  )}
                                >
                                  {getStatusLabel(proposal.status)}
                                </Badge>
                                {proposal.contractId ? (
                                  <Badge variant="secondary">
                                    Vinculado a contrato
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Data:{" "}
                                {new Date(
                                  proposal.proposalDate,
                                ).toLocaleDateString("pt-BR")}{" "}
                                · Valor: {formatCurrency(proposal.amount)}
                              </p>
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
                                    onClick={() => handleView(proposal)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">
                                      Visualizar
                                    </span>
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
                                    onClick={() => handleExportPdf(proposal)}
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span className="sr-only">
                                      Exportar PDF
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Exportar PDF</p>
                                </TooltipContent>
                              </Tooltip>
                              {isAdminOrSupervisorRole(user?.role) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                      type="button"
                                      onClick={() =>
                                        openDeleteConfirm(proposal.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">
                                        Deletar orçamento
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Deletar orçamento</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && displayFinalizedProposals?.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhum orçamento finalizado.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl h-full max-h-[90dvh] flex flex-col">
          <ProposalForm
            currentItem={editingItem}
            onSuccess={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Orçamento #{viewingItem?.proposalNumber}
            </DialogTitle>
            <DialogDescription>
              Visualização dos dados cadastrados para o orçamento.
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              <DetailItem
                label="Cliente"
                value={clientsMap.get(viewingItem.clientId)?.name}
              />
              <DetailItem
                label="Empreendimento"
                value={viewingItem.empreendimento}
              />
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Data de Emissão"
                  value={new Date(viewingItem.proposalDate).toLocaleDateString(
                    "pt-BR",
                  )}
                />
                <DetailItem
                  label="Válido Até"
                  value={new Date(
                    viewingItem.validUntilDate,
                  ).toLocaleDateString("pt-BR")}
                />
              </div>
              <DetailItem label="Status" value={viewingItem.status} />
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Itens de Serviço</Label>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {viewingItem.items.map((item, index) => (
                    <li key={index}>
                      {item.description} - {formatCurrency(item.value)}
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div className="flex justify-end font-semibold text-lg">
                <DetailItem
                  label="Valor Total"
                  value={formatCurrency(viewingItem.amount)}
                />
              </div>
              <AttachmentPreviewSection
                fileUrl={viewingItem.fileUrl}
                sectionLabel="PDF / anexo"
                emptyLabel="Nenhum documento anexado."
                zoomTitle="Anexo do orçamento"
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
              o orçamento.
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
