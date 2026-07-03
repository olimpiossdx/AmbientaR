
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
import { collection, doc, deleteDoc, updateDoc, limit, query } from 'firebase/firestore';
import type { EiaRima, AppUser, Empreendedor } from '@/lib/types';
import { isAdminOrSupervisorRole } from '@/lib/role-guards';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { useAuth } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
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

export function EiaRimaListView() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<EiaRima | null>(null);
  const router = useRouter();

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const eiaRimasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'eiaRimas'), limit(200));
  }, [firestore, user]);

  const { data: eiaRimas, isLoading } = useCollection<EiaRima>(eiaRimasQuery);

  const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = useMemo(() => new Map(empreendedores?.map(e => [e.id, e.name])), [empreendedores]);

  const {
    filterEmpreendedorId,
    setFilterEmpreendedorId,
    filterProjectId,
    setFilterProjectId,
    filtered: filteredEiaRimas,
  } = useStudyListEntityFilter(eiaRimas);

  const { draftItems, approvedItems } = useMemo(() => {
    const drafts = filteredEiaRimas.filter(p => p.status !== 'Aprovado');
    const approved = filteredEiaRimas.filter(p => p.status === 'Aprovado');
    return { draftItems: drafts, approvedItems: approved };
  }, [filteredEiaRimas]);

  const handleAddNew = () => {
    router.push('/studies/eia-rima/new');
  };

  const handleEdit = (item: EiaRima) => {
    router.push(`/studies/eia-rima/${item.id}/edit`);
  };

  const handleView = (item: EiaRima) => {
    setItemToView(item);
    setIsViewOpen(true);
  };
  
  const handleApprove = async (itemId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'eiaRimas', itemId);
    try {
        await updateDoc(docRef, { status: 'Aprovado' });
        toast({ title: "EIA/RIMA Aprovado", description: "O estudo foi movido para a lista de aprovados." });
    } catch (error) {
        console.error("Error approving EIA/RIMA:", error);
        toast({ variant: "destructive", title: "Erro ao Aprovar", description: "Não foi possível atualizar o status." });
    }
  };


  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'eiaRimas', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'EIA/RIMA deletado',
          description: 'O estudo foi removido com sucesso.',
        });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: 'Erro ao excluir estudo',
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
  
   const canDelete = (item: EiaRima) => {
    if(!user) return false;
    if (isAdminOrSupervisorRole(user.role)) return true;
    if (item.status === 'Rascunho') return true;
    return false;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Estudos de Impacto Ambiental (EIA/RIMA)">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Adicionar Estudo
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
              <CardTitle>EIA/RIMAs em Elaboração</CardTitle>
              <CardDescription>Acompanhe, adicione e edite os estudos em elaboração.</CardDescription>
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
                    {(isLoading || isLoadingEmpreendedores) &&
                      Array.from({ length: 2 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && draftItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{empreendedoresMap.get(item.requerente.clientId || '') || item.requerente.nome}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'Aprovado' ? 'default' : 'secondary'} className={cn(item.status === 'Aprovado' && 'bg-green-500/20 text-green-700')}>
                            {item.status || 'Rascunho'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <StudyDocumentRowActions
                            item={item}
                            templateSlug="eia-rima"
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
                    {!isLoading && draftItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum EIA/RIMA em elaboração.
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
              <CardTitle>EIA/RIMAs Aprovados</CardTitle>
              <CardDescription>Lista de estudos que foram finalizados e aprovados.</CardDescription>
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
                    {!isLoading && approvedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{empreendedoresMap.get(item.requerente.clientId || '') || item.requerente.nome}</TableCell>
                         <TableCell>
                           <Badge variant={'outline'} className={cn('bg-green-500/20 text-green-700')}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <StudyDocumentRowActions
                            item={item}
                            templateSlug="eia-rima"
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
                    {!isLoading && approvedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum EIA/RIMA aprovado.
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
            <DialogDescription>Detalhes do Estudo de Impacto Ambiental.</DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <DetailItem label="Requerente" value={empreendedoresMap.get(itemToView.requerente.clientId || '') || itemToView.requerente.nome} />
              <DetailItem label="Empreendimento" value={itemToView.empreendimento.nome} />
              <DetailItem label="Nº Processo" value={itemToView.processo} />
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Exportar documento</Label>
                <StudyBrandedExportButtons record={itemToView} templateSlug="eia-rima" />
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
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o estudo.
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

    