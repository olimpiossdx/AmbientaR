"use client";
import { useCallback, useMemo, useState } from "react";
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
  canManageProposalsAndCommercialQuotes,
  isAdminOrSupervisorRole,
  isClientePortalRole,
} from "@/lib/role-guards";
import {
  fetchClientIdsForTitularPortalUser,
  titularClientDocumentVariants,
  fetchClientIdsForRepresentativeUser,
} from "@/lib/portal-titular-client-ids";
import type { AppUser } from "@/lib/types";
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
  getDoc,
  getDocs,
} from "firebase/firestore";
import * as React from "react";
import {
  fetchBrandingImageAsBase64,
  getImageDimensions,
  calcPdfImageSize,
  applyImageOpacity,
} from "@/lib/branding-pdf";
import type {
  CommercialProposal,
  Client,
  CompanySettings,
  Contract,
  EnvironmentalCompany,
} from "@/lib/types";
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
import "jspdf-autotable";
import { logUserAction } from "@/lib/audit-log";
import { ProposalForm } from "./proposal-form";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  ChevronDown,
  ChevronUp,
  FileText as FileTextIcon,
  CheckCircle2,
  XCircle as XCircleIcon,
  Link2,
} from "lucide-react";

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

export default function CommercialProposalsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<CommercialProposal | null>(
    null,
  );
  const [viewingItem, setViewingItem] = useState<CommercialProposal | null>(
    null,
  );
  const [filterCliente, setFilterCliente] = useState("");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterValorMin, setFilterValorMin] = useState("");
  const [filterValorMax, setFilterValorMax] = useState("");
  const [filterNumero, setFilterNumero] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const router = useRouter();

  const { firestore, auth, user } = useFirebase();
  const { toast } = useToast();

  const [clientIdsForUser, setClientIdsForUser] = useState<string[] | null>(
    null,
  );

  // Resolve os clientIds que o titular (Cliente Gestão / Autônomo) ou representante pode ver.
  React.useEffect(() => {
    if (!firestore || !user) return;

    if (user.role === "client" || user.role === "cliente_autonomo") {
      fetchClientIdsForTitularPortalUser(firestore, user as AppUser)
        .then(setClientIdsForUser)
        .catch(() => setClientIdsForUser([]));
      return;
    }

    // Representante: clientes que o titular aprovou para ele.
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

    // Titular (gestão ou autônomo) ou representante: apenas propostas dos seus clientes.
    if (
      user.role === "client" ||
      user.role === "cliente_autonomo" ||
      user.role === "representative"
    ) {
      if (!clientIdsForUser || clientIdsForUser.length === 0) return null;
      return query(
        collection(firestore, "commercialProposals"),
        where("clientId", "in", clientIdsForUser),
      );
    }

    // Perfis internos: todas.
    return collection(firestore, "commercialProposals");
  }, [firestore, user, clientIdsForUser]);

  const { data: proposals, isLoading: isLoadingProposals } =
    useCollection<CommercialProposal>(proposalsQuery);

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

  const userClients = useMemo(() => {
    if (!user || !clients) return [];
    if (!isClientePortalRole(user.role)) return [];
    const userCpf = user.cpf || user.userCpf;
    const userDocuments = titularClientDocumentVariants(userCpf, user.cnpjs);
    return clients
      .filter((c) => userDocuments.includes(c.cpfCnpj))
      .map((c) => c.id);
  }, [user, clients]);

  const filteredProposals = useMemo(() => {
    if (!proposals) return [];

    // Titular (gestão ou autônomo): apenas propostas dos próprios clientIds.
    if (isClientePortalRole(user?.role)) {
      return proposals.filter((p) => userClients.includes(p.clientId));
    }

    // Representante: já filtrado em proposalsQuery via clientIdsForUser.
    if (user?.role === "representative") {
      if (!clientIdsForUser || clientIdsForUser.length === 0) return [];
      return proposals.filter((p) => clientIdsForUser.includes(p.clientId));
    }

    return proposals;
  }, [proposals, user, userClients, clientIdsForUser]);

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

  const isLoading =
    isLoadingProposals || isLoadingClients || isLoadingContracts;

  const { activeProposals, finalizedProposals } = useMemo(() => {
    if (!filteredProposals)
      return { activeProposals: [], finalizedProposals: [] };

    let proposalsToShow = filteredProposals;

    // Titular (gestão ou autônomo) e representante veem apenas propostas aprovadas (consulta/download).
    if (isClientePortalRole(user?.role) || user?.role === "representative") {
      proposalsToShow = proposalsToShow.filter((p) => p.status === "Accepted");
    }

    const active = proposalsToShow
      .filter((p) => p.status === "Draft" || p.status === "Sent")
      .sort((a, b) =>
        b.proposalNumber.localeCompare(a.proposalNumber, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

    const finalized = proposalsToShow
      .filter((p) => p.status === "Accepted" || p.status === "Rejected")
      .sort((a, b) =>
        b.proposalNumber.localeCompare(a.proposalNumber, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

    return { activeProposals: active, finalizedProposals: finalized };
  }, [filteredProposals, user]);

  const applyProposalFilters = useCallback(
    (list: CommercialProposal[]) => {
      return list.filter((p) => {
        const clientName = clientsMap.get(p.clientId)?.name ?? "";
        if (
          filterCliente.trim() &&
          !clientName.toLowerCase().includes(filterCliente.trim().toLowerCase())
        )
          return false;
        if (
          filterNumero.trim() &&
          !(p.proposalNumber || "")
            .toLowerCase()
            .includes(filterNumero.trim().toLowerCase())
        )
          return false;
        const dataStr = p.proposalDate?.slice(0, 10) ?? "";
        if (filterDataInicio && dataStr < filterDataInicio) return false;
        if (filterDataFim && dataStr > filterDataFim) return false;
        const vMin = filterValorMin !== "" ? parseFloat(filterValorMin) : null;
        const vMax = filterValorMax !== "" ? parseFloat(filterValorMax) : null;
        if (vMin != null && !Number.isNaN(vMin) && p.amount < vMin)
          return false;
        if (vMax != null && !Number.isNaN(vMax) && p.amount > vMax)
          return false;
        return true;
      });
    },
    [
      clientsMap,
      filterCliente,
      filterNumero,
      filterDataInicio,
      filterDataFim,
      filterValorMin,
      filterValorMax,
    ],
  );
  const filteredActiveProposals = useMemo(
    () =>
      [...applyProposalFilters(activeProposals)].sort((a, b) =>
        (clientsMap.get(a.clientId)?.name || '').localeCompare(
          clientsMap.get(b.clientId)?.name || '',
          'pt-BR',
          { sensitivity: 'base' },
        ),
      ),
    [activeProposals, applyProposalFilters, clientsMap],
  );
  const filteredFinalizedProposals = useMemo(
    () =>
      [...applyProposalFilters(finalizedProposals)].sort((a, b) =>
        (clientsMap.get(a.clientId)?.name || '').localeCompare(
          clientsMap.get(b.clientId)?.name || '',
          'pt-BR',
          { sensitivity: 'base' },
        ),
      ),
    [finalizedProposals, applyProposalFilters, clientsMap],
  );

  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: CommercialProposal) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleView = (item: CommercialProposal) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const handleOpenLinkedContract = (contractId: string) => {
    router.push(`/contracts/${contractId}/edit`);
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
    const docRef = doc(firestore, "commercialProposals", proposalId);
    try {
      await updateDoc(docRef, { status });
      toast({
        title: `Proposta ${status === "Accepted" ? "Aceita" : "Rejeitada"}`,
        description: "O status da proposta foi atualizado.",
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

    const docRef = doc(firestore, "commercialProposals", itemToDelete);
    const deletedItem = proposals?.find((p) => p.id === itemToDelete);

    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Proposta deletada",
          description: "A proposta foi removida com sucesso.",
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

  const handleExportPdf = async (proposal: CommercialProposal) => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Serviço de banco de dados indisponível.",
      });
      return;
    }

    const client = clientsMap.get(proposal.clientId);
    const pdfDoc = new jsPDF({ unit: "mm", format: "a4" });

    const companyProfileDocRef = doc(
      firestore,
      "companySettings",
      "companyProfile",
    );
    let companyProfile: Omit<EnvironmentalCompany, "id"> | null = null;
    let brandingData: {
      headerImageUrl?: string | null;
      footerImageUrl?: string | null;
      watermarkImageUrl?: string | null;
    } | null = null;

    const brandingDocRef = doc(firestore, "companySettings", "branding");
    try {
      const [brandingSnap, companySnap] = await Promise.all([
        getDoc(brandingDocRef),
        getDoc(companyProfileDocRef),
      ]);
      if (brandingSnap.exists()) {
        brandingData = brandingSnap.data() as {
          headerImageUrl?: string | null;
          footerImageUrl?: string | null;
          watermarkImageUrl?: string | null;
        };
      }
      companyProfile = companySnap.exists()
        ? (companySnap.data() as Omit<EnvironmentalCompany, "id">)
        : null;
    } catch (error) {
      console.error("Error fetching settings for PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar dados",
        description: "Não foi possível carregar as configurações da empresa.",
      });
    }

    const headerBase64 = await fetchBrandingImageAsBase64(
      brandingData?.headerImageUrl ?? undefined,
    );
    const footerBase64 = await fetchBrandingImageAsBase64(
      brandingData?.footerImageUrl ?? undefined,
    );
    const watermarkBase64Raw = await fetchBrandingImageAsBase64(
      brandingData?.watermarkImageUrl ?? undefined,
    );
    const watermarkBase64 = watermarkBase64Raw
      ? await applyImageOpacity(watermarkBase64Raw, 0.15)
      : null;

    const pageHeight = pdfDoc.internal.pageSize.getHeight();
    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const margins = { top: 15, bottom: 25, left: 15, right: 15 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let yPos = margins.top;

    const hDims = headerBase64 ? await getImageDimensions(headerBase64) : null;
    const hSize = hDims ? calcPdfImageSize(hDims, contentWidth, 30) : null;
    const fDims = footerBase64 ? await getImageDimensions(footerBase64) : null;
    const fSize = fDims ? calcPdfImageSize(fDims, contentWidth, 20) : null;

    const addHeaderFooter = (docInstance: jsPDF) => {
      const pageCount = docInstance.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        docInstance.setPage(i);
        if (headerBase64 && hSize) {
          try {
            docInstance.addImage(
              headerBase64,
              "PNG",
              margins.left,
              10,
              hSize.w,
              hSize.h,
            );
          } catch (e) {
            console.error("Error adding header image to PDF", e);
          }
        }
        if (watermarkBase64) {
          try {
            const imgProps = docInstance.getImageProperties(watermarkBase64);
            const aspectRatio = imgProps.width / imgProps.height;
            const w = 100;
            const h = w / aspectRatio;
            docInstance.addImage(
              watermarkBase64,
              "PNG",
              (pageWidth - w) / 2,
              (pageHeight - h) / 2,
              w,
              h,
              undefined,
              "FAST",
            );
          } catch (e) {
            console.error("Error adding watermark to PDF", e);
          }
        }
        if (footerBase64 && fSize) {
          try {
            docInstance.addImage(
              footerBase64,
              "PNG",
              margins.left,
              pageHeight - fSize.h - 5,
              fSize.w,
              fSize.h,
            );
          } catch (e) {
            console.error("Error adding footer image to PDF", e);
          }
        }
      }
      // Numeração de páginas alinhada à direita no rodapé.
      addPageNumbers(docInstance, 10);
    };

    yPos = headerBase64 && hSize ? 10 + hSize.h + 5 : 20;

    pdfDoc.setFontSize(18);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("PROPOSTA COMERCIAL", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text(
      `Data: ${new Date(proposal.proposalDate).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}`,
      margins.left,
      yPos,
    );
    yPos += 10;

    if (client) {
      const introText = `A presente proposta foi elaborada no sentido de atender a demanda solicitada para o Sr(a). ${client.name} para o empreendimento ${proposal.empreendimento || "não especificado"} no município de ${client.municipio || "não especificado"} no estado de ${client.uf || "não especificado"}.`;
      const introLines = pdfDoc.splitTextToSize(introText, contentWidth);
      pdfDoc.text(introLines, margins.left, yPos);
      yPos += introLines.length * 5 + 10;
    }

    pdfDoc.setFontSize(12);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Descrição dos Serviços:", margins.left, yPos);
    yPos += 7;

    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");
    (proposal.items || []).forEach((item) => {
      const itemText = `• ${item.description}: ${formatCurrency(item.value)}`;
      const itemLines = pdfDoc.splitTextToSize(itemText, contentWidth);
      if (yPos + itemLines.length * 5 > pageHeight - margins.bottom) {
        pdfDoc.addPage();
        yPos = margins.top + 20;
      }
      pdfDoc.text(itemLines, margins.left + 5, yPos);
      yPos += itemLines.length * 5 + 2;
    });
    yPos += 5;

    pdfDoc.setFontSize(12);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Forma de Pagamento:", margins.left, yPos);
    yPos += 7;
    pdfDoc.setFontSize(10);
    pdfDoc.setFont("helvetica", "normal");
    const paymentTerms = proposal.paymentTerms || "A ser combinado.";
    const paymentLines = pdfDoc.splitTextToSize(paymentTerms, contentWidth);
    pdfDoc.text(paymentLines, margins.left, yPos);
    yPos += paymentLines.length * 5 + 10;

    pdfDoc.setFontSize(12);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Observações:", margins.left, yPos);
    yPos += 5;

    const responsabilidadesContratada = [
      "Os custos de taxas e emolumentos referentes ao órgão licenciador NÃO estão inclusos.",
      "Juntar, avaliar e definir estratégias para a condução dos processos de licenciamento visando o menor custo e tempo.",
      "Mensurar e avaliar estudos prévios para evitar retrabalhos.",
      "Reunir com ex-contratados para definir continuidade de trabalhos iniciados.",
      "Repassar ao contratante, de forma didática e simplificada, o andamento de cada etapa.",
      "Conduzir os trabalhos conforme normas técnicas e legislação vigente.",
      "Cumprir todas as obrigações sociais, trabalhistas, fiscais e de seguros contra acidentes de trabalho.",
      "Disponibilizar meios necessários para auditorias, controles e consultorias.",
      "Prestar informações e relatórios sempre que solicitado.",
    ];

    const responsabilidadesContratante = [
      "Credenciar o pessoal da contratada para obtenção de informações e dados necessários.",
      "Fornecer alojamento e alimentação ao corpo técnico durante os estudos no imóvel.",
      "Providenciar acesso às propriedades públicas ou privadas necessárias aos trabalhos.",
      "Fornecer informações e dados em tempo hábil quando solicitado.",
    ];

    pdfDoc.setFontSize(11);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Responsabilidades da Contratada", margins.left, yPos);
    yPos += 7;
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("helvetica", "normal");
    responsabilidadesContratada.forEach((item) => {
      const lines = pdfDoc.splitTextToSize(`• ${item}`, contentWidth - 5);
      if (yPos + lines.length * 4 > pageHeight - margins.bottom) {
        pdfDoc.addPage();
        yPos = margins.top + 20;
      }
      pdfDoc.text(lines, margins.left + 5, yPos);
      yPos += lines.length * 4 + 2;
    });
    yPos += 5;

    pdfDoc.setFontSize(11);
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text("Responsabilidades da Contratante", margins.left, yPos);
    yPos += 7;
    pdfDoc.setFontSize(9);
    pdfDoc.setFont("helvetica", "normal");
    responsabilidadesContratante.forEach((item) => {
      const lines = pdfDoc.splitTextToSize(`• ${item}`, contentWidth - 5);
      if (yPos + lines.length * 4 > pageHeight - margins.bottom) {
        pdfDoc.addPage();
        yPos = margins.top + 20;
      }
      pdfDoc.text(lines, margins.left + 5, yPos);
      yPos += lines.length * 4 + 2;
    });

    yPos += 15;

    if (yPos > pageHeight - 60) {
      // Check space for signature
      pdfDoc.addPage();
      yPos = margins.top + 20;
    }

    pdfDoc.setFontSize(10);
    pdfDoc.text("Atenciosamente,", pageWidth / 2, yPos, { align: "center" });
    yPos += 20; // Space for signature

    pdfDoc.text(
      "_________________________________________",
      pageWidth / 2,
      yPos,
      { align: "center" },
    );
    yPos += 5;
    pdfDoc.setFont("helvetica", "bold");
    pdfDoc.text(
      companyProfile?.name || "Pimenta Consultoria Ambiental",
      pageWidth / 2,
      yPos,
      { align: "center" },
    );
    yPos += 5;
    pdfDoc.setFont("helvetica", "normal");
    pdfDoc.text(
      companyProfile?.cnpj || "21.367.930/0001-58",
      pageWidth / 2,
      yPos,
      { align: "center" },
    );

    addHeaderFooter(pdfDoc);
    pdfDoc.save(`proposta_${proposal.proposalNumber}.pdf`);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const getStatusVariant = (status: CommercialProposal["status"]) => {
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

  const getStatusLabel = (status: CommercialProposal["status"]) => {
    switch (status) {
      case "Draft":
        return "Rascunho";
      case "Sent":
        return "Enviada";
      case "Accepted":
        return "Aceita";
      case "Rejected":
        return "Rejeitada";
      default:
        return status;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Propostas Comerciais">
          {canManageProposalsAndCommercialQuotes(user?.role) && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Criar Proposta
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <Collapsible
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            className="rounded-lg border bg-muted/30"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left font-medium hover:bg-muted/50 rounded-lg transition-colors">
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                Buscar e filtrar propostas
              </span>
              {filtersOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-wrap items-end gap-3 p-3 pt-0 border-t">
                <div>
                  <Label className="text-xs">Cliente</Label>
                  <Input
                    placeholder="Nome"
                    className="h-8 w-36"
                    value={filterCliente}
                    onChange={(e) => setFilterCliente(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Nº Proposta</Label>
                  <Input
                    placeholder="Número"
                    className="h-8 w-28"
                    value={filterNumero}
                    onChange={(e) => setFilterNumero(e.target.value)}
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
            </CollapsibleContent>
          </Collapsible>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="bg-muted/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <FileTextIcon className="h-4 w-4" />
                  Em andamento
                </div>
                <p className="text-2xl font-semibold mt-1">
                  {isLoading ? "—" : filteredActiveProposals.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rascunho e enviadas
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <XCircleIcon className="h-4 w-4 text-red-600" />
                  Finalizadas
                </div>
                <p className="text-2xl font-semibold mt-1">
                  {isLoading ? "—" : filteredFinalizedProposals.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Aceitas e rejeitadas
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Propostas Comerciais</CardTitle>
              <CardDescription>
                Crie, edite e gerencie propostas. Use as abas para alternar
                entre em andamento e finalizadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full max-w-[280px] rounded-md" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <Tabs
                  defaultValue={
                    isClientePortalRole(user?.role) ||
                    user?.role === "representative"
                      ? "finalized"
                      : "active"
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full max-w-[320px] grid-cols-2">
                    <TabsTrigger value="active">Em andamento</TabsTrigger>
                    <TabsTrigger value="finalized">Finalizadas</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active" className="mt-4">
                    <TooltipProvider>
                      <div className="space-y-4">
                        {filteredActiveProposals?.map((proposal) => (
                          <Card
                            key={proposal.id}
                            className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex flex-col gap-4">
                                <div className="min-w-0 space-y-2">
                                  <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                    {proposal.proposalNumber}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {clientsMap.get(proposal.clientId)?.name ||
                                      "Cliente não encontrado"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={cn(getStatusVariant(proposal.status))}
                                    >
                                      {getStatusLabel(proposal.status)}
                                    </Badge>
                                    {proposal.contractId ? (
                                      <Badge variant="secondary">Convertida em contrato</Badge>
                                    ) : null}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Data:{" "}
                                    {new Date(proposal.proposalDate).toLocaleDateString("pt-BR")} ·
                                    Valor: {formatCurrency(proposal.amount)}
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
                                        <span className="sr-only">Visualizar</span>
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
                                              className="h-9 w-9 shrink-0"
                                              type="button"
                                              onClick={() => handleExportPdf(proposal)}
                                            >
                                              <FileText className="h-4 w-4" />
                                              <span className="sr-only">PDF</span>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Exportar PDF</p>
                                          </TooltipContent>
                                        </Tooltip>
                                        {proposal.contractId && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 shrink-0"
                                                type="button"
                                                onClick={() =>
                                                  handleOpenLinkedContract(proposal.contractId!)
                                                }
                                              >
                                                <Link2 className="h-4 w-4" />
                                                <span className="sr-only">Contrato</span>
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Abrir contrato vinculado</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        )}
                                        {isAdminOrSupervisorRole(user?.role) && (
                                          <>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-9 w-9 shrink-0"
                                                  type="button"
                                                  onClick={() =>
                                                    handleUpdateStatus(proposal.id, "Accepted")
                                                  }
                                                >
                                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                                  <span className="sr-only">Aceitar</span>
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Marcar como aceita</p>
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
                                                    handleUpdateStatus(proposal.id, "Rejected")
                                                  }
                                                >
                                                  <XCircle className="h-4 w-4 text-red-500" />
                                                  <span className="sr-only">Rejeitar</span>
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Marcar como rejeitada</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </>
                                        )}
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                              type="button"
                                              onClick={() => openDeleteConfirm(proposal.id)}
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
                        {filteredActiveProposals?.length === 0 && (
                          <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                            {activeProposals?.length === 0
                              ? "Nenhuma proposta em andamento."
                              : "Nenhuma proposta corresponde aos filtros."}
                          </div>
                        )}
                      </div>
                    </TooltipProvider>
                  </TabsContent>
                  <TabsContent value="finalized" className="mt-4">
                    <TooltipProvider>
                      <div className="space-y-4">
                        {filteredFinalizedProposals?.map((proposal) => (
                          <Card
                            key={proposal.id}
                            className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex flex-col gap-4">
                                <div className="min-w-0 space-y-2">
                                  <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                    {proposal.proposalNumber}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {clientsMap.get(proposal.clientId)?.name ||
                                      "Cliente não encontrado"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={cn(getStatusVariant(proposal.status))}
                                    >
                                      {getStatusLabel(proposal.status)}
                                    </Badge>
                                    {proposal.contractId ? (
                                      <Badge variant="secondary">Convertida em contrato</Badge>
                                    ) : null}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Data:{" "}
                                    {new Date(proposal.proposalDate).toLocaleDateString("pt-BR")} ·
                                    Valor: {formatCurrency(proposal.amount)}
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
                                        <span className="sr-only">Visualizar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Visualizar</p>
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
                                        <span className="sr-only">PDF</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Exportar PDF</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  {proposal.contractId && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 shrink-0"
                                          type="button"
                                          onClick={() =>
                                            handleOpenLinkedContract(proposal.contractId!)
                                          }
                                        >
                                          <Link2 className="h-4 w-4" />
                                          <span className="sr-only">Contrato</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Abrir contrato vinculado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {isAdminOrSupervisorRole(user?.role) && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                          type="button"
                                          onClick={() => openDeleteConfirm(proposal.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Deletar</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Deletar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {filteredFinalizedProposals?.length === 0 && (
                          <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                            {finalizedProposals?.length === 0
                              ? "Nenhuma proposta finalizada."
                              : "Nenhuma proposta corresponde aos filtros."}
                          </div>
                        )}
                      </div>
                    </TooltipProvider>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="flex max-h-[90dvh] min-h-0 w-[calc(100%-2rem)] flex-col overflow-hidden p-4 sm:max-w-3xl sm:p-6">
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
              Detalhes da Proposta #{viewingItem?.proposalNumber}
            </DialogTitle>
            <DialogDescription>
              Visualização dos dados cadastrados para a proposta.
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
                sectionLabel="PDF / anexo da proposta"
                emptyLabel="Nenhum PDF ou anexo cadastrado."
                zoomTitle="Anexo da proposta"
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
              a proposta.
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
