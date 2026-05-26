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
import { collection, doc, deleteDoc, updateDoc, limit, query } from 'firebase/firestore';
import type { EstudoCavidade } from '@/lib/types';
import { isAdminOrSupervisorRole } from '@/lib/role-guards';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { CavidadesRowActions } from '@/components/cavidades/cavidades-row-actions';

const NIVEL_BADGE: Record<string, string> = {
  triagem: 'Triagem',
  laudo_urbano: 'Urbano',
  laudo_prospecao: 'Prospecção',
  avaliacao_impacto: 'Impactos',
  relevancia_compensacao: 'Relevância',
  criterio_locacional: 'Crit. locacional',
};

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">{value || 'Não informado'}</p>
  </div>
);

function CavidadesTable({
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
  items: EstudoCavidade[];
  isLoading: boolean;
  emptyMessage: string;
  showApprove: boolean;
  onView: (item: EstudoCavidade) => void;
  onEdit: (item: EstudoCavidade) => void;
  onApprove?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete: (item: EstudoCavidade) => boolean;
}) {
  const colSpan = 5;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empreendimento</TableHead>
          <TableHead className="hidden md:table-cell">Requerente</TableHead>
          <TableHead className="hidden lg:table-cell">Nível</TableHead>
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
              <TableCell className="hidden lg:table-cell">
                <Badge variant="secondary">
                  {NIVEL_BADGE[item.nivelEstudo ?? 'triagem'] ?? item.nivelEstudo}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{item.status ?? 'Rascunho'}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <CavidadesRowActions
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

export default function CavidadesPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<EstudoCavidade | null>(null);
  const router = useRouter();

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const estudosQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'estudosCavidades'), limit(200));
  }, [firestore, user]);

  const { data: estudos, isLoading } = useCollection<EstudoCavidade>(estudosQuery);

  const { drafts, approved } = useMemo(() => {
    if (!estudos) return { drafts: [], approved: [] };
    return {
      drafts: estudos.filter((e) => e.status !== 'Aprovado'),
      approved: estudos.filter((e) => e.status === 'Aprovado'),
    };
  }, [estudos]);

  const handleAddNew = () => router.push('/studies/cavidades/new');
  const handleEdit = (item: EstudoCavidade) => router.push(`/studies/cavidades/${item.id}/edit`);

  const handleApprove = async (id: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'estudosCavidades', id), { status: 'Aprovado' });
      toast({ title: 'Estudo aprovado' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao aprovar',
      });
    }
  };

  const openDeleteConfirm = (id: string) => {
    setItemToDelete(id);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'estudosCavidades', itemToDelete);
    deleteDoc(docRef)
      .then(() => toast({ title: 'Estudo excluído' }))
      .catch(() => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({ path: docRef.path, operation: 'delete' }),
        );
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const canDelete = (item: EstudoCavidade) => {
    if (!user) return false;
    if (isAdminOrSupervisorRole(user.role)) return true;
    return item.status === 'Rascunho';
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <PageHeader title="Estudo de Cavidades">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Adicionar estudo
          </Button>
        </PageHeader>
        <main className="flex-1 space-y-6 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Estudos espeleológicos</CardTitle>
              <CardDescription>
                Licenciamento em MG (IS 08/2017, DN 217/2017, CECAV). Referência:{' '}
                <code className="text-xs">docs/ESTUDO-CAVIDADES-MG.md</code>. Templates em
                Configurações → Estudos de Cavidades.
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
                    <CavidadesTable
                      items={drafts}
                      isLoading={isLoading}
                      emptyMessage="Nenhum estudo em elaboração."
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
                    <CavidadesTable
                      items={approved}
                      isLoading={isLoading}
                      emptyMessage="Nenhum estudo aprovado."
                      showApprove={false}
                      onView={(item) => {
                        setItemToView(item);
                        setIsViewOpen(true);
                      }}
                      onEdit={handleEdit}
                      onDelete={openDeleteConfirm}
                      canDelete={canDelete}
                    />
                  </TabsContent>
                </Tabs>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir estudo?</AlertDialogTitle>
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{itemToView?.empreendimento.nome}</DialogTitle>
            <DialogDescription>Resumo do estudo de cavidades</DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="grid gap-3 py-2">
              <DetailItem label="Requerente" value={itemToView.requerente.nome} />
              <DetailItem label="Responsável técnico" value={itemToView.responsavelTecnico.nome} />
              <DetailItem
                label="Formação / registro"
                value={
                  [itemToView.responsavelTecnico.formacao, itemToView.responsavelTecnico.registroConselho]
                    .filter(Boolean)
                    .join(' — ') || undefined
                }
              />
              <DetailItem label="ART" value={itemToView.responsavelTecnico.art} />
              <DetailItem label="Município" value={itemToView.empreendimento.municipio} />
              <DetailItem label="Nível" value={NIVEL_BADGE[itemToView.nivelEstudo ?? 'triagem']} />
              <DetailItem label="Status" value={itemToView.status} />
              <DetailItem
                label="Potencial CECAV"
                value={itemToView.triagem?.potencialCecav}
              />
              <DetailItem
                label="Critério locacional"
                value={
                  itemToView.triagem?.criterioLocacionalIncide ? 'Incide' : 'Não incide / N/A'
                }
              />
              <DetailItem label="Processo SLA" value={itemToView.processo?.sla} />
              <DetailItem label="SEI" value={itemToView.processo?.sei} />
              <DetailItem
                label="Cavidades cadastradas"
                value={String(itemToView.cavidadesRegistradas?.length ?? 0)}
              />
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
            {itemToView && (
              <Button onClick={() => handleEdit(itemToView)}>Editar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
