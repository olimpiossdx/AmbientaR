
'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Prada } from '@/lib/types';
import { isAdminOrSupervisorRole } from '@/lib/role-guards';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { PradaRowActions } from '@/components/prada/prada-row-actions';
import { PradaExportIconButtons } from '@/components/prada/prada-export-icon-buttons';

const PRADA_STATUS_LABEL: Record<string, string> = {
  Rascunho: 'Rascunho',
  Aprovado: 'Aprovado',
};

const DetailItem = ({ label, value }: { label: string; value?: string | null | string[] }) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">
      {Array.isArray(value) ? value.join(', ') : value || 'Não informado'}
    </p>
  </div>
);

function PradaTable({
  items,
  isLoading,
  emptyMessage,
  showApprove,
  onView,
  onEdit,
  onApprove,
  onDelete,
  canDelete,
}: {
  items: Prada[];
  isLoading: boolean;
  emptyMessage: string;
  showApprove: boolean;
  onView: (item: Prada) => void;
  onEdit: (item: Prada) => void;
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete: (item: Prada) => boolean;
}) {
  const colSpan = 4;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empreendimento</TableHead>
          <TableHead className="hidden md:table-cell">Requerente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-40 text-right sm:w-48">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={colSpan}>
                <Skeleton className="h-10 w-full" />
              </TableCell>
            </TableRow>
          ))}
        {!isLoading &&
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.empreendimento.nome}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {item.requerente.nome}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {PRADA_STATUS_LABEL[item.status ?? 'Rascunho'] ?? item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <PradaRowActions
                  item={item}
                  onView={onView}
                  onEdit={onEdit}
                  onApprove={onApprove}
                  onDelete={onDelete}
                  canDelete={canDelete(item)}
                  showApprove={showApprove}
                />
              </TableCell>
            </TableRow>
          ))}
        {!isLoading && items.length === 0 && (
          <TableRow>
            <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default function PradaPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<Prada | null>(null);
  const router = useRouter();

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const pradasQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'pradas');
  }, [firestore, user]);

  const { data: pradas, isLoading } = useCollection<Prada>(pradasQuery);

  const { draftPradas, approvedPradas } = useMemo(() => {
    if (!pradas) return { draftPradas: [], approvedPradas: [] };
    const drafts = pradas.filter((p) => p.status !== 'Aprovado');
    const approved = pradas.filter((p) => p.status === 'Aprovado');
    return { draftPradas: drafts, approvedPradas: approved };
  }, [pradas]);

  const handleAddNew = () => {
    router.push('/studies/prada/new');
  };

  const handleEdit = (item: Prada) => {
    router.push(`/studies/prada/${item.id}/edit`);
  };

  const handleView = (item: Prada) => {
    setItemToView(item);
    setIsViewOpen(true);
  };

  const handleApprove = async (pradaId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'pradas', pradaId);
    try {
      await updateDoc(docRef, { status: 'Aprovado' });
      toast({
        title: 'PRADA aprovado',
        description: 'O plano foi movido para a lista de aprovados.',
      });
    } catch (error) {
      console.error('Error approving PRADA:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao aprovar',
        description: 'Não foi possível atualizar o status do PRADA.',
      });
    }
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'pradas', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'PRADA excluído',
          description: 'O formulário PRADA foi removido com sucesso.',
        });
      })
      .catch(async () => {
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

  const canDelete = (item: Prada) => {
    if (!user) return false;
    if (isAdminOrSupervisorRole(user.role)) return true;
    if (item.status === 'Rascunho') return true;
    return false;
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <PageHeader title="Planos de Recuperação de Áreas Degradadas (PRADA)">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Adicionar PRADA
          </Button>
        </PageHeader>
        <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>PRADAs</CardTitle>
              <CardDescription>
                Acompanhe, edite e exporte os planos de recuperação de áreas degradadas em elaboração ou
                aprovados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Tabs defaultValue="elaboracao" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="elaboracao">
                      Em elaboração ({draftPradas.length})
                    </TabsTrigger>
                    <TabsTrigger value="aprovados">
                      Aprovados ({approvedPradas.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="elaboracao">
                    <PradaTable
                      items={draftPradas}
                      isLoading={isLoading}
                      emptyMessage="Nenhum PRADA em elaboração."
                      showApprove
                      onView={handleView}
                      onEdit={handleEdit}
                      onApprove={handleApprove}
                      onDelete={openDeleteConfirm}
                      canDelete={canDelete}
                    />
                  </TabsContent>
                  <TabsContent value="aprovados">
                    <PradaTable
                      items={approvedPradas}
                      isLoading={isLoading}
                      emptyMessage="Nenhum PRADA aprovado."
                      showApprove={false}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={
                        isAdminOrSupervisorRole(user?.role) ? openDeleteConfirm : undefined
                      }
                      canDelete={canDelete}
                    />
                  </TabsContent>
                </Tabs>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{itemToView?.empreendimento.nome}</DialogTitle>
            <DialogDescription>
              Detalhes do Plano de Recuperação de Área Degradada.
            </DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-4">
              <DetailItem label="Requerente" value={itemToView.requerente.nome} />
              <DetailItem label="Empreendimento" value={itemToView.empreendimento.nome} />
              <DetailItem label="Nº CAR" value={itemToView.empreendimento.car} />
              <DetailItem label="Status" value={itemToView.status ?? 'Rascunho'} />
              <Separator />
              <h4 className="font-semibold text-foreground">Objetivos</h4>
              <p className="text-sm text-muted-foreground">
                {itemToView.objetivoDescricao || 'Nenhuma descrição de objetivo fornecida.'}
              </p>
              <Separator />
              <h4 className="font-semibold text-foreground">Responsável técnico</h4>
              <DetailItem label="Nome" value={itemToView.responsavelTecnico.nome} />
              <DetailItem label="Formação" value={itemToView.responsavelTecnico.formacao} />
              <DetailItem
                label="Registro"
                value={itemToView.responsavelTecnico.registroConselho}
              />
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Exportar documento</Label>
                <PradaExportIconButtons prada={itemToView} />
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
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá excluir permanentemente o formulário PRADA.
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
