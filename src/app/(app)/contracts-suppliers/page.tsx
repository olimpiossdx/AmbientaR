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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSearchInput } from "@/components/card-search-input";
import { useToast } from "@/hooks/use-toast";
import {
  useAuth,
  useCollection,
  useFirebase,
  useMemoFirebase,
  errorEmitter,
} from "@/firebase";
import { collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import type { SupplierContract, AppUser } from "@/lib/types";
import { FirestorePermissionError } from "@/firebase/errors";
import { CheckCircle, Download, Eye, Loader2, Pencil, PlusCircle, Trash2, Upload } from "lucide-react";
import { SupplierContractForm } from "./supplier-contract-form";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { generateSupplierContractPdf } from "./supplier-contract-pdf";
import { guardBrandingExportFromHook } from "@/lib/pdf-branding-layout";
import { useLocalBranding } from "@/hooks/use-local-branding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium">{label}</p>
    <p className="text-sm text-muted-foreground">{value || "Não informado"}</p>
  </div>
);

import { canWriteContractsCommercial } from "@/lib/role-guards";

const canWrite = (user: AppUser | null) =>
  Boolean(user && canWriteContractsCommercial(user.role));

export default function ContractsSuppliersPage() {
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadFile, dialogProps } = useStorageFileUpload({
    storageFolder: "supplier-contracts",
    buildStoragePath: (_file, safe) => {
      if (!uploadingItem) throw new Error("Contrato não selecionado.");
      return `supplier-contracts/signed/${uploadingItem.id}/${Date.now()}-${safe}`;
    },
  });
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [uploadingItem, setUploadingItem] = React.useState<SupplierContract | null>(null);
  const [fileToUpload, setFileToUpload] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<SupplierContract | null>(null);
  const [viewingItem, setViewingItem] = React.useState<SupplierContract | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);

  const contractsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "supplierContracts") : null),
    [firestore],
  );
  const { data: contracts, isLoading } = useCollection<SupplierContract>(contractsQuery);

  const filteredContracts = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = contracts || [];
    const termFiltered = !term
      ? base
      : base.filter((item) => {
      const itensText = (item.objeto?.itens || [])
        .map((i) => i.descricao)
        .join(" ");
      return (
        (item.contractNumber || "").toLowerCase().includes(term) ||
        (item.contratante?.nome || "").toLowerCase().includes(term) ||
        (item.prestador?.nome || "").toLowerCase().includes(term) ||
        (item.objeto?.servicos || "").toLowerCase().includes(term) ||
        itensText.toLowerCase().includes(term)
      );
    });
    return [...termFiltered].sort((a, b) =>
      (a.contractNumber || "").localeCompare(b.contractNumber || "", "pt-BR", {
        sensitivity: "base",
      }),
    );
  }, [contracts, searchTerm]);
  const draftContracts = React.useMemo(
    () => filteredContracts.filter((c) => c.status !== "Aprovado"),
    [filteredContracts],
  );
  const approvedContracts = React.useMemo(
    () => filteredContracts.filter((c) => c.status === "Aprovado"),
    [filteredContracts],
  );

  const openCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: SupplierContract) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const openView = (item: SupplierContract) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const openDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteOpen(true);
  };
  const openUpload = (item: SupplierContract) => {
    setUploadingItem(item);
    setFileToUpload(null);
    setIsUploadOpen(true);
  };

  const handleDelete = async () => {
    if (!firestore || !itemToDelete) return;
    const ref = doc(firestore, "supplierContracts", itemToDelete);
    try {
      await deleteDoc(ref);
      toast({ title: "Contrato removido com sucesso." });
    } catch (error) {
      const permissionError = new FirestorePermissionError({
        path: ref.path,
        operation: "delete",
      });
      errorEmitter.emit("permission-error", permissionError);
    } finally {
      setIsDeleteOpen(false);
      setItemToDelete(null);
    }
  };
  const handleApprove = async (id: string) => {
    if (!firestore) return;
    const ref = doc(firestore, "supplierContracts", id);
    try {
      await updateDoc(ref, { status: "Aprovado" });
      toast({
        title: "Contrato aprovado",
        description: "O contrato foi movido para a lista de finalizados.",
      });
    } catch (error) {
      const permissionError = new FirestorePermissionError({
        path: ref.path,
        operation: "update",
        requestResourceData: { status: "Aprovado" },
      });
      errorEmitter.emit("permission-error", permissionError);
    }
  };

  const handleFileUpload = async () => {
    if (!fileToUpload || !uploadingItem || !firestore) return;
    setIsUploading(true);
    try {
      const downloadUrl = await uploadFile(fileToUpload);
      if (!downloadUrl) return;
      await updateDoc(doc(firestore, "supplierContracts", uploadingItem.id), {
        fileUrl: downloadUrl,
      });
      toast({
        title: "Upload concluído",
        description: "O contrato assinado foi anexado com sucesso.",
      });
      setIsUploadOpen(false);
      setFileToUpload(null);
      setUploadingItem(null);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportPdf = async (item: SupplierContract) => {
    if (
      !guardBrandingExportFromHook({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
      })
    ) {
      return;
    }
    try {
      await generateSupplierContractPdf(item, brandingData, {
        preloadedImages: pdfImages,
        onBrandingIssue: toast,
      });
      toast({ title: "PDF do contrato gerado com sucesso." });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF do contrato.",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Contratos-Fornecedores">
          {canWrite(user) && (
            <Button size="sm" className="gap-1" onClick={openCreate}>
              <PlusCircle className="h-4 w-4" />
              Novo Contrato
            </Button>
          )}
        </PageHeader>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Contratos em gerenciamento</CardTitle>
              <CardDescription>
                Contratante preenchida por Configurações &gt; Informações da Empresa e
                prestador selecionado de Financeiro &gt; Fornecedores.
              </CardDescription>
              <CardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar número, contratante, prestador, serviço..."
              />
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!isLoading &&
                    draftContracts.map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {item.contractNumber}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {item.contratante?.nome ?? "—"}
                                {item.prestador?.nome ? ` · ${item.prestador.nome}` : ""}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(item.dataContrato).toLocaleDateString("pt-BR")} ·{" "}
                                {Number(item.pagamento?.valorTotal || 0).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                              <Badge variant="outline" className="w-fit">
                                {item.status}
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
                                    onClick={() => openView(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Ver</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    type="button"
                                    onClick={() => handleExportPdf(item)}
                                  >
                                    <Download className="h-4 w-4" />
                                    <span className="sr-only">PDF</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Gerar PDF</p>
                                </TooltipContent>
                              </Tooltip>
                              {canWrite(user) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() => handleApprove(item.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <span className="sr-only">Aprovar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Aprovar contrato</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {canWrite(user) && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        type="button"
                                        onClick={() => openEdit(item)}
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
                                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                        type="button"
                                        onClick={() => openDelete(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Apagar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Apagar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && draftContracts.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhum contrato em gerenciamento para o filtro atual.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Contratos finalizados</CardTitle>
              <CardDescription>
                Contratos aprovados e anexos assinados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!isLoading &&
                    approvedContracts.map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {item.contractNumber}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {item.contratante?.nome ?? "—"}
                                {item.prestador?.nome ? ` · ${item.prestador.nome}` : ""}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(item.dataContrato).toLocaleDateString("pt-BR")} ·{" "}
                                {Number(item.pagamento?.valorTotal || 0).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                              <Badge variant="outline" className="w-fit">
                                {item.status}
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
                                    onClick={() => openView(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Ver</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    type="button"
                                    onClick={() => handleExportPdf(item)}
                                  >
                                    <Download className="h-4 w-4" />
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
                                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4 text-blue-600" />
                                        <span className="sr-only">Anexo assinado</span>
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Abrir contrato assinado</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : canWrite(user) ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() => openUpload(item)}
                                    >
                                      <Upload className="h-4 w-4" />
                                      <span className="sr-only">Enviar assinado</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Enviar PDF assinado</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
                              {canWrite(user) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                      type="button"
                                      onClick={() => openDelete(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Apagar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Apagar</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && approvedContracts.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhum contrato finalizado para o filtro atual.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl h-full max-h-[95dvh] overflow-y-auto">
          <SupplierContractForm
            currentItem={editingItem}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingItem(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{viewingItem?.contractNumber || "Contrato"}</DialogTitle>
            <DialogDescription>
              Detalhes do contrato de prestação de serviços com fornecedor.
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4">
              <DetailItem label="Contratante" value={viewingItem.contratante?.nome} />
              <DetailItem label="Prestador" value={viewingItem.prestador?.nome} />
              <DetailItem label="CPF/CNPJ Prestador" value={viewingItem.prestador?.cpfCnpj} />
              <DetailItem label="Descrição geral" value={viewingItem.objeto?.servicos} />
              {viewingItem.objeto?.itens && viewingItem.objeto.itens.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Itens contratados</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {viewingItem.objeto.itens.map((item, index) => (
                      <li key={index}>
                        {item.descricao} —{" "}
                        {Number(item.valor || 0).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <DetailItem
                label="Valor Total"
                value={Number(viewingItem.pagamento?.valorTotal || 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              />
              <DetailItem
                label="Valor por extenso"
                value={viewingItem.pagamento?.valorExtenso}
              />
              <DetailItem label="Forma de Pagamento" value={viewingItem.pagamento?.forma} />
              <DetailItem
                label="Data do Contrato"
                value={new Date(viewingItem.dataContrato).toLocaleDateString("pt-BR")}
              />
              <AttachmentPreviewSection
                fileUrl={viewingItem.fileUrl}
                sectionLabel="Contrato assinado (PDF)"
                emptyLabel="Nenhum arquivo anexado."
                zoomTitle="Anexo do contrato"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja excluir este contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de contrato assinado</DialogTitle>
            <DialogDescription>
              Anexe o PDF assinado para {uploadingItem?.prestador?.nome}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3">
            <Label htmlFor="signed-supplier-contract-file">Arquivo PDF</Label>
            <Input
              id="signed-supplier-contract-file"
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
            <Button onClick={handleFileUpload} disabled={!fileToUpload || isUploading}>
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UploadPreparationDialog {...dialogProps} />
    </>
  );
}

