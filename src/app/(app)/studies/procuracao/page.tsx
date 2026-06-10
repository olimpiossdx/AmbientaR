'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  FileText,
  Pencil,
  Trash2,
  Eye,
  Upload,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc, limit, query, updateDoc } from 'firebase/firestore';
import type { Procuracao } from '@/lib/types';
import { sortByFirestoreUpdatedAt } from '@/lib/firestore-list-helpers';
import { isAdminOrSupervisorRole } from '@/lib/role-guards';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDateBr } from '@/lib/br-format';
import { useLocalBranding } from '@/hooks/use-local-branding';
import { persistProcuracaoPdfForSignature } from '@/lib/persist-procuracao-pdf';
import { procuracaoPdfBlob } from './procuracao-pdf';
import { guardBrandingExportFromHook } from '@/lib/pdf-branding-layout';
import { UploadPreparationDialog } from '@/components/shared/upload-preparation-dialog';
import { useStorageFileUpload } from '@/hooks/use-storage-file-upload';
import { AttachmentPreviewSection } from '@/components/shared/attachment-preview-section';
import { formatEmpreendimentosList } from '@/lib/procuracao/format-procuracao';

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
  </div>
);

function getEmpreendimentosLabel(item: Procuracao): string {
  if (!item.empreendimentos?.length) return 'Sem empreendimento';
  if (item.empreendimentos.length === 1) return item.empreendimentos[0].nome;
  return `${item.empreendimentos.length} empreendimentos`;
}

