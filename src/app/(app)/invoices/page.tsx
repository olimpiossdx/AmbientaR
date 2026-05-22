"use client";
import { useMemo, useState } from "react";
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
  FileDown,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  getDocs,
} from "firebase/firestore";
import * as React from "react";
import { downloadJsPdf } from "@/lib/branding-pdf";
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  guardBrandingPdfExport,
  reportBrandingPdfIssues,
} from "@/lib/pdf-branding-layout";
import { useLocalBranding } from "@/hooks/use-local-branding";
import type { Invoice, Client, CompanySettings, Contract } from "@/lib/types";
import { useSyncOverdueInvoices } from "@/hooks/use-sync-overdue-invoices";
import { isAdminOrFinancialRole } from "@/lib/role-guards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
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
import {
  getAppUserProfileUid,
  isClientePortalRole,
  isSelfRegisteredPortalUser,
} from "@/lib/role-guards";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import { FirestorePermissionError } from "@/firebase/errors";
import { logUserAction } from "@/lib/audit-log";
import { InvoiceForm } from "./invoice-form";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BrDateInput } from "@/components/form/br-date-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";

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

type PeriodType = "day" | "month" | "year";

function isInvoiceInPeriod(
  invoice: Invoice,
  periodType: PeriodType,
  periodValue: string,
): boolean {
  if (!periodValue) return true;
  const d = new Date(invoice.invoiceDate);
  if (periodType === "day") {
    const dayStr = d.toISOString().slice(0, 10);
    return dayStr === periodValue;
  }
  if (periodType === "month") {
    const monthStr = d.toISOString().slice(0, 7);
    return monthStr === periodValue;
  }
  if (periodType === "year") {
    return String(d.getFullYear()) === periodValue;
  }
  return true;
}

