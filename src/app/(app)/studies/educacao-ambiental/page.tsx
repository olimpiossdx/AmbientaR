'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  ChevronDown,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, limit, query } from 'firebase/firestore';
import type { PeaProgram } from '@/lib/pea/types';
import type { DispensaPeaRecord } from '@/lib/pea/types';
import { PEA_STATUS_LABEL, DISPENSA_STATUS_LABEL } from '@/lib/pea/pea-constants';
import { TermosReferenciaCard } from '@/components/termos-referencia-card';
import { PeaExportButtons } from '@/components/pea/pea-export-buttons';
import { DispensaExportButton } from '@/components/pea/dispensa-export-button';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { useToast } from '@/hooks/use-toast';
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
import { isAdminOrSupervisorRole } from '@/lib/role-guards';
import { sortByFirestoreUpdatedAt } from '@/lib/firestore-list-helpers';
import { useUser } from '@/firebase';
import { useStudyListEntityFilter } from '@/hooks/use-study-list-entity-filter';
import { filterStudyRecordsByEmpreendedorProject } from '@/lib/studies/filter-study-records';
import { StudyListEntityFilterCard } from '@/components/studies/study-list-entity-filter-card';

export default function EducacaoAmbientalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [deletePeaId, setDeletePeaId] = React.useState<string | null>(null);
  const [deleteDispensaId, setDeleteDispensaId] = React.useState<string | null>(null);

  const peaQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'pea_programs'), limit(200))
        : null,
    [firestore],
  );
  const { data: peaListRaw, isLoading: loadingPea } = useCollection<PeaProgram>(peaQuery);

  const peaList = React.useMemo(
    () => sortByFirestoreUpdatedAt(peaListRaw ?? []),
    [peaListRaw],
  );

  const dispensaQuery = useMemoFirebase(
    () =>
      firestore ? query(collection(firestore, 'dispensaPea'), limit(200)) : null,
    [firestore],
  );
  const { data: dispensaListRaw, isLoading: loadingDispensa } =
    useCollection<DispensaPeaRecord>(dispensaQuery);

  const dispensaList = React.useMemo(
    () => sortByFirestoreUpdatedAt(dispensaListRaw ?? []),
    [dispensaListRaw],
  );

  const {
    filterEmpreendedorId,
    setFilterEmpreendedorId,
    filterProjectId,
    setFilterProjectId,
    filtered: filteredPeaList,
  } = useStudyListEntityFilter(peaList);

  const filteredDispensaList = React.useMemo(
    () =>
      filterStudyRecordsByEmpreendedorProject(dispensaList, {
        empreendedorId: filterEmpreendedorId,
      }),
    [dispensaList, filterEmpreendedorId],
  );

  const canDelete = isAdminOrSupervisorRole(user?.role);

  const peasDraft = filteredPeaList.filter(
    (p) => p.status === 'Rascunho' || p.status === 'Em elaboração',
  );
  const peasDone = filteredPeaList.filter(
    (p) => p.status === 'Aprovado' || p.status === 'Em execução' || p.status === 'Arquivado',
  );

  const confirmDeletePea = async () => {
    if (!firestore || !deletePeaId) return;
    const docRef = doc(firestore, 'pea_programs', deletePeaId);
    try {
      await deleteDoc(docRef);
      toast({ title: 'PEA removido' });
    } catch (serverError) {
      handleFirestoreFormError(serverError, {
        toast,
        title: 'Erro ao excluir PEA',
        context: { path: docRef.path, operation: 'delete' },
      });
    } finally {
      setDeletePeaId(null);
    }
  };

  const confirmDeleteDispensa = async () => {
    if (!firestore || !deleteDispensaId) return;
    const docRef = doc(firestore, 'dispensaPea', deleteDispensaId);
    try {
      await deleteDoc(docRef);
      toast({ title: 'Dispensa removida' });
    } catch (serverError) {
      handleFirestoreFormError(serverError, {
        toast,
        title: 'Erro ao excluir dispensa',
        context: { path: docRef.path, operation: 'delete' },
      });
    } finally {
      setDeleteDispensaId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Programa de Educação Ambiental (PEA)">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Novo
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Criar</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/studies/educacao-ambiental/novo')}>
              Elaborar PEA
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/studies/educacao-ambiental/solicitar-dispensa')}
            >
              Solicitar dispensa do PEA
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <TermosReferenciaCard
          studySlug="pea"
          studyLabel="Programa de Educação Ambiental"
        />

        <StudyListEntityFilterCard
          empreendedorId={filterEmpreendedorId}
          projectId={filterProjectId}
          onEmpreendedorIdChange={setFilterEmpreendedorId}
          onProjectIdChange={setFilterProjectId}
        />

        <Tabs defaultValue="programas">
          <TabsList>
            <TabsTrigger value="programas">Programas (PEA)</TabsTrigger>
            <TabsTrigger value="dispensas">Dispensas</TabsTrigger>
          </TabsList>

          <TabsContent value="programas" className="space-y-6 mt-4">
            <PeaTable
              title="Em elaboração"
              description="Rascunhos e programas em montagem (DSP, projetos, monitoramento)."
              items={peasDraft}
              isLoading={loadingPea}
              emptyMessage="Nenhum PEA em elaboração. Clique em Novo → Elaborar PEA."
              onEdit={(id) => router.push(`/studies/educacao-ambiental/${id}/edit`)}
              onDelete={canDelete ? setDeletePeaId : undefined}
            />
            <PeaTable
              title="Aprovados e em execução"
              description="Programas concluídos ou em monitoramento perante o órgão licenciador."
              items={peasDone}
              isLoading={loadingPea}
              emptyMessage="Nenhum PEA aprovado ainda."
              onEdit={(id) => router.push(`/studies/educacao-ambiental/${id}/edit`)}
              onDelete={canDelete ? setDeletePeaId : undefined}
            />
          </TabsContent>

          <TabsContent value="dispensas" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de dispensa</CardTitle>
                <CardDescription>
                  Formulário alinhado à FEAM / DN COPAM 214-238. Exporte em Word após salvar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento / Razão social</TableHead>
                      <TableHead className="hidden md:table-cell">Processo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDispensa && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    )}
                    {!loadingDispensa && filteredDispensaList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          Nenhuma solicitação de dispensa.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredDispensaList.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          {d.razaoSocial || d.nomeFantasia || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {d.processoAdministrativo || d.solicitacaoLicenciamento || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {DISPENSA_STATUS_LABEL[d.status ?? 'Enviado'] ?? d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <DispensaExportButton record={d} />
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/studies/educacao-ambiental/dispensas/${d.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDispensaId(d.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deletePeaId} onOpenChange={() => setDeletePeaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir PEA?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePea}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDispensaId} onOpenChange={() => setDeleteDispensaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir solicitação de dispensa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDispensa}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PeaTable({
  title,
  description,
  items,
  isLoading,
  emptyMessage,
  onEdit,
  onDelete,
}: {
  title: string;
  description: string;
  items: PeaProgram[];
  isLoading: boolean;
  emptyMessage: string;
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empreendimento</TableHead>
              <TableHead className="hidden md:table-cell">Requerente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-36">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.empreendimento?.nome || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {item.requerente?.nome || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {PEA_STATUS_LABEL[item.status] ?? item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-0.5">
                    <PeaExportButtons pea={item} />
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
