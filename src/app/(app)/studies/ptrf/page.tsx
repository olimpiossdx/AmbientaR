'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { StudyDocumentRowActions } from '@/components/studies/study-document-row-actions';
import { StudyBrandedExportButtons } from '@/components/studies/study-branded-export-buttons';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { PTRF, AppUser } from '@/lib/types';
import { isAdminOrSupervisorRole } from '@/lib/role-guards';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { useAuth } from '@/firebase';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useStudyListEntityFilter } from '@/hooks/use-study-list-entity-filter';
import { StudyListEntityFilterCard } from '@/components/studies/study-list-entity-filter-card';

const DetailItem = ({ label, value }: { label: string, value?: string | null | string[] }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{Array.isArray(value) ? value.join(', ') : (value || 'Não informado')}</p>
    </div>
);


export default function PtrfPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<PTRF | null>(null);
  const router = useRouter();

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const ptrfsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'ptrfs');
  }, [firestore, user]);

  const { data: ptrfs, isLoading } = useCollection<PTRF>(ptrfsQuery);

  const {
    filterEmpreendedorId,
    setFilterEmpreendedorId,
    filterProjectId,
    setFilterProjectId,
    filtered: filteredPtrfs,
  } = useStudyListEntityFilter(ptrfs);

  const { draftPtrfs, approvedPtrfs } = useMemo(() => {
    const drafts = filteredPtrfs.filter(p => p.status !== 'Aprovado');
    const approved = filteredPtrfs.filter(p => p.status === 'Aprovado');
    return { draftPtrfs: drafts, approvedPtrfs: approved };
  }, [filteredPtrfs]);


  const handleAddNew = () => {
    router.push('/studies/ptrf/new');
  };

  const handleEdit = (item: PTRF) => {
    router.push(`/studies/ptrf/${item.id}/edit`);
  };

  const handleView = (item: PTRF) => {
    setItemToView(item);
    setIsViewOpen(true);
  };

  const handleApprove = async (ptrfId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'ptrfs', ptrfId);
    try {
        await updateDoc(docRef, { status: 'Aprovado' });
        toast({ title: "PTRF Aprovado", description: "O plano foi movido para a lista de aprovados." });
    } catch (error) {
        console.error("Error approving PTRF:", error);
        toast({ variant: "destructive", title: "Erro ao Aprovar", description: "Não foi possível atualizar o status do PTRF." });
    }
  }


  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'ptrfs', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'PTRF deletado',
          description: 'O formulário PTRF foi removido com sucesso.',
        });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: 'Erro ao excluir PTRF',
          context: {
          path: docRef.path,
          operation: 'delete',
        },
        }),
      )
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const canDelete = (item: PTRF) => {
    if(!user) return false;
    if (isAdminOrSupervisorRole(user.role)) return true;
    if (item.status === 'Rascunho') return true;
    return false;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Projetos Técnicos de Recomposição de Flora (PTRF)">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Adicionar PTRF
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <StudyListEntityFilterCard
            empreendedorId={filterEmpreendedorId}
            projectId={filterProjectId}
            onEmpreendedorIdChange={setFilterEmpreendedorId}
            onProjectIdChange={setFilterProjectId}
          />
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de PTRFs</CardTitle>
              <CardDescription>Acompanhe, adicione e edite os formulários PTRF em elaboração.</CardDescription>
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
                    {isLoading &&
                      Array.from({ length: 2 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && draftPtrfs.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{item.requerente.nome}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'Aprovado' ? 'default' : 'secondary'} className={cn(item.status === 'Aprovado' && 'bg-green-500/20 text-green-700')}>
                            {item.status || 'Rascunho'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <StudyDocumentRowActions
                            item={item}
                            templateSlug="ptrf"
                            onView={handleView}
                            onEdit={handleEdit}
                            onApprove={handleApprove}
                            onDelete={openDeleteConfirm}
                            canDelete={canDelete(item)}
                            showApprove
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && draftPtrfs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum PTRF em elaboração.
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
              <CardTitle>PTRFs Aprovados</CardTitle>
              <CardDescription>Lista de PTRFs que foram finalizados e aprovados.</CardDescription>
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
                    {isLoading &&
                      Array.from({ length: 1 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && approvedPtrfs.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{item.requerente.nome}</TableCell>
                        <TableCell>
                           <Badge variant={'outline'} className={cn('bg-green-500/20 text-green-700')}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <StudyDocumentRowActions
                            item={item}
                            templateSlug="ptrf"
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={
                              isAdminOrSupervisorRole(user?.role)
                                ? openDeleteConfirm
                                : undefined
                            }
                            canDelete={canDelete(item)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && approvedPtrfs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum PTRF aprovado.
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
            <DialogTitle>{itemToView?.empreendimento.nome}</DialogTitle>
            <DialogDescription>Detalhes do Projeto Técnico de Recomposição de Flora.</DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <DetailItem label="Requerente" value={itemToView.requerente.nome} />
              <DetailItem label="Empreendimento" value={itemToView.empreendimento.nome} />
              <DetailItem label="Nº CAR" value={itemToView.empreendimento.car} />
              <Separator />
              <h4 className="font-semibold text-foreground">Objetivo</h4>
              <p className="text-sm text-muted-foreground">{itemToView.objetivoDescricao || "Nenhuma descrição de objetivo fornecida."}</p>
              <Separator />
               <h4 className="font-semibold text-foreground">Responsável Técnico</h4>
              <DetailItem label="Nome" value={itemToView.responsavelTecnico.nome} />
              <DetailItem label="Formação" value={itemToView.responsavelTecnico.formacao} />
              <DetailItem label="Registro" value={itemToView.responsavelTecnico.registroConselho} />
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Exportar documento</Label>
                <StudyBrandedExportButtons record={itemToView} templateSlug="ptrf" />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o formulário PTRF.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
