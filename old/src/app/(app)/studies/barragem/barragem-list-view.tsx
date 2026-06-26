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
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useStudyListEntityFilter } from '@/hooks/use-study-list-entity-filter';
import { StudyListEntityFilterCard } from '@/components/studies/study-list-entity-filter-card';
import { collection, doc, deleteDoc, updateDoc, limit, query } from 'firebase/firestore';
import type { ProjetoTecnicoBarragem } from '@/lib/types';
import { isAdminOrSupervisorRole } from '@/lib/role-guards';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { BarragemRowActions } from '@/components/barragem/barragem-row-actions';
import { BarragemExportIconButtons } from '@/components/barragem/barragem-export-icon-buttons';

const STATUS_LABEL: Record<string, string> = {
  Rascunho: 'Rascunho',
  Aprovado: 'Aprovado',
};

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
  </div>
);

function BarragemTable({
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
  items: ProjetoTecnicoBarragem[];
  isLoading: boolean;
  emptyMessage: string;
  showApprove: boolean;
  onView: (item: ProjetoTecnicoBarragem) => void;
  onEdit: (item: ProjetoTecnicoBarragem) => void;
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete: (item: ProjetoTecnicoBarragem) => boolean;
}) {
  const colSpan = 4;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empreendimento</TableHead>
          <TableHead className="hidden md:table-cell">Proprietário</TableHead>
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
                  {STATUS_LABEL[item.status ?? 'Rascunho'] ?? item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <BarragemRowActions
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

export function BarragemListView() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<ProjetoTecnicoBarragem | null>(null);
  const router = useRouter();

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const projetosQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'projetosTecnicosBarragem'), limit(200));
  }, [firestore, user]);

  const { data: projetos, isLoading } = useCollection<ProjetoTecnicoBarragem>(projetosQuery);

  const {
    filterEmpreendedorId,
    setFilterEmpreendedorId,
    filterProjectId,
    setFilterProjectId,
    filtered: filteredProjetos,
  } = useStudyListEntityFilter(projetos);

  const { drafts, approved } = useMemo(() => {
    return {
      drafts: filteredProjetos.filter((p) => p.status !== 'Aprovado'),
      approved: filteredProjetos.filter((p) => p.status === 'Aprovado'),
    };
  }, [filteredProjetos]);

  const handleAddNew = () => router.push('/studies/barragem/new');
  const handleEdit = (item: ProjetoTecnicoBarragem) =>
    router.push(`/studies/barragem/${item.id}/edit`);

  const handleApprove = async (id: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'projetosTecnicosBarragem', id), { status: 'Aprovado' });
      toast({ title: 'Projeto aprovado', description: 'Movido para a lista de aprovados.' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao aprovar',
        description: 'Não foi possível atualizar o status.',
      });
    }
  };

  const openDeleteConfirm = (id: string) => {
    setItemToDelete(id);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'projetosTecnicosBarragem', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'Projeto excluído', description: 'Removido com sucesso.' });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: 'Erro ao excluir projeto',
          context: { path: docRef.path, operation: 'delete' },
        }),
      )
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const canDelete = (item: ProjetoTecnicoBarragem) => {
    if (!user) return false;
    if (isAdminOrSupervisorRole(user.role)) return true;
    return item.status === 'Rascunho';
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <PageHeader title="Projeto Técnico de Barragem">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Adicionar projeto
          </Button>
        </PageHeader>
        <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
          <StudyListEntityFilterCard
            empreendedorId={filterEmpreendedorId}
            projectId={filterProjectId}
            onEmpreendedorIdChange={setFilterEmpreendedorId}
            onProjectIdChange={setFilterProjectId}
          />
          <Card>
            <CardHeader>
              <CardTitle>Projetos técnicos de barragem</CardTitle>
              <CardDescription>
                Memorial descritivo com exportação em PDF (branding) ou Word editável. Modelo base:
                Configurações → Templates (barragens) ou geração automática com identidade visual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Tabs defaultValue="elaboracao" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="elaboracao">
                      Em elaboração ({drafts.length})
                    </TabsTrigger>
                    <TabsTrigger value="aprovados">Aprovados ({approved.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="elaboracao">
                    <BarragemTable
                      items={drafts}
                      isLoading={isLoading}
                      emptyMessage="Nenhum projeto em elaboração."
                      showApprove
                      onView={(item) => {
                        setItemToView(item);
                        setIsViewOpen(true);
                      }}
                      onEdit={handleEdit}
                      onApprove={handleApprove}
                      onDelete={openDeleteConfirm}
                      canDelete={canDelete}
                    />
                  </TabsContent>
                  <TabsContent value="aprovados">
                    <BarragemTable
                      items={approved}
                      isLoading={isLoading}
                      emptyMessage="Nenhum projeto aprovado."
                      showApprove={false}
                      onView={(item) => {
                        setItemToView(item);
                        setIsViewOpen(true);
                      }}
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
            <DialogDescription>Projeto técnico de barragem — memorial descritivo.</DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <DetailItem label="Proprietário" value={itemToView.requerente.nome} />
              <DetailItem
                label="Localização"
                value={[itemToView.empreendimento.municipio, itemToView.empreendimento.uf]
                  .filter(Boolean)
                  .join(' - ')}
              />
              <DetailItem label="Uso pretendido" value={itemToView.usoPretendido} />
              <DetailItem label="Status" value={itemToView.status ?? 'Rascunho'} />
              <Separator />
              <DetailItem label="Responsável técnico" value={itemToView.responsavelTecnico.nome} />
              <DetailItem
                label="Registro"
                value={itemToView.responsavelTecnico.registroConselho}
              />
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Exportar documento</Label>
                <BarragemExportIconButtons projeto={itemToView} />
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
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O memorial e os dados do formulário serão removidos.
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
