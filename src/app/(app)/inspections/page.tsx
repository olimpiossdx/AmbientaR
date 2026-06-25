"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  FileText,
  Download,
} from "lucide-react";
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  errorEmitter,
} from "@/firebase";
import {
  collection,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  limit,
  query,
} from "firebase/firestore";
import { formatProcessoLicenciamentoDisplay } from "@/lib/field-inspection-atos-vinculados";
import { inconformidadeCriticalityBadgeClass } from "@/lib/status-display-classes";
import type {
  Inspection,
  Empreendedor,
  Project,
  AppUser,
  CompanySettings,
} from "@/lib/types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { FirestorePermissionError } from "@/firebase/errors";
import { createNotificationWithPush } from "@/lib/notifications";
import { downloadJsPdf } from "@/lib/branding-pdf";
import { buildInspectionFieldReportPdf } from "@/lib/inspection-field-report-pdf";
import {
  CHECKLIST_STATUS_LABELS,
  FIELD_INSPECTION_CHECKLIST,
  mergeChecklistWithTemplate,
} from "@/lib/field-inspection-checklist";
import {
  brandingUrlsFromLocal,
  createMmBrandedPdfSession,
  guardBrandingExportFromHook,
  reportBrandingPdfIssues,
} from "@/lib/pdf-branding-layout";
import { useLocalBranding } from "@/hooks/use-local-branding";

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