export default function InvoicesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Invoice | null>(null);
  const [viewingItem, setViewingItem] = useState<Invoice | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [periodDay, setPeriodDay] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [periodMonth, setPeriodMonth] = useState<string>(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [periodYear, setPeriodYear] = useState<string>(() =>
    String(new Date().getFullYear()),
  );
  const [viewGroup, setViewGroup] = useState<"a_lancar" | "por_periodo">(
    "a_lancar",
  );
  const [periodYearFilter, setPeriodYearFilter] = useState<string>(() =>
    String(new Date().getFullYear()),
  );
  const [periodMonthFilter, setPeriodMonthFilter] = useState<string>("");
  const [filterCliente, setFilterCliente] = useState("");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterValorMin, setFilterValorMin] = useState("");
  const [filterValorMax, setFilterValorMax] = useState("");
  const [filterNumero, setFilterNumero] = useState("");
  const [exportingPdfKey, setExportingPdfKey] = useState<string | null>(null);

  const { firestore, auth, user } = useFirebase();
  const { toast } = useToast();

  // Para `client` e `representative`, mostramos/permitimos download apenas de itens "aprovados".
  // Nas faturas, "aprovado" corresponde a `status === 'Paid'`.
  const isClientOrRep =
    isClientePortalRole(user?.role) || user?.role === "representative";

  // Algumas contas podem ter o CPF em `userCpf` em vez de `cpf`.
  // Usamos o primeiro disponível para resolver `clientIdsForUser`.
  const userCpf = user?.cpf || user?.userCpf;

  const [clientIdsForUser, setClientIdsForUser] = useState<string[] | null>(
    null,
  );

  // Resolve a lista de clientIds que o usuário (cliente ou representante) pode visualizar.
  React.useEffect(() => {
    if (!firestore || !user) return;

    // Cliente titular: seus próprios clientes (userId, approvedUserIds, CPF/CNPJ).
    if (isClientePortalRole(user.role)) {
      const isSelfRegistered = isSelfRegisteredPortalUser(user);
      const clientsRef = collection(firestore, "clients");

      if (isSelfRegistered) {
        const uid = resolvePortalAuthUid(user);
        if (!uid) {
          setClientIdsForUser([]);
          return;
        }
        const qUserId = query(clientsRef, where("userId", "==", uid));
        const qApproved = query(
          clientsRef,
          where("approvedUserIds", "array-contains", uid),
        );

        // Fallback: se o `userId` não estiver correto/inexistente para o cliente,
        // tenta resolver também via CPF/CNPJ.
        const userDocs = documentVariants(userCpf, user.cnpjs);
        const qByDoc =
          userDocs.length > 0
            ? query(clientsRef, where("cpfCnpj", "in", userDocs))
            : null;

        const promises = [getDocs(qUserId), getDocs(qApproved)] as const;
        const extraPromises = qByDoc ? [getDocs(qByDoc)] : [];

        Promise.all([...promises, ...extraPromises])
          .then((snaps) => {
            const ids = new Set<string>();
            snaps.forEach((snap) => {
              snap.docs.forEach((d) => ids.add(d.id));
            });
            setClientIdsForUser(Array.from(ids));
          })
          .catch(() => setClientIdsForUser([]));
      } else {
        const uid = resolvePortalAuthUid(user);
        if (!uid) {
          setClientIdsForUser([]);
          return;
        }
        const byUserId = getDocs(
          query(clientsRef, where("userId", "==", uid)),
        );
        const byApproved = getDocs(
          query(
            clientsRef,
            where("approvedUserIds", "array-contains", uid),
          ),
        );
        const userDocs = documentVariants(userCpf, user.cnpjs);

        if (userDocs.length > 0) {
          const qByDoc = query(clientsRef, where("cpfCnpj", "in", userDocs));
          Promise.all([byUserId, byApproved, getDocs(qByDoc)])
            .then(([snapUserId, snapApproved, snapDoc]) => {
              const ids = new Set<string>();
              snapUserId.docs.forEach((d) => ids.add(d.id));
              snapApproved.docs.forEach((d) => ids.add(d.id));
              snapDoc.docs.forEach((d) => ids.add(d.id));
              setClientIdsForUser(Array.from(ids));
            })
            .catch(() => setClientIdsForUser([]));
        } else {
          Promise.all([byUserId, byApproved])
            .then(([snapU, snapA]) => {
              const ids = new Set<string>([
                ...snapU.docs.map((d) => d.id),
                ...snapA.docs.map((d) => d.id),
              ]);
              setClientIdsForUser(Array.from(ids));
            })
            .catch(() => setClientIdsForUser([]));
        }
      }
      return;
    }

    // Representante: clientes que o titular aprovou explicitamente (approvedUserIds).
    if (user.role === "representative") {
      const repUid = getAppUserProfileUid(user);
      if (!repUid) {
        setClientIdsForUser([]);
        return;
      }
      const clientsRef = collection(firestore, "clients");
      const qApprovedForRep = query(
        clientsRef,
        where("approvedUserIds", "array-contains", repUid),
      );
      getDocs(qApprovedForRep)
        .then((snap) => {
          setClientIdsForUser(snap.docs.map((d) => d.id));
        })
        .catch(() => setClientIdsForUser([]));
      return;
    }

    // Outros perfis não usam clientIdsForUser.
    setClientIdsForUser(null);
  }, [firestore, user, userCpf]);

  const invoicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    // Perfis internos: veem todas as faturas.
    if (user.role === "admin" || user.role === "financial") {
      return collection(firestore, "invoices");
    }

    // Cliente e representante: apenas faturas dos clientes que podem visualizar.
    if (isClientePortalRole(user.role) || user.role === "representative") {
      if (!clientIdsForUser || clientIdsForUser.length === 0) return null;
      return query(
        collection(firestore, "invoices"),
        where("clientId", "in", clientIdsForUser),
      );
    }

    return null;
  }, [firestore, user, clientIdsForUser]);

  const { data: invoices, isLoading: isLoadingInvoices } =
    useCollection<Invoice>(invoicesQuery);

  const canSyncOverdue = isAdminOrFinancialRole(user?.role);
  useSyncOverdueInvoices(invoices ?? undefined, canSyncOverdue);

  const overdueAlert = useMemo(() => {
    if (!invoices) return 0;
    const today = new Date().toISOString().slice(0, 10);
    return invoices.filter(
      (i) =>
        (i.status === "Unpaid" || i.status === "Overdue") &&
        i.dueDate?.slice(0, 10) < today,
    ).length;
  }, [invoices]);

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

  const {
    data: brandingData,
    isLoading: isLoadingBranding,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const isResolvingClientIds =
    (isClientePortalRole(user?.role) || user?.role === "representative") &&
    clientIdsForUser === null;

  const isLoading =
    isLoadingInvoices ||
    isLoadingClients ||
    isLoadingBranding ||
    isLoadingContracts ||
    isResolvingClientIds;

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => {
      return b.invoiceNumber.localeCompare(a.invoiceNumber, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [invoices]);

  const periodValue =
    periodType === "day"
      ? periodDay
      : periodType === "month"
        ? periodMonth
        : periodYear;
  const invoicesInPeriod = useMemo(() => {
    if (!periodValue) return sortedInvoices;
    return sortedInvoices.filter((inv) =>
      isInvoiceInPeriod(inv, periodType, periodValue),
    );
  }, [sortedInvoices, periodType, periodValue]);

  const invoicesToLaunch = useMemo(
    () =>
      sortedInvoices.filter(
        (inv) => inv.status === "Unpaid" || inv.status === "Overdue",
      ),
    [sortedInvoices],
  );
  const invoicesByPeriod = useMemo(() => {
    return sortedInvoices.filter((inv) => {
      const raw = inv.invoiceDate;
      if (!raw) return false;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return false;
      const y = String(d.getFullYear());
      if (y !== periodYearFilter) return false;
      if (!periodMonthFilter) return true;
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return m === periodMonthFilter;
    });
  }, [sortedInvoices, periodYearFilter, periodMonthFilter]);
  const currentGroupList =
    viewGroup === "a_lancar" ? invoicesToLaunch : invoicesByPeriod;
  const filteredInvoices = useMemo(() => {
    const toDateValue = (value?: string) => {
      if (!value) return Number.POSITIVE_INFINITY;
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
    };
    return currentGroupList
      .filter((inv) => {
        const clientName = clientsMap.get(inv.clientId)?.name ?? "";
        if (filterCliente.trim()) {
          if (
            !clientName.toLowerCase().includes(filterCliente.trim().toLowerCase())
          )
            return false;
        }
        if (filterNumero.trim()) {
          if (
            !inv.invoiceNumber
              .toLowerCase()
              .includes(filterNumero.trim().toLowerCase())
          )
            return false;
        }
        if (filterDataInicio) {
          const invDate = (inv.invoiceDate || "").slice(0, 10);
          if (invDate < filterDataInicio) return false;
        }
        if (filterDataFim) {
          const invDate = (inv.invoiceDate || "").slice(0, 10);
          if (invDate > filterDataFim) return false;
        }
        const vMin = filterValorMin !== "" ? parseFloat(filterValorMin) : null;
        const vMax = filterValorMax !== "" ? parseFloat(filterValorMax) : null;
        if (vMin != null && !Number.isNaN(vMin) && inv.amount < vMin)
          return false;
        if (vMax != null && !Number.isNaN(vMax) && inv.amount > vMax)
          return false;
        return true;
      })
      .sort((a, b) => {
        const clientCmp = (clientsMap.get(a.clientId)?.name || "").localeCompare(
          clientsMap.get(b.clientId)?.name || "",
          "pt-BR",
          { sensitivity: "base" },
        );
        if (clientCmp !== 0) return clientCmp;
        return (a.invoiceNumber || "").localeCompare(b.invoiceNumber || "", "pt-BR", {
          sensitivity: "base",
        });
      });
  }, [
    currentGroupList,
    clientsMap,
    filterCliente,
    filterNumero,
    filterDataInicio,
    filterDataFim,
    filterValorMin,
    filterValorMax,
  ]);

  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Invoice) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleView = (item: Invoice) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !auth || !itemToDelete) return;

    const docRef = doc(firestore, "invoices", itemToDelete);
    const deletedItem = invoices?.find((inv) => inv.id === itemToDelete);

    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Fatura deletada",
          description: "A fatura foi removida com sucesso.",
        });
        if (deletedItem) {
          logUserAction(firestore, auth, "delete_invoice", {
            invoiceId: itemToDelete,
            invoiceNumber: deletedItem.invoiceNumber,
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

  const handleExportPdf = async (invoice: Invoice) => {
    if (exportingPdfKey) return;
    setExportingPdfKey(`invoice-${invoice.id}`);
    try {
    if (!guardBrandingPdfExport({ isPdfImagesLoading, hasBrandingUrls, toast })) return;
    const client = clientsMap.get(invoice.clientId);
    const contract = invoice.contractId
      ? contractsMap.get(invoice.contractId)
      : null;

    const invoiceMargins = { left: 15, right: 15, top: 15, bottom: 25 };
    const brandingUrls = brandingUrlsFromLocal(brandingData);
    const session = await createMmBrandedPdfSession(brandingUrls, invoiceMargins, pdfImages);
    reportBrandingPdfIssues(brandingUrls, session.branding.images, (payload) =>
      toast({
        ...payload,
        description: payload.description
          ? `${payload.description} Confira Configurações → Identidade visual e publique as regras do Storage (npm run deploy:storage).`
          : undefined,
      }),
    );
    const { doc, margins } = session;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = session.contentWidth;
    const innerPad = 5;
    const lineH = 5;
    const priceColW = 38;
    const descMaxW = contentWidth - priceColW - innerPad * 2 - 4;
    const priceX = margins.left + contentWidth - innerPad;
    const descX = margins.left + innerPad;
    let yPos = session.startY;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`FATURA #${invoice.invoiceNumber}`, pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 15;

    // Dates Box
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.roundedRect(margins.left, yPos, contentWidth, 15, 3, 3, "S");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Data de Vencimento: ${new Date(invoice.dueDate).toLocaleDateString("pt-BR")}`,
      descX,
      yPos + 8,
    );
    doc.setFont("helvetica", "normal");
    const emissaoLabel = "Data de Emissão:";
    const emissaoDate = new Date(invoice.invoiceDate).toLocaleDateString("pt-BR");
    doc.text(
      `${emissaoLabel} ${emissaoDate}`,
      priceX,
      yPos + 8,
      { align: "right", maxWidth: contentWidth * 0.45 },
    );
    doc.setLineWidth(0.2);
    yPos += 15 + 2;

    // Client Data Box
    const clientInnerW = contentWidth - innerPad * 2;
    const clientLines: string[] = [];
    if (client) {
      clientLines.push(client.name);
      clientLines.push(`Doc: ${client.cpfCnpj || "Não informado"}`);
      clientLines.push(
        `Contato: ${client.phone || ""} | ${client.email || ""}`,
      );
      const addressString = `${client.address || ""}, ${client.numero || "s/n"} - ${client.bairro || ""}. ${client.municipio || ""}/${client.uf || ""} - CEP: ${client.cep || ""}`;
      clientLines.push(
        ...doc.splitTextToSize(`Endereço: ${addressString}`, clientInnerW),
      );
    }
    const clientBoxHeight = 12 + clientLines.length * lineH + 4;
    doc.roundedRect(
      margins.left,
      yPos,
      contentWidth,
      clientBoxHeight,
      3,
      3,
      "S",
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Cliente:", descX, yPos + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let clientY = yPos + 14;
    clientLines.forEach((line) => {
      doc.text(line, descX, clientY, { maxWidth: clientInnerW });
      clientY += lineH;
    });
    yPos += clientBoxHeight + 2;

    // Items Box — altura dinâmica e coluna de preço à direita
    type ItemRow = { descLines: string[]; price: string };
    const itemRows: ItemRow[] = [];
    if (
      contract &&
      contract.objeto?.itens &&
      contract.objeto.itens.length > 0
    ) {
      contract.objeto.itens.forEach((item) => {
        itemRows.push({
          descLines: doc.splitTextToSize(item.descricao, descMaxW),
          price: formatCurrency(item.valor),
        });
      });
    } else {
      itemRows.push({
        descLines: doc.splitTextToSize(
          `Serviços referentes à fatura ${invoice.invoiceNumber}`,
          descMaxW,
        ),
        price: "",
      });
    }
    let itemsBodyH = 0;
    itemRows.forEach((row) => {
      itemsBodyH += Math.max(row.descLines.length * lineH, lineH) + 3;
    });
    const itemsBoxHeight = 12 + itemsBodyH + 4;
    doc.roundedRect(
      margins.left,
      yPos,
      contentWidth,
      itemsBoxHeight,
      3,
      3,
      "S",
    );
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Descrição dos Serviços:", descX, yPos + 8);
    let itemsY = yPos + 14;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    itemRows.forEach((row) => {
      const rowH = Math.max(row.descLines.length * lineH, lineH);
      doc.text(row.descLines, descX, itemsY, { maxWidth: descMaxW });
      if (row.price) {
        doc.text(row.price, priceX, itemsY, { align: "right" });
      }
      itemsY += rowH + 3;
    });
    yPos += itemsBoxHeight + 2;

    // Total Box
    const totalBoxHeight = 22;
    doc.roundedRect(
      margins.left,
      yPos,
      contentWidth,
      totalBoxHeight,
      3,
      3,
      "S",
    );

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const statusText = `Status: ${invoice.status === "Paid" ? "Paga" : invoice.status === "Unpaid" ? "Pendente" : "Atrasada"}`;
    doc.text(statusText, descX, yPos + 8, { maxWidth: descMaxW });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Valor Total", priceX, yPos + 8, { align: "right" });
    doc.setFontSize(14);
    doc.text(formatCurrency(invoice.amount), priceX, yPos + 15, {
      align: "right",
    });

    session.finalize();
    downloadJsPdf(doc, `fatura_${invoice.invoiceNumber}.pdf`);
    } finally {
      setExportingPdfKey(null);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleExportPdfByPeriod = async () => {
    if (exportingPdfKey) return;
    setExportingPdfKey("period");
    try {
    if (!guardBrandingPdfExport({ isPdfImagesLoading, hasBrandingUrls, toast })) return;
    const brandingUrlsPeriod = brandingUrlsFromLocal(brandingData);
    const session = await createMmBrandedPdfSession(brandingUrlsPeriod, undefined, pdfImages);
    reportBrandingPdfIssues(brandingUrlsPeriod, session.branding.images, toast);
    const { doc, margins } = session;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = session.startY;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Faturas por Período", pageWidth / 2, y, {
      align: "center",
    });
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const periodLabel =
      periodType === "day"
        ? periodDay
        : periodType === "month"
          ? periodMonth
          : periodYear;
    doc.text(
      `Período: ${periodType === "day" ? "Dia " : periodType === "month" ? "Mês " : "Ano "}${periodLabel}`,
      pageWidth / 2,
      y,
      { align: "center" },
    );
    y += 12;
    const cols = ["Fatura", "Cliente", "Data", "Valor", "Status"];
    const colWidths = [25, 50, 25, 35, 30];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    let x = margins.left;
    cols.forEach((c, i) => {
      doc.text(c, x, y);
      x += colWidths[i];
    });
    y += 7;
    doc.setFont("helvetica", "normal");
    invoicesInPeriod.forEach((inv) => {
      y = session.ensureSpace(y, 6);
      x = margins.left;
      const clientName = (clientsMap.get(inv.clientId)?.name || "").slice(
        0,
        22,
      );
      const status =
        inv.status === "Paid"
          ? "Paga"
          : inv.status === "Unpaid"
            ? "Pendente"
            : "Atrasada";
      doc.text(inv.invoiceNumber, x, y);
      x += colWidths[0];
      doc.text(clientName, x, y);
      x += colWidths[1];
      doc.text(new Date(inv.invoiceDate).toLocaleDateString("pt-BR"), x, y);
      x += colWidths[2];
      doc.text(formatCurrency(inv.amount), x, y);
      x += colWidths[3];
      doc.text(status, x, y);
      y += 6;
    });
    y += 6;
    doc.setFont("helvetica", "bold");
    const total = invoicesInPeriod.reduce((s, i) => s + i.amount, 0);
    doc.text(
      `Total: ${formatCurrency(total)} (${invoicesInPeriod.length} fatura(s))`,
      margins.left,
      y,
    );

    session.finalize();
    downloadJsPdf(doc, `faturas_periodo_${periodLabel.replace(/-/g, "")}.pdf`);
    toast({
      title: "PDF exportado",
      description: "Relatório por período gerado.",
    });
    } finally {
      setExportingPdfKey(null);
    }
  };

  const handlePrintByPeriod = () => {
    const rows = invoicesInPeriod.map((inv) => ({
      fatura: inv.invoiceNumber,
      cliente: clientsMap.get(inv.clientId)?.name || "",
      data: new Date(inv.invoiceDate).toLocaleDateString("pt-BR"),
      valor: formatCurrency(inv.amount),
      status:
        inv.status === "Paid"
          ? "Paga"
          : inv.status === "Unpaid"
            ? "Pendente"
            : "Atrasada",
    }));
    const periodLabel =
      periodType === "day"
        ? periodDay
        : periodType === "month"
          ? periodMonth
          : periodYear;
    const total = invoicesInPeriod.reduce((s, i) => s + i.amount, 0);
    const tableRows = rows
      .map(
        (r) =>
          `<tr><td>${r.fatura}</td><td>${r.cliente}</td><td>${r.data}</td><td>${r.valor}</td><td>${r.status}</td></tr>`,
      )
      .join("");
    const win = window.open("", "_blank");
    if (!win) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Permita pop-ups para imprimir.",
      });
      return;
    }
    win.document.write(`
            <!DOCTYPE html><html><head><meta charset="utf-8"><title>Faturas - Período</title>
            <style>body{font-family:system-ui,sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} .text-right{text-align:right;}</style></head><body>
            <h1>Relatório de Faturas por Período</h1>
            <p><strong>Período:</strong> ${periodType === "day" ? "Dia " : periodType === "month" ? "Mês " : "Ano "}${periodLabel}</p>
            <table><thead><tr><th>Fatura</th><th>Cliente</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
            <p><strong>Total:</strong> ${formatCurrency(total)} (${invoicesInPeriod.length} fatura(s))</p>
            </body></html>
        `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
    toast({
      title: "Impressão",
      description: "Use a janela de impressão do navegador.",
    });
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Faturas">
          {(user?.role === "admin" || user?.role === "financial") && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Criar Fatura
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
          {overdueAlert > 0 && canSyncOverdue && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Faturas em atraso</AlertTitle>
              <AlertDescription>
                {overdueAlert} fatura(s) com vencimento passado. O sistema atualiza automaticamente o status para &quot;Atrasada&quot; ao abrir esta página.
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Faturas</CardTitle>
              <CardDescription>
                Adicione, edite e visualize todas as faturas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={viewGroup}
                onValueChange={(v) =>
                  setViewGroup(v as "a_lancar" | "por_periodo")
                }
              >
                <TabsList>
                  <TabsTrigger value="a_lancar">Faturas a lançar</TabsTrigger>
                  <TabsTrigger value="por_periodo">
                    Faturas lançadas por período
                  </TabsTrigger>
                </TabsList>
                {viewGroup === "por_periodo" && (
                  <div className="mt-3 flex flex-nowrap items-center gap-2 overflow-x-auto px-0.5 pb-0.5 sm:gap-3">
                    <div className="flex shrink-0 items-center gap-2">
                      <Label
                        htmlFor="inv-tab-ano"
                        className="shrink-0 text-sm text-muted-foreground whitespace-nowrap"
                      >
                        Ano:
                      </Label>
                      <Select
                        value={periodYearFilter}
                        onValueChange={setPeriodYearFilter}
                      >
                        <SelectTrigger
                          id="inv-tab-ano"
                          className="h-9 w-[92px] shrink-0 sm:w-[100px]"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: 6 },
                            (_, i) => new Date().getFullYear() - i,
                          ).map((y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Label
                        htmlFor="inv-tab-mes"
                        className="shrink-0 text-sm text-muted-foreground whitespace-nowrap"
                      >
                        Mês:
                      </Label>
                      <Select
                        value={periodMonthFilter || "todos"}
                        onValueChange={(v) =>
                          setPeriodMonthFilter(v === "todos" ? "" : v)
                        }
                      >
                        <SelectTrigger
                          id="inv-tab-mes"
                          className="h-9 w-[108px] shrink-0 sm:w-[120px]"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {[
                            "01",
                            "02",
                            "03",
                            "04",
                            "05",
                            "06",
                            "07",
                            "08",
                            "09",
                            "10",
                            "11",
                            "12",
                          ].map((m, i) => (
                            <SelectItem key={m} value={m}>
                              {
                                [
                                  "Jan",
                                  "Fev",
                                  "Mar",
                                  "Abr",
                                  "Mai",
                                  "Jun",
                                  "Jul",
                                  "Ago",
                                  "Set",
                                  "Out",
                                  "Nov",
                                  "Dez",
                                ][i]
                              }
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </Tabs>
              <Card className="border-border/60 bg-muted/30 shadow-sm">
                <CardHeader className="space-y-1 pb-2 pt-4">
                  <div className="flex items-center gap-2">
                    <Search
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <CardTitle className="text-base font-semibold">
                      Filtrar faturas
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Refine a lista por cliente, número da fatura, datas e faixa
                    de valores.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="inv-filter-cliente"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Cliente
                      </Label>
                      <Input
                        id="inv-filter-cliente"
                        placeholder="Nome"
                        className="h-10 min-w-0"
                        value={filterCliente}
                        onChange={(e) => setFilterCliente(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="inv-filter-numero"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Nº Fatura
                      </Label>
                      <Input
                        id="inv-filter-numero"
                        placeholder="Número"
                        className="h-10 min-w-0"
                        value={filterNumero}
                        onChange={(e) => setFilterNumero(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="inv-filter-start"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Data início
                      </Label>
                      <BrDateInput
                        id="inv-filter-start"
                        className="h-10 min-w-0"
                        value={filterDataInicio}
                        onChange={setFilterDataInicio}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="inv-filter-end"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Data fim
                      </Label>
                      <BrDateInput
                        id="inv-filter-end"
                        className="h-10 min-w-0"
                        value={filterDataFim}
                        onChange={setFilterDataFim}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="inv-filter-vmin"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Valor mín.
                      </Label>
                      <Input
                        id="inv-filter-vmin"
                        type="number"
                        placeholder="0"
                        className="h-10 min-w-0"
                        value={filterValorMin}
                        onChange={(e) => setFilterValorMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="inv-filter-vmax"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Valor máx.
                      </Label>
                      <Input
                        id="inv-filter-vmax"
                        type="number"
                        placeholder="0"
                        className="h-10 min-w-0"
                        value={filterValorMax}
                        onChange={(e) => setFilterValorMax(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-muted/30 shadow-sm">
                <CardHeader className="space-y-1 pb-2 pt-4">
                  <CardTitle className="text-base font-semibold">
                    Relatório por período (PDF / impressão)
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    O período abaixo define o conteúdo do PDF e da impressão das
                    faturas nesse intervalo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-end sm:justify-between sm:gap-3 sm:overflow-x-auto">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-end sm:gap-3">
                      <div className="space-y-1.5 sm:shrink-0">
                        <Label
                          htmlFor="inv-period-type"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Tipo de período
                        </Label>
                        <Select
                          value={periodType}
                          onValueChange={(v) =>
                            setPeriodType(v as PeriodType)
                          }
                        >
                          <SelectTrigger
                            id="inv-period-type"
                            className="h-9 w-full sm:w-[140px]"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Dia</SelectItem>
                            <SelectItem value="month">Mês</SelectItem>
                            <SelectItem value="year">Ano</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-[220px] sm:flex-initial">
                        <Label
                          htmlFor="inv-period-value"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          {periodType === "day"
                            ? "Data"
                            : periodType === "month"
                              ? "Mês"
                              : "Ano"}
                        </Label>
                        {periodType === "day" && (
                          <BrDateInput
                            id="inv-period-value"
                            className="h-9 min-w-0"
                            value={periodDay}
                            onChange={setPeriodDay}
                          />
                        )}
                        {periodType === "month" && (
                          <Input
                            id="inv-period-value"
                            type="month"
                            className="h-9 min-w-0 pr-2 [color-scheme:light] dark:[color-scheme:dark]"
                            value={periodMonth}
                            onChange={(e) => setPeriodMonth(e.target.value)}
                          />
                        )}
                        {periodType === "year" && (
                          <Select
                            value={periodYear}
                            onValueChange={setPeriodYear}
                          >
                            <SelectTrigger
                              id="inv-period-value"
                              className="h-9 w-full sm:w-[120px]"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(
                                { length: 6 },
                                (_, i) => new Date().getFullYear() - i,
                              ).map((y) => (
                                <SelectItem key={y} value={String(y)}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-row flex-nowrap gap-2 overflow-x-auto pb-0.5 sm:overflow-visible">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 shrink-0 gap-1.5 px-2.5 sm:px-3"
                        onClick={handleExportPdfByPeriod}
                        disabled={!!exportingPdfKey}
                        aria-busy={exportingPdfKey === 'period'}
                      >
                        <FileDown
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden
                        />
                        <span className="whitespace-nowrap">
                          Exportar PDF
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 shrink-0 gap-1.5 px-2.5 sm:px-3"
                        onClick={handlePrintByPeriod}
                      >
                        <Printer
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden
                        />
                        <span className="whitespace-nowrap">Imprimir</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!isLoading &&
                    filteredInvoices?.map((invoice) => (
                      <Card
                        key={invoice.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                Fatura #{invoice.invoiceNumber}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {clientsMap.get(invoice.clientId)?.name ||
                                  "Cliente não encontrado"}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant={
                                    invoice.status === "Paid"
                                      ? "default"
                                      : invoice.status === "Unpaid"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className={cn(
                                    invoice.status === "Paid" &&
                                      "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                                    invoice.status === "Unpaid" &&
                                      "bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
                                    invoice.status === "Overdue" &&
                                      "bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
                                  )}
                                >
                                  {invoice.status === "Paid"
                                    ? "Paga"
                                    : invoice.status === "Unpaid"
                                      ? "Pendente"
                                      : "Atrasada"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Emissão:{" "}
                                {new Date(invoice.invoiceDate).toLocaleDateString("pt-BR")} ·
                                Venc.:{" "}
                                {new Date(invoice.dueDate).toLocaleDateString("pt-BR")} ·{" "}
                                {formatCurrency(invoice.amount)}
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
                                    onClick={() => handleView(invoice)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Visualizar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                              {(!isClientOrRep || invoice.status === "Paid") && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      disabled={exportingPdfKey === `invoice-${invoice.id}`}
                                      aria-busy={exportingPdfKey === `invoice-${invoice.id}`}
                                      onClick={() => handleExportPdf(invoice)}
                                    >
                                      <FileText className="h-4 w-4" />
                                      <span className="sr-only">Exportar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Exportar PDF</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {(user?.role === "admin" ||
                                user?.role === "financial") && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        type="button"
                                        onClick={() => handleEdit(invoice)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar fatura</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                        type="button"
                                        onClick={() => openDeleteConfirm(invoice.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Deletar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Deletar fatura</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredInvoices?.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      {currentGroupList.length === 0
                        ? viewGroup === "a_lancar"
                          ? "Nenhuma fatura a lançar."
                          : "Nenhuma fatura no período."
                        : "Nenhuma fatura corresponde aos filtros."}
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl h-full max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Fatura" : "Nova Fatura"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Atualize os detalhes da fatura."
                : "Preencha os campos para criar uma nova fatura."}
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            currentItem={editingItem}
            onSuccess={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Fatura #{viewingItem?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>
              Visualização dos dados cadastrados para a fatura.
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              <DetailItem
                label="Cliente"
                value={clientsMap.get(viewingItem.clientId)?.name}
              />
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Data de Emissão"
                  value={new Date(viewingItem.invoiceDate).toLocaleDateString(
                    "pt-BR",
                  )}
                />
                <DetailItem
                  label="Data de Vencimento"
                  value={new Date(viewingItem.dueDate).toLocaleDateString(
                    "pt-BR",
                  )}
                />
              </div>
              <DetailItem label="Status" value={viewingItem.status} />
              <Separator />
              <div className="flex justify-end font-semibold text-lg">
                <DetailItem
                  label="Valor Total"
                  value={formatCurrency(viewingItem.amount)}
                />
              </div>
              <AttachmentPreviewSection
                fileUrl={viewingItem.fileUrl}
                sectionLabel="Boleto / comprovante"
                emptyLabel="Nenhum anexo cadastrado para esta fatura."
                zoomTitle="Anexo da fatura"
                zoomDescription="Visualização ampliada do boleto ou comprovante."
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
              a fatura.
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
