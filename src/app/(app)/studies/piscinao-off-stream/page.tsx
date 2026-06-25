'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Pencil, Trash2, CheckCircle, ArrowLeft, Eye } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useStudyListEntityFilter } from '@/hooks/use-study-list-entity-filter';
import { StudyListEntityFilterCard } from '@/components/studies/study-list-entity-filter-card';
import { collection, doc, deleteDoc, updateDoc, limit, query } from 'firebase/firestore';
import type { PiscinaoOffStream } from '@/lib/types';
import { isAdminOrSupervisorRole } from '@/lib/role-guards';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { Badge } from '@/components/ui/badge';
import { PiscinaoExportIconButtons } from '@/components/piscinao/piscinao-export-icon-buttons';
import { TooltipProvider } from '@/components/ui/tooltip';

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <Label className="text-muted-foreground">{label}</Label>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export default function PiscinaoOffStreamPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<PiscinaoOffStream | null>(null);
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const cadastrosQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'piscinoesOffStream'), limit(200));
  }, [firestore, user]);

  const { data: cadastros, isLoading } = useCollection<PiscinaoOffStream>(cadastrosQuery);

  const {
    filterEmpreendedorId,
    setFilterEmpreendedorId,
    filterProjectId,
    setFilterProjectId,
    filtered: filteredCadastros,
  } = useStudyListEntityFilter(cadastros);

  const { drafts, approved } = useMemo(() => {
    return {
      drafts: filteredCadastros.filter((e) => e.status !== 'Aprovado'),
      approved: filteredCadastros.filter((e) => e.status === 'Aprovado'),
    };
  }, [filteredCadastros]);

  const handleAddNew = () => router.push('/studies/piscinao-off-stream/new');
  const handleEdit = (item: PiscinaoOffStream) =>
    router.push(`/studies/piscinao-off-stream/${item.id}/edit`);

  const handleApprove = async (id: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'piscinoesOffStream', id), { status: 'Aprovado' });
      toast({ title: 'Cadastro aprovado' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao aprovar' });
    }
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'piscinoesOffStream', itemToDelete);
    deleteDoc(docRef)
      .then(() => toast({ title: 'Cadastro excluído' }))
      .catch((err) =>
        handleFirestoreFormError(err, {
          toast,
          title: 'Erro ao excluir',
          context: { path: docRef.path, operation: 'delete' },
        }),
      )
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const canDelete = (item: PiscinaoOffStream) => {
    if (!user) return false;
    if (isAdminOrSupervisorRole(user.role)) return true;
    return item.status === 'Rascunho';
  };

  const renderTable = (items: PiscinaoOffStream[], emptyMessage: string, showApprove: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empreendimento</TableHead>
          <TableHead className="hidden md:table-cell">Requerente</TableHead>
          <TableHead className="hidden lg:table-cell">Capacidade (m³)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={5}>
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
                {item.caracteristicas?.capacidadeUtilM3 ?? '—'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{item.status ?? 'Rascunho'}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setItemToView(item);
                      setIsViewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {showApprove && (
                    <Button variant="ghost" size="icon" onClick={() => handleApprove(item.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete(item) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setItemToDelete(item.id);
                        setIsAlertOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        {!isLoading && items.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <>
      <div className="flex h-full flex-col">
        <PageHeader title="Piscinão (off-stream)">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <Link href="/studies/barragens">
                <ArrowLeft className="h-4 w-4" />
                Visão geral
              </Link>
            </Button>
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Novo cadastro
            </Button>
          </div>
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
              <CardTitle className="text-base">Sobre piscinões off-stream</CardTitle>
              <CardDescription>
                Reservatórios construídos fora do leito do curso d&apos;água. Compartilham estudos de
                demanda e regularização com barragens, mas não barram o rio nem exigem remanso ou
                galgamento no curso principal.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Piscinões cadastrados</CardTitle>
              <CardDescription>
                Registre piscinões vinculados a empreendimentos, projeto técnico ou outorga de
                captação. Exportação PDF/Word com branding ou template em Configurações → Templates
                (piscinao-off-stream).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Tabs defaultValue="elaboracao" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="elaboracao">Em elaboração ({drafts.length})</TabsTrigger>
                  <TabsTrigger value="aprovados">Aprovados ({approved.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="elaboracao">
                  {renderTable(drafts, 'Nenhum cadastro em elaboração.', true)}
                </TabsContent>
                <TabsContent value="aprovados">
                  {renderTable(approved, 'Nenhum cadastro aprovado.', false)}
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
            <DialogDescription>Piscinão off-stream — características e demanda hídrica.</DialogDescription>
          </DialogHeader>
          {itemToView && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <DetailItem label="Requerente" value={itemToView.requerente.nome} />
              <DetailItem label="Uso" value={itemToView.caracteristicas?.usoPretendido} />
              <DetailItem
                label="Capacidade útil"
                value={
                  itemToView.caracteristicas?.capacidadeUtilM3
                    ? `${itemToView.caracteristicas.capacidadeUtilM3} m³`
                    : undefined
                }
              />
              <DetailItem label="Status" value={itemToView.status ?? 'Rascunho'} />
              <DetailItem label="Responsável técnico" value={itemToView.responsavelTecnico.nome} />
              <Separator />
              <DetailItem
                label="Localização"
                value={[itemToView.empreendimento.municipio, itemToView.empreendimento.uf]
                  .filter(Boolean)
                  .join(' - ')}
              />
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Exportar documento</Label>
                <PiscinaoExportIconButtons cadastro={itemToView} />
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
            <AlertDialogTitle>Excluir cadastro?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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
