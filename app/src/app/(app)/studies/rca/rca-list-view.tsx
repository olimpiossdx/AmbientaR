
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirebase, useUser, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, limit, query } from 'firebase/firestore';
import { sortByFirestoreUpdatedAt } from '@/lib/firestore-list-helpers';
import type { RCA } from '@/lib/types';
import { isAdminOrSupervisorRole } from '@/lib/role-guards';
import { StudyDocumentRowActions } from '@/components/studies/study-document-row-actions';
import { StudyBrandedExportButtons } from '@/components/studies/study-branded-export-buttons';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
import { useToast } from '@/hooks/use-toast';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useStudyListEntityFilter } from '@/hooks/use-study-list-entity-filter';
import { StudyListEntityFilterCard } from '@/components/studies/study-list-entity-filter-card';

const DetailItem = ({ label, value }: { label: string, value?: string | null }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
    </div>
);


export function RcaListView() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<RCA | null>(null);

  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const rcasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'rcas'), limit(200));
  }, [firestore, user]);

  const { data: rcasRaw, isLoading } = useCollection<RCA>(rcasQuery);

  const rcas = useMemo(
    () => sortByFirestoreUpdatedAt(rcasRaw ?? []),
    [rcasRaw],
  );

  const {
    filterEmpreendedorId,
    setFilterEmpreendedorId,
    filterProjectId,
    setFilterProjectId,
    filtered: filteredRcas,
  } = useStudyListEntityFilter(rcas);

  const { draftRcas, approvedRcas } = useMemo(() => {
    const drafts = filteredRcas.filter((p) => p.status !== 'Aprovado');
    const approved = filteredRcas.filter((p) => p.status === 'Aprovado');
    return { draftRcas: drafts, approvedRcas: approved };
  }, [filteredRcas]);

  const handleAddNew = () => {
    router.push('/studies/rca/new');
  };

  const handleEdit = (item: RCA) => {
    router.push(`/studies/rca/${item.id}/edit`);
  };
  
  const handleView = (item: RCA) => {
    setItemToView(item);
    setIsViewOpen(true);
  };
  
  const handleApprove = async (rcaId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'rcas', rcaId);
    try {
        await updateDoc(docRef, { status: 'Aprovado' });
        toast({ title: "RCA Aprovado", description: "O relatório foi movido para a lista de aprovados." });
    } catch (error) {
        console.error("Error approving RCA:", error);
        toast({ variant: "destructive", title: "Erro ao Aprovar", description: "Não foi possível atualizar o status do RCA." });
    }
  };
  
  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'rcas', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'RCA deletado',
          description: 'O relatório foi removido com sucesso.',
        });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: 'Erro ao excluir RCA',
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
  
  const canDelete = (item: RCA) => {
    if(!user) return false;
    if (isAdminOrSupervisorRole(user.role)) return true;
    if (item.status === 'Rascunho') return true;
    return false;
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Relatórios de Controle Ambiental (RCA)">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Adicionar RCA
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
              <CardTitle>Gerenciamento de RCAs</CardTitle>
              <CardDescription>Acompanhe, adicione e edite os relatórios RCA em elaboração.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden md:table-cell">Empreendedor</TableHead>
                      <TableHead className="hidden lg:table-cell">Processo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && draftRcas?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento?.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{item.empreendedor?.nome}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{item.termoReferencia?.processo}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'Aprovado' ? 'default' : 'secondary'} className={cn(item.status === 'Aprovado' && 'bg-green-500/20 text-green-700')}>
                            {item.status || 'Rascunho'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <StudyDocumentRowActions
                            item={item}
                            templateSlug="rca"
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
                    {!isLoading && draftRcas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Nenhum RCA em elaboração.
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
              <CardTitle>RCAs Aprovados</CardTitle>
              <CardDescription>Lista de Relatórios de Controle Ambiental que foram finalizados e aprovados.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="hidden md:table-cell">Empreendedor</TableHead>
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
                    {!isLoading && approvedRcas.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.empreendimento?.nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{item.empreendedor?.nome}</TableCell>
                        <TableCell>
                           <Badge variant={'outline'} className={cn('bg-green-500/20 text-green-700')}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <StudyDocumentRowActions
                            item={item}
                            templateSlug="rca"
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
                    {!isLoading && approvedRcas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhum RCA aprovado.
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
            <DialogTitle>{itemToView?.empreendimento?.nome}</DialogTitle>
            <DialogDescription>Detalhes do Relatório de Controle Ambiental.</DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <DetailItem label="Empreendedor" value={itemToView.empreendedor?.nome} />
              <DetailItem label="Empreendimento" value={itemToView.empreendimento?.nome} />
              <Separator />
              <DetailItem label="Atividade Principal" value={itemToView.activity} />
              {itemToView.subActivity && <DetailItem label="Atividade Específica" value={itemToView.subActivity} />}
              <Separator />
              <h4 className="font-semibold text-foreground">Termo de Referência</h4>
              <DetailItem label="Título" value={itemToView.termoReferencia?.titulo} />
              <DetailItem label="Processo" value={itemToView.termoReferencia?.processo} />
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Exportar documento</Label>
                <StudyBrandedExportButtons record={itemToView} templateSlug="rca" />
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
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o relatório.
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
