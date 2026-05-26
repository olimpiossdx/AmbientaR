'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, deleteDoc, doc, limit, query, updateDoc } from 'firebase/firestore';
import type { DocxTemplateSlug } from '@/lib/docx-template-slugs';
import type { Empreendedor } from '@/lib/types';
import { isAdminOrSupervisorRole } from '@/lib/role-guards';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { TermosReferenciaCard } from '@/components/termos-referencia-card';
import { isStudyLinkedToTr } from '@/lib/termos-referencia-study-folders';
import { StudyDocumentRowActions } from '@/components/studies/study-document-row-actions';
import { StudyBrandedExportButtons } from '@/components/studies/study-branded-export-buttons';
import {
  getStudyDocEmpreendimentoNome,
  getStudyDocRequerenteNome,
  type StudyFirestoreDocument,
} from '@/lib/studies/study-document-record';
import {
  STUDY_EXPORT_TEMPLATE_LABEL,
  type StudyExportRecord,
} from '@/lib/studies/study-export-record';

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
  </div>
);

export type StudyDocumentsListPageProps = {
  collectionName: string;
  templateSlug: DocxTemplateSlug;
  studySlug: string;
  studyLabel: string;
  pageTitle: string;
  addButtonLabel: string;
  newHref: string;
  editHref: (id: string) => string;
  draftCardTitle: string;
  approvedCardTitle: string;
  emptyDraft: string;
  emptyApproved: string;
  viewDialogDescription: string;
};

export function StudyDocumentsListPage({
  collectionName,
  templateSlug,
  studySlug,
  studyLabel,
  pageTitle,
  addButtonLabel,
  newHref,
  editHref,
  draftCardTitle,
  approvedCardTitle,
  emptyDraft,
  emptyApproved,
  viewDialogDescription,
}: StudyDocumentsListPageProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<StudyFirestoreDocument | null>(null);
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const docsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, collectionName), limit(200));
  }, [firestore, user, collectionName]);

  const { data: items, isLoading } = useCollection<StudyFirestoreDocument>(docsQuery);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = useMemo(
    () => new Map(empreendedores?.map((e) => [e.id, e.name])),
    [empreendedores],
  );

  const { draftItems, approvedItems } = useMemo(() => {
    if (!items) return { draftItems: [], approvedItems: [] };
    const drafts = items.filter((p) => p.status !== 'Aprovado');
    const approved = items.filter((p) => p.status === 'Aprovado');
    return { draftItems: drafts, approvedItems: approved };
  }, [items]);

  const exportLabel = STUDY_EXPORT_TEMPLATE_LABEL[templateSlug] ?? studyLabel;

  const handleAddNew = () => router.push(newHref);

  const handleEdit = (item: StudyFirestoreDocument) => router.push(editHref(item.id));

  const handleView = (item: StudyFirestoreDocument) => {
    setItemToView(item);
    setIsViewOpen(true);
  };

  const handleApprove = async (itemId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, collectionName, itemId);
    try {
      await updateDoc(docRef, { status: 'Aprovado' });
      toast({
        title: `${exportLabel} aprovado`,
        description: 'O estudo foi movido para a lista de aprovados.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao aprovar',
        description: 'Não foi possível atualizar o status.',
      });
    }
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, collectionName, itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: `${exportLabel} removido`,
          description: 'O registro foi excluído com sucesso.',
        });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const canDelete = (item: StudyFirestoreDocument) => {
    if (!user) return false;
    if (isAdminOrSupervisorRole(user.role)) return true;
    return item.status === 'Rascunho' || !item.status;
  };

  const renderRow = (
    item: StudyFirestoreDocument,
    options: { showApprove: boolean },
  ) => (
    <TableRow key={item.id}>
      <TableCell className="font-medium">{getStudyDocEmpreendimentoNome(item)}</TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground">
        {getStudyDocRequerenteNome(item, empreendedoresMap)}
      </TableCell>
      <TableCell>
        <Badge
          variant={item.status === 'Aprovado' ? 'default' : 'secondary'}
          className={cn(item.status === 'Aprovado' && 'bg-green-500/20 text-green-700')}
        >
          {item.status || 'Rascunho'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <StudyDocumentRowActions
          item={item as StudyExportRecord}
          templateSlug={templateSlug}
          onView={handleView}
          onEdit={handleEdit}
          onApprove={options.showApprove ? handleApprove : undefined}
          onDelete={openDeleteConfirm}
          canDelete={canDelete(item)}
          showApprove={options.showApprove}
        />
      </TableCell>
    </TableRow>
  );

  const loadingRows = (isLoading || isLoadingEmpreendedores) && (
    <>
      {Array.from({ length: 2 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-5 w-32" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-5 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20 rounded-full" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-32" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title={pageTitle}>
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            {addButtonLabel}
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          {isStudyLinkedToTr(studySlug) && (
            <TermosReferenciaCard studySlug={studySlug} studyLabel={studyLabel} />
          )}

          <Card>
            <CardHeader>
              <CardTitle>{draftCardTitle}</CardTitle>
              <CardDescription>Rascunhos e estudos em elaboração.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden md:table-cell">Requerente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingRows}
                    {!isLoading &&
                      !isLoadingEmpreendedores &&
                      draftItems.map((item) => renderRow(item, { showApprove: true }))}
                    {!isLoading && draftItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          {emptyDraft}
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
              <CardTitle>{approvedCardTitle}</CardTitle>
              <CardDescription>Estudos finalizados e aprovados.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden md:table-cell">Requerente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && loadingRows}
                    {!isLoading &&
                      approvedItems.map((item) => renderRow(item, { showApprove: false }))}
                    {!isLoading && approvedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          {emptyApproved}
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
            <DialogTitle>{itemToView ? getStudyDocEmpreendimentoNome(itemToView) : ''}</DialogTitle>
            <DialogDescription>{viewDialogDescription}</DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <DetailItem
                label="Requerente"
                value={getStudyDocRequerenteNome(itemToView, empreendedoresMap)}
              />
              <DetailItem
                label="Empreendimento"
                value={getStudyDocEmpreendimentoNome(itemToView)}
              />
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Exportar documento</Label>
                <StudyBrandedExportButtons
                  record={itemToView}
                  templateSlug={templateSlug}
                />
              </div>
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
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O estudo será removido permanentemente.
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
