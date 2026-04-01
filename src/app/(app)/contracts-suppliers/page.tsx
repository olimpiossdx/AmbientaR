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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { generateSupplierContractPdf } from "./supplier-contract-pdf";
import { useLocalBranding } from "@/hooks/use-local-branding";
import { fetchBrandingImageAsBase64 } from "@/lib/branding-pdf";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium">{label}</p>
    <p className="text-sm text-muted-foreground">{value || "Não informado"}</p>
  </div>
);

const canWrite = (user: AppUser | null) =>
  !!user &&
  (user.role === "admin" ||
    user.role === "financial" ||
    user.role === "supervisor" ||
    user.role === "sales");

export default function ContractsSuppliersPage() {
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: brandingData } = useLocalBranding();

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
      return (
        (item.contractNumber || "").toLowerCase().includes(term) ||
        (item.contratante?.nome || "").toLowerCase().includes(term) ||
        (item.prestador?.nome || "").toLowerCase().includes(term) ||
        (item.objeto?.servicos || "").toLowerCase().includes(term)
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
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `supplier-contracts/signed/${uploadingItem.id}/${fileToUpload.name}`,
      );
      await uploadBytes(storageRef, fileToUpload);
      const downloadUrl = await getDownloadURL(storageRef);
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
    try {
      await generateSupplierContractPdf(
        item,
        brandingData,
        fetchBrandingImageAsBase64,
      );
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Contrato</TableHead>
                    <TableHead>Contratante</TableHead>
                    <TableHead>Prestador</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="hidden md:table-cell">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading &&
                    draftContracts.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.contractNumber}</TableCell>
                        <TableCell>{item.contratante?.nome}</TableCell>
                        <TableCell>{item.prestador?.nome}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(item.dataContrato).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {Number(item.pagamento?.valorTotal || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openView(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExportPdf(item)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canWrite(user) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(item.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {canWrite(user) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => openDelete(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && draftContracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Nenhum contrato em gerenciamento para o filtro atual.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Contrato</TableHead>
                    <TableHead>Contratante</TableHead>
                    <TableHead>Prestador</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="hidden md:table-cell">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading &&
                    approvedContracts.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.contractNumber}</TableCell>
                        <TableCell>{item.contratante?.nome}</TableCell>
                        <TableCell>{item.prestador?.nome}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(item.dataContrato).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {Number(item.pagamento?.valorTotal || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openView(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExportPdf(item)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {item.fileUrl ? (
                              <Button asChild variant="ghost" size="icon">
                                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 text-blue-600" />
                                </a>
                              </Button>
                            ) : canWrite(user) ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openUpload(item)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            ) : null}
                            {canWrite(user) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => openDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoading && approvedContracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Nenhum contrato finalizado para o filtro atual.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl h-full max-h-[95dvh] overflow-y-auto">
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
              <DetailItem label="Serviços" value={viewingItem.objeto?.servicos} />
              <DetailItem
                label="Valor Total"
                value={Number(viewingItem.pagamento?.valorTotal || 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              />
              <DetailItem label="Forma de Pagamento" value={viewingItem.pagamento?.forma} />
              <DetailItem
                label="Data do Contrato"
                value={new Date(viewingItem.dataContrato).toLocaleDateString("pt-BR")}
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
    </>
  );
}

