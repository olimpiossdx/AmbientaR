"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, AlertTriangle, CheckCircle, Eye } from "lucide-react";
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
  useAuth,
  useCollection,
  useFirebase,
  useMemoFirebase,
} from "@/firebase";
import type {
  Inspection,
  Empreendedor,
  Project,
  CompanySettings,
  AppUser,
} from "@/lib/types";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  fetchBrandingImageAsBase64,
  downloadJsPdf,
  getImageDimensions,
  calcPdfImageSize,
} from "@/lib/branding-pdf";
import { useLocalBranding } from "@/hooks/use-local-branding";

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
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { CardSearchInput } from "@/components/card-search-input";
import { isClientePortalRole } from "@/lib/role-guards";

type Report = Inspection;

export default function InspectionReportsListPage() {
  const [reportToConfirm, setReportToConfirm] = React.useState<Report | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [empreendedorIdsForUser, setEmpreendedorIdsForUser] = React.useState<
    string[] | undefined
  >(undefined);

  // Use state for inspections to allow for local mutation
  const [inspections, setInspections] = React.useState<Inspection[] | null>(
    null,
  );

  React.useEffect(() => {
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
            const ids = snapshot.docs.map((doc) => doc.id);
            setEmpreendedorIdsForUser(
              ids.length > 0 ? ids : ["invalid-placeholder"],
            );
          })
          .catch((err) => {
            console.error("Error fetching empreendedor IDs:", err);
            setEmpreendedorIdsForUser(["invalid-placeholder"]);
          });
      } else {
        setEmpreendedorIdsForUser(["invalid-placeholder"]);
      }
    } else if (user) {
      setEmpreendedorIdsForUser([]);
    }
  }, [user, firestore]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || empreendedorIdsForUser === undefined) return null;
    if (isClientePortalRole(user?.role) && empreendedorIdsForUser.length > 0) {
      return query(
        collection(firestore, "projects"),
        where("empreendedorId", "in", empreendedorIdsForUser),
      );
    }
    if (!isClientePortalRole(user?.role)) {
      return collection(firestore, "projects");
    }
    return null;
  }, [firestore, user, empreendedorIdsForUser]);
  const { data: projects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);
  const projectIds = React.useMemo(
    () => projects?.map((p) => p.id) || [],
    [projects],
  );
  const projectsMap = React.useMemo(
    () => new Map(projects?.map((p) => [p.id, p.propertyName])),
    [projects],
  );

  const inspectionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (isClientePortalRole(user?.role)) {
      if (
        projectIds.length === 0 &&
        empreendedorIdsForUser &&
        empreendedorIdsForUser.length > 0
      )
        return query(
          collection(firestore, "inspections"),
          where("status", "==", "invalid"),
        ); // Query that returns nothing while projects are loading
      if (projectIds.length === 0) return null;
      return query(
        collection(firestore, "inspections"),
        where("status", "==", "Aprovada"),
        where("projectId", "in", projectIds),
      );
    }
    return query(
      collection(firestore, "inspections"),
      where("status", "==", "Aprovada"),
    );
  }, [firestore, user, projectIds, empreendedorIdsForUser]);

  const { data: fetchedInspections, isLoading: isLoadingInspections } =
    useCollection<Inspection>(inspectionsQuery);

  React.useEffect(() => {
    if (fetchedInspections) {
      setInspections(fetchedInspections);
    }
  }, [fetchedInspections]);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = React.useMemo(
    () => new Map(empreendedores?.map((e) => [e.id, e.name])),
    [empreendedores],
  );

  const { data: brandingData } = useLocalBranding();

  const isLoading =
    isLoadingInspections ||
    isLoadingEmpreendedores ||
    isLoadingProjects ||
    (isClientePortalRole(user?.role) && empreendedorIdsForUser === undefined);
  const filteredInspections = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = inspections || [];
    const termFiltered = !term
      ? base
      : base.filter((report) => {
      const empreendimento = (projectsMap.get(report.projectId) || "").toLowerCase();
      const empreendedor = (empreendedoresMap.get(report.empreendedorId) || "").toLowerCase();
      const responsavel = (report.inspectorName || "").toLowerCase();
      const data = report.inspectionDate
        ? new Date(report.inspectionDate).toLocaleDateString("pt-BR").toLowerCase()
        : "";
      return (
        empreendimento.includes(term) ||
        empreendedor.includes(term) ||
        responsavel.includes(term) ||
        data.includes(term)
      );
    });
    return [...termFiltered].sort((a, b) =>
      (projectsMap.get(a.projectId) || "").localeCompare(
        projectsMap.get(b.projectId) || "",
        "pt-BR",
        { sensitivity: "base" },
      ),
    );
  }, [inspections, searchTerm, projectsMap, empreendedoresMap]);

  const handleReadConfirmation = (report: Report) => {
    setReportToConfirm(report);
  };

  const handleConfirmRead = async () => {
    if (!reportToConfirm || !user || !firestore) return;

    const inspectionRef = doc(firestore, "inspections", reportToConfirm.id);
    const readAtIso = new Date().toISOString();
    const readEntry = { [user.uid]: readAtIso };

    try {
      await updateDoc(inspectionRef, {
        [`readBy.${user.uid}`]: readAtIso,
      });

      // Mutate local state
      setInspections((prev) =>
        prev!.map((insp) =>
          insp.id === reportToConfirm.id
            ? { ...insp, readBy: { ...insp.readBy, ...readEntry } }
            : insp,
        ),
      );

      toast({
        title: "Leitura Confirmada",
        description: `Registro de leitura para o relatório foi salvo.`,
      });
    } catch (error) {
      console.error("Error confirming read:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível confirmar a leitura.",
      });
    }

    setReportToConfirm(null);
  };

  const handleViewPdf = async (report: Inspection) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 15;

    const headerBase64 = await fetchBrandingImageAsBase64(
      brandingData?.headerImageUrl,
    );
    const footerBase64 = await fetchBrandingImageAsBase64(
      brandingData?.footerImageUrl,
    );

    if (headerBase64) {
      const dims = await getImageDimensions(headerBase64);
      const { w, h } = calcPdfImageSize(dims, pageWidth - 20, 30);
      doc.addImage(headerBase64, "PNG", 10, 10, w, h);
      yPos = 10 + h + 5;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Campo", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Empreendimento: ${projectsMap.get(report.projectId) || "N/A"}`,
      15,
      yPos,
    );
    yPos += 6;
    doc.text(
      `Empreendedor: ${empreendedoresMap.get(report.empreendedorId) || "N/A"}`,
      15,
      yPos,
    );
    yPos += 6;
    doc.text(
      `Data da Vistoria: ${new Date(report.inspectionDate).toLocaleDateString("pt-BR")}`,
      15,
      yPos,
    );
    yPos += 6;
    doc.text(`Responsável: ${report.inspectorName}`, 15, yPos);
    yPos += 12;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Inconformidades e Observações", 15, yPos);
    yPos += 6;

    const tableData = report.inconformidades.map((item) => [
      item.description,
      item.criticality,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Descrição", "Criticidade"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [34, 139, 34] },
    });

    if (footerBase64) {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const fDims = await getImageDimensions(footerBase64);
        const { w: fw, h: fh } = calcPdfImageSize(fDims, pageWidth - 20, 20);
        doc.addImage(footerBase64, "PNG", 10, pageHeight - fh - 5, fw, fh);
      }
    }
    addPageNumbers(doc, 10);

    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  };

  const handleGeneratePdf = async (report: Inspection) => {
    toast({ title: "Gerando PDF...", description: "Por favor, aguarde." });

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 15;

    const headerBase64 = await fetchBrandingImageAsBase64(
      brandingData?.headerImageUrl,
    );
    const footerBase64 = await fetchBrandingImageAsBase64(
      brandingData?.footerImageUrl,
    );

    if (headerBase64) {
      const dims = await getImageDimensions(headerBase64);
      const { w, h } = calcPdfImageSize(dims, pageWidth - 20, 30);
      doc.addImage(headerBase64, "PNG", 10, 10, w, h);
      yPos = 10 + h + 5;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Campo", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Empreendimento: ${projectsMap.get(report.projectId) || "N/A"}`,
      15,
      yPos,
    );
    yPos += 6;
    doc.text(
      `Empreendedor: ${empreendedoresMap.get(report.empreendedorId) || "N/A"}`,
      15,
      yPos,
    );
    yPos += 6;
    doc.text(
      `Data da Vistoria: ${new Date(report.inspectionDate).toLocaleDateString("pt-BR")}`,
      15,
      yPos,
    );
    yPos += 6;
    doc.text(`Responsável: ${report.inspectorName}`, 15, yPos);
    yPos += 12;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Inconformidades e Observações", 15, yPos);
    yPos += 6;

    const tableData = report.inconformidades.map((item) => [
      item.description,
      item.criticality,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Descrição", "Criticidade"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [34, 139, 34] },
    });

    if (footerBase64) {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const fDims = await getImageDimensions(footerBase64);
        const { w: fw, h: fh } = calcPdfImageSize(fDims, pageWidth - 20, 20);
        doc.addImage(footerBase64, "PNG", 10, pageHeight - fh - 5, fw, fh);
      }
    }
    // Numeração de páginas alinhada à direita no rodapé.
    addPageNumbers(doc, 10);

    const fileName = `Relatorio_Vistoria_${(projectsMap.get(report.projectId) || "desconhecido").replace(/\s+/g, "_")}.pdf`;
    downloadJsPdf(doc, fileName);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Relatórios de Campo" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Aprovados</CardTitle>
              <CardDescription>
                Acesse e confirme a leitura dos relatórios de todas as vistorias
                em campo aprovadas.
              </CardDescription>
              <CardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar empreendimento, responsável, data..."
              />
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-28 w-full rounded-lg"
                      />
                    ))
                  ) : filteredInspections.length > 0 ? (
                    filteredInspections.map((report) => {
                      const readTimestamp =
                        user && report.readBy
                          ? report.readBy[user.uid]
                          : null;
                      const isRead = !!readTimestamp;
                      const needsReadConfirmation =
                        isClientePortalRole(user?.role) ||
                        user?.role === "representative";
                      const canAccessDocument =
                        !needsReadConfirmation || isRead;
                      return (
                        <Card
                          key={report.id}
                          className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4">
                              <div className="min-w-0 space-y-2">
                                <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                  {projectsMap.get(report.projectId) ||
                                    "Não encontrado"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Data:{" "}
                                  {new Date(
                                    report.inspectionDate,
                                  ).toLocaleDateString("pt-BR")}{" "}
                                  · Responsável: {report.inspectorName}
                                </p>
                                <div className="text-sm">
                                  {isRead ? (
                                    <div className="flex flex-col gap-0.5 text-green-600">
                                      <span className="inline-flex items-center gap-1 font-medium">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Leitura confirmada
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(readTimestamp!).toLocaleString(
                                          "pt-BR",
                                        )}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Leitura pendente
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Separator className="bg-border/60" />
                              <div className="flex flex-wrap items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() => handleViewPdf(report)}
                                      disabled={!canAccessDocument}
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">
                                        Visualizar documento
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {canAccessDocument
                                        ? "Visualizar documento (sem imprimir)"
                                        : "Confirme a leitura para visualizar"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() => handleGeneratePdf(report)}
                                      disabled={!canAccessDocument}
                                    >
                                      <Download className="h-4 w-4" />
                                      <span className="sr-only">
                                        Baixar PDF
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {canAccessDocument
                                        ? "Baixar PDF"
                                        : "Confirme a leitura para baixar"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                                {!isRead && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    type="button"
                                    className="shrink-0"
                                    onClick={() =>
                                      handleReadConfirmation(report)
                                    }
                                  >
                                    Confirmar leitura
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhum relatório encontrado para o filtro atual.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <AlertDialog
        open={!!reportToConfirm}
        onOpenChange={(open) => !open && setReportToConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" />
              Confirmação de Leitura
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span>
                Ao prosseguir, você confirma que está ciente do conteúdo do
                relatório de vistoria para o empreendimento
                <strong className="mx-1">
                  {projectsMap.get(reportToConfirm?.projectId || "")}
                </strong>
                .
              </span>
            </AlertDialogDescription>
            <div className="mt-4 text-xs text-muted-foreground bg-muted p-2 rounded-md">
              <div>
                <strong>Usuário:</strong> {user?.displayName}
              </div>
              <div>
                <strong>Data/Hora da Confirmação:</strong>{" "}
                {new Date().toLocaleString("pt-BR")}
              </div>
              <div>Esta ação será registrada.</div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRead}>
              Confirmar Leitura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