export default function InspectionsListPage() {
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const [viewingItem, setViewingItem] = React.useState<Inspection | null>(null);
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const inspectionsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "inspections"), limit(200)) : null),
    [firestore],
  );
  const { data: inspections, isLoading: isLoadingInspections } =
    useCollection<Inspection>(inspectionsQuery);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "empreendedores"), limit(200)) : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = React.useMemo(
    () => new Map(empreendedores?.map((e) => [e.id, e.name])),
    [empreendedores],
  );

  const projectsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "projects"), limit(200)) : null),
    [firestore],
  );
  const { data: projects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);
  const projectsMap = React.useMemo(
    () =>
      new Map(
        projects?.map((p) => [
          p.id,
          { name: p.propertyName, userId: p.userId },
        ]),
      ),
    [projects],
  );

  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const { draftInspections, approvedInspections } = React.useMemo(() => {
    if (!inspections) return { draftInspections: [], approvedInspections: [] };
    const drafts = inspections.filter((p) => p.status !== "Aprovada");
    const approved = inspections.filter((p) => p.status === "Aprovada");
    return { draftInspections: drafts, approvedInspections: approved };
  }, [inspections]);

  const isLoading =
    isLoadingInspections || isLoadingEmpreendedores || isLoadingProjects;

  const handleAddNew = () => {
    router.push("/inspections/new");
  };

  const handleView = (item: Inspection) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const handleEdit = (item: Inspection) => {
    if (item.status === "Aprovada") return;
    router.push(`/inspections/${item.id}/edit`);
  };

  const handleApprove = async (itemId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, "inspections", itemId);
    try {
      const inspectionDoc = await getDoc(docRef);
      if (!inspectionDoc.exists()) throw new Error("Vistoria não encontrada");
      const inspectionData = inspectionDoc.data() as Inspection;

      await updateDoc(docRef, { status: "Aprovada" });

      const projectInfo = projectsMap.get(inspectionData.projectId);
      if (projectInfo?.userId) {
        await createNotificationWithPush(firestore, projectInfo.userId, {
          title: "Relatório de vistoria aprovado",
          description: `O relatório para o empreendimento "${projectInfo.name}" foi aprovado. Confirme a leitura em Relatórios de Campo.`,
          link: "/inspections/reports",
          sourceType: "inspection_report",
          sourceId: itemId,
          actorRole: user?.role,
        });
      }

      toast({
        title: "Vistoria Aprovada",
        description:
          "O registro foi movido para a lista de aprovados e o cliente notificado.",
      });
    } catch (error) {
      console.error("Error approving inspection:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Aprovar",
        description: "Não foi possível atualizar o status da vistoria.",
      });
    }
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "inspections", itemToDelete);
    try {
      await deleteDoc(docRef);
      toast({
        title: "Vistoria deletada",
        description: "O registro da vistoria foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting inspection:", error);
      toast({
        variant: "destructive",
        title: "Erro ao deletar",
        description: "Não foi possível remover o registro.",
      });
    } finally {
      setIsAlertOpen(false);
      setItemToDelete(null);
    }
  };

  const handleGeneratePdf = async (report: Inspection) => {
    if (
      !guardBrandingExportFromHook({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
        formatLabel: "PDF",
      })
    ) {
      return;
    }
    toast({ title: "Gerando PDF...", description: "Por favor, aguarde." });

    const brandingUrls = brandingUrlsFromLocal(brandingData);
    const session = await createMmBrandedPdfSession(
      brandingUrls,
      undefined,
      pdfImages,
    );
    reportBrandingPdfIssues(brandingUrls, session.branding.images, toast);
    await buildInspectionFieldReportPdf(
      session.doc,
      report,
      session,
      session.startY,
      {
        projectName: projectsMap.get(report.projectId)?.name,
        empreendedorName: empreendedoresMap.get(report.empreendedorId),
      },
    );
    session.finalize();

    const fileName = `Relatorio_Vistoria_${projectsMap.get(report.projectId)?.name?.replace(/\s+/g, "_") || "desconhecido"}.pdf`;
    downloadJsPdf(session.doc, fileName);
  };

  const getHighestCriticality = (inspection: Inspection) => {
    if (!inspection.inconformidades || inspection.inconformidades.length === 0)
      return "Baixa";
    const levels = { Baixa: 1, Média: 2, Alta: 3, Urgente: 4 };
    const highestLevel = Math.max(
      ...inspection.inconformidades.map((i) => levels[i.criticality] || 1),
    );
    return Object.keys(levels).find(
      (key) => levels[key as keyof typeof levels] === highestLevel,
    ) as Inspection["inconformidades"][0]["criticality"];
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Vistoria Técnica">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Nova Vistoria
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Vistorias</CardTitle>
              <CardDescription>
                Visualize, gerencie e aprove novas vistorias de campo.
              </CardDescription>
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
                  ) : draftInspections && draftInspections.length > 0 ? (
                    draftInspections.map((inspection) => {
                      const highestCriticality =
                        getHighestCriticality(inspection);
                      return (
                        <Card
                          key={inspection.id}
                          className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4">
                              <div className="min-w-0 space-y-2">
                                <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                  {projectsMap.get(inspection.projectId)?.name ||
                                    "Projeto não encontrado"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Data:{" "}
                                  {new Date(
                                    inspection.inspectionDate,
                                  ).toLocaleDateString("pt-BR")}{" "}
                                  · Responsável: {inspection.inspectorName}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "w-fit",
                                      inconformidadeCriticalityBadgeClass(
                                        highestCriticality,
                                      ),
                                    )}
                                  >
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    Criticidade: {highestCriticality}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Inconformidades:{" "}
                                    {inspection.inconformidades?.length || 0}
                                  </span>
                                </div>
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
                                      onClick={() => handleView(inspection)}
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">
                                        Visualizar detalhes
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
                                      onClick={() => handleEdit(inspection)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">
                                        Editar vistoria
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar a vistoria em campo</p>
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
                                        handleGeneratePdf(inspection)
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
                                        handleApprove(inspection.id)
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span className="sr-only">
                                        Aprovar vistoria
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Aprovar vistoria</p>
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
                                        openDeleteConfirm(inspection.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">
                                        Deletar vistoria
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Deletar vistoria</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhum registro de vistoria em aberto.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vistorias Aprovadas</CardTitle>
              <CardDescription>
                Histórico de vistorias que já foram revisadas e aprovadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="h-28 w-full rounded-lg" />
                  ) : approvedInspections &&
                    approvedInspections.length > 0 ? (
                    approvedInspections.map((inspection) => (
                      <Card
                        key={inspection.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {projectsMap.get(inspection.projectId)?.name ||
                                  "Projeto não encontrado"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Data:{" "}
                                {new Date(
                                  inspection.inspectionDate,
                                ).toLocaleDateString("pt-BR")}{" "}
                                · Responsável: {inspection.inspectorName}
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
                                    onClick={() => handleView(inspection)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">
                                      Visualizar detalhes
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
                                    onClick={() =>
                                      handleGeneratePdf(inspection)
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
                              {user?.role === "admin" && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                      type="button"
                                      onClick={() =>
                                        openDeleteConfirm(inspection.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">
                                        Deletar vistoria
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Deletar vistoria</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhuma vistoria aprovada.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Vistoria</DialogTitle>
            <DialogDescription>
              Empreendimento:{" "}
              {projectsMap.get(viewingItem?.projectId || "")?.name || "N/A"}
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Empreendedor"
                  value={empreendedoresMap.get(viewingItem.empreendedorId)}
                />
                <DetailItem
                  label="Data"
                  value={new Date(
                    viewingItem.inspectionDate,
                  ).toLocaleDateString("pt-BR")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Responsável"
                  value={viewingItem.inspectorName}
                />
                <DetailItem
                  label="Acompanhado por"
                  value={viewingItem.accompaniedBy}
                />
              </div>
              {viewingItem.identificacao && (
                <>
                  <Separator />
                  <h4 className="font-semibold text-foreground">
                    1. Identificação
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem
                      label="Razão social"
                      value={viewingItem.identificacao.razaoSocial}
                    />
                    <DetailItem
                      label="Nome fantasia"
                      value={viewingItem.identificacao.nomeFantasia}
                    />
                    <DetailItem
                      label="CNPJ/CPF"
                      value={viewingItem.identificacao.cnpjCpf}
                    />
                    <DetailItem
                      label="Atividade principal"
                      value={viewingItem.identificacao.atividadePrincipal}
                    />
                    <DetailItem
                      label="Endereço"
                      value={viewingItem.identificacao.enderecoCompleto}
                    />
                    <DetailItem
                      label="Coordenadas"
                      value={viewingItem.identificacao.coordenadasGeograficas}
                    />
                    <DetailItem
                      label="Licenças / outorgas / usos"
                      value={formatProcessoLicenciamentoDisplay(
                        viewingItem.identificacao,
                      )}
                    />
                    <DetailItem
                      label="Motivo da fiscalização"
                      value={viewingItem.identificacao.motivoFiscalizacao?.join(
                        ", ",
                      )}
                    />
                  </div>
                </>
              )}
              {(() => {
                const checklist = mergeChecklistWithTemplate(
                  viewingItem.checklistResponses,
                ).filter((r) => r.status !== "nao_verificado");
                if (checklist.length === 0) return null;
                return (
                  <>
                    <Separator />
                    <h4 className="font-semibold text-foreground">
                      Checklist de fiscalização
                    </h4>
                    <div className="space-y-4">
                      {FIELD_INSPECTION_CHECKLIST.map((section) => {
                        const items = checklist.filter(
                          (r) => r.sectionId === section.id,
                        );
                        if (items.length === 0) return null;
                        return (
                          <div key={section.id} className="space-y-2">
                            <p className="text-sm font-medium text-foreground">
                              {section.title}
                            </p>
                            <ul className="space-y-2">
                              {items.map((item) => (
                                <li
                                  key={`${item.sectionId}:${item.itemId}`}
                                  className="p-3 border rounded-md text-sm space-y-1"
                                >
                                  <p>{item.label}</p>
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <Badge variant="outline">
                                      {CHECKLIST_STATUS_LABELS[item.status]}
                                    </Badge>
                                    {item.criticality && (
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          inconformidadeCriticalityBadgeClass(
                                            item.criticality,
                                          ),
                                        )}
                                      >
                                        {item.criticality}
                                      </Badge>
                                    )}
                                  </div>
                                  {item.observations?.trim() && (
                                    <p className="text-muted-foreground">
                                      {item.observations}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
              {viewingItem.teamObservations?.trim() && (
                <>
                  <Separator />
                  <h4 className="font-semibold text-foreground">
                    Observações gerais da equipe
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {viewingItem.teamObservations}
                  </p>
                </>
              )}
              {(viewingItem.laudoAttachmentUrls?.length ?? 0) > 0 && (
                <>
                  <Separator />
                  <h4 className="font-semibold text-foreground">
                    Registros e documentos adicionais
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {viewingItem.laudoAttachmentUrls!.map((url, index) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline break-all"
                        >
                          Anexo {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <Separator />
              <h4 className="font-semibold text-foreground">
                Inconformidades Registradas
              </h4>
              {viewingItem.inconformidades?.length > 0 ? (
                <ul className="space-y-3">
                  {viewingItem.inconformidades.map((item, index) => (
                    <li key={index} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start">
                        <p className="text-sm flex-1 mr-4">
                          {item.description}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            inconformidadeCriticalityBadgeClass(item.criticality),
                          )}
                        >
                          {item.criticality}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma inconformidade registrada.
                </p>
              )}
              {viewingItem.signatureUrl && (
                <>
                  <Separator />
                  <h4 className="font-semibold text-foreground">Assinatura</h4>
                  <div className="p-2 border rounded-md bg-muted flex justify-center">
                    <Image
                      src={viewingItem.signatureUrl}
                      alt="Assinatura"
                      width={320}
                      height={120}
                      className="max-w-xs h-auto"
                    />
                  </div>
                </>
              )}
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
              o registro da vistoria.
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