export default function ProcuracaoListPage() {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToView, setItemToView] = useState<Procuracao | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [uploadingItem, setUploadingItem] = useState<Procuracao | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { uploadFile, dialogProps } = useStorageFileUpload({
    storageFolder: 'signed-procuracoes',
    buildStoragePath: (_file, safe) => {
      if (!uploadingItem) throw new Error('Procuração não selecionada.');
      return `signed-procuracoes/${uploadingItem.id}/${Date.now()}-${safe}`;
    },
  });

  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  const docsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'procuracoes'), limit(200));
  }, [firestore, user]);

  const { data: itemsRaw, isLoading } = useCollection<Procuracao>(docsQuery);
  const items = useMemo(
    () => sortByFirestoreUpdatedAt(itemsRaw ?? []),
    [itemsRaw],
  );

  const { draftItems, awaitingSignature, signedItems } = useMemo(() => {
    const drafts = items.filter((p) => p.status !== 'Aprovado' && p.status !== 'Assinada');
    const awaiting = items.filter(
      (p) => p.status === 'Aprovado' && !p.fileUrl,
    );
    const signed = items.filter((p) => p.fileUrl || p.status === 'Assinada');
    return { draftItems: drafts, awaitingSignature: awaiting, signedItems: signed };
  }, [items]);

  const handleAddNew = () => router.push('/studies/procuracao/new');
  const handleEdit = (item: Procuracao) =>
    router.push(`/studies/procuracao/${item.id}/edit`);

  const handleView = (item: Procuracao) => {
    setItemToView(item);
    setIsViewOpen(true);
  };

  const handleOpenUpload = (item: Procuracao) => {
    setUploadingItem(item);
    setIsUploadOpen(true);
    setFileToUpload(null);
  };

  const handleFileUpload = async () => {
    if (!fileToUpload || !uploadingItem || !firestore) return;
    setIsUploading(true);
    try {
      const downloadUrl = await uploadFile(fileToUpload);
      if (!downloadUrl) return;
      await updateDoc(doc(firestore, 'procuracoes', uploadingItem.id), {
        fileUrl: downloadUrl,
        status: 'Assinada',
      });
      toast({
        title: 'Upload concluído',
        description: 'A procuração assinada foi anexada com sucesso.',
      });
      setIsUploadOpen(false);
      setFileToUpload(null);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleApprove = async (item: Procuracao) => {
    if (!firestore) return;
    setApprovingId(item.id);
    try {
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
      const proc: Procuracao = { ...item, status: 'Aprovado' };
      await updateDoc(doc(firestore, 'procuracoes', item.id), { status: 'Aprovado' });
      await persistProcuracaoPdfForSignature(
        firestore,
        item.id,
        proc,
        brandingData,
        pdfImages,
      );
      toast({
        title: 'Procuração aprovada',
        description: 'O PDF para assinatura foi gerado e está disponível para download.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao aprovar',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível aprovar ou gerar o PDF.',
      });
    } finally {
      setApprovingId(null);
    }
  };

  const handleExportPdf = useCallback(
    async (item: Procuracao, options?: { persist?: boolean }) => {
      if (!firestore) return;
      setPdfBusyId(item.id);
      try {
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
        if (options?.persist) {
          await persistProcuracaoPdfForSignature(
            firestore,
            item.id,
            item,
            brandingData,
            pdfImages,
          );
          toast({
            title: 'PDF atualizado',
            description: 'O documento para assinatura foi salvo no Storage.',
          });
        } else {
          const blob = await procuracaoPdfBlob(item, brandingData, {
            preloadedImages: pdfImages,
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Procuracao_${item.outorgante?.nome?.replace(/\s+/g, '_') ?? 'documento'}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Erro ao gerar PDF',
          description: 'Tente novamente ou verifique a identidade visual.',
        });
      } finally {
        setPdfBusyId(null);
      }
    },
    [brandingData, firestore, hasBrandingUrls, isPdfImagesLoading, pdfImages, toast],
  );

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    deleteDoc(doc(firestore, 'procuracoes', itemToDelete))
      .then(() => {
        toast({ title: 'Procuração removida', description: 'O registro foi excluído.' });
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const canDelete = (item: Procuracao) => {
    if (!user) return false;
    if (isAdminOrSupervisorRole(user.role)) return true;
    return item.status === 'Rascunho' || !item.status;
  };

  const renderPdfActions = (item: Procuracao, showPersist: boolean) => {
    const busy = pdfBusyId === item.id;
    return (
      <>
        {item.contractPdfUrl ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                <a
                  href={item.contractPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="sr-only">Baixar para assinatura</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Baixar PDF para assinatura</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              type="button"
              disabled={busy}
              onClick={() =>
                handleExportPdf(item, showPersist ? { persist: true } : undefined)
              }
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span className="sr-only">Exportar PDF</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{item.contractPdfUrl ? 'Regenerar PDF' : 'Exportar PDF'}</p>
          </TooltipContent>
        </Tooltip>
      </>
    );
  };

  const renderRow = (
    item: Procuracao,
    options: { showApprove: boolean; showUpload: boolean },
  ) => (
    <TableRow key={item.id}>
      <TableCell className="font-medium">{item.outorgante?.nome}</TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground">
        {getEmpreendimentosLabel(item)}
      </TableCell>
      <TableCell>
        <Badge
          variant={
            item.status === 'Assinada' || item.fileUrl ? 'default' : 'secondary'
          }
          className={cn(
            (item.status === 'Aprovado' || item.status === 'Assinada') &&
              'bg-green-500/20 text-green-700',
          )}
        >
          {item.fileUrl
            ? 'Assinada'
            : item.status === 'Aprovado'
              ? 'Aguardando assinatura'
              : item.status || 'Rascunho'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleView(item)}
              >
                <Eye className="h-4 w-4" />
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
                className="h-8 w-8"
                onClick={() => handleEdit(item)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
          {options.showApprove && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600"
                  disabled={approvingId === item.id}
                  onClick={() => handleApprove(item)}
                >
                  {approvingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aprovar e gerar PDF para assinatura</p>
              </TooltipContent>
            </Tooltip>
          )}
          {(options.showApprove || item.status === 'Aprovado') &&
            renderPdfActions(item, item.status === 'Aprovado')}
          {options.showUpload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleOpenUpload(item)}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload da procuração assinada</p>
              </TooltipContent>
            </Tooltip>
          )}
          {canDelete(item) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => openDeleteConfirm(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Procuração">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Nova procuração
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Em elaboração</CardTitle>
              <CardDescription>
                Rascunhos da procuração de representação do empreendedor e empreendimento(s).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outorgante</TableHead>
                      <TableHead className="hidden md:table-cell">Empreendimento(s)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 2 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={4}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoading &&
                      draftItems.map((item) =>
                        renderRow(item, { showApprove: true, showUpload: false }),
                      )}
                    {!isLoading && draftItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Nenhuma procuração em elaboração.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Para assinatura</CardTitle>
              <CardDescription>
                Procurações aprovadas com PDF gerado. Baixe, assine e faça upload da versão
                assinada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outorgante</TableHead>
                      <TableHead className="hidden md:table-cell">Empreendimento(s)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isLoading &&
                      awaitingSignature.map((item) =>
                        renderRow(item, { showApprove: false, showUpload: true }),
                      )}
                    {!isLoading && awaitingSignature.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Nenhuma procuração aguardando assinatura.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assinadas</CardTitle>
              <CardDescription>Procurações com versão assinada anexada.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outorgante</TableHead>
                      <TableHead className="hidden md:table-cell">Empreendimento(s)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isLoading &&
                      signedItems.map((item) =>
                        renderRow(item, { showApprove: false, showUpload: true }),
                      )}
                    {!isLoading && signedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Nenhuma procuração assinada registrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Procuração — {itemToView?.outorgante?.nome}</DialogTitle>
            <DialogDescription>
              Mandato de representação perante órgãos ambientais.
            </DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <DetailItem label="Outorgante" value={itemToView.outorgante?.nome} />
              <DetailItem
                label="CPF/CNPJ"
                value={itemToView.outorgante?.cpfCnpj}
              />
              <DetailItem
                label="Empresa outorgada"
                value={itemToView.outorgado?.companyName}
              />
              <DetailItem
                label="Procuradores"
                value={itemToView.outorgado?.procuradores
                  ?.map((p) => p.name)
                  .join(', ')}
              />
              <DetailItem
                label="Empreendimento(s)"
                value={formatEmpreendimentosList(itemToView.empreendimentos ?? [])}
              />
              <DetailItem
                label="Data"
                value={formatDateBr(itemToView.dataDocumento)}
              />
              <DetailItem label="Local" value={itemToView.localDocumento} />
              <Separator />
              <AttachmentPreviewSection
                fileUrl={itemToView.contractPdfUrl}
                sectionLabel="PDF para assinatura"
                emptyLabel="PDF ainda não gerado. Aprove o rascunho para gerar."
                zoomTitle="Procuração para assinatura"
                zoomDescription="Documento gerado a partir dos dados cadastrados."
              />
              <AttachmentPreviewSection
                fileUrl={itemToView.fileUrl}
                sectionLabel="Procuração assinada"
                emptyLabel="Nenhuma versão assinada anexada."
                zoomTitle="Procuração assinada"
                zoomDescription="Versão assinada enviada após aprovação."
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

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload da procuração assinada</DialogTitle>
            <DialogDescription>
              Anexe o PDF assinado de {uploadingItem?.outorgante?.nome ?? '—'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="signed-procuracao-file">Arquivo (PDF)</Label>
            <Input
              id="signed-procuracao-file"
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
              {isUploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UploadPreparationDialog {...dialogProps} />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir procuração?</AlertDialogTitle>
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
    </>
  );
}
