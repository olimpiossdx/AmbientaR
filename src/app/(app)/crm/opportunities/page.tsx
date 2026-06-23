'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import type { Opportunity, OpportunityStage, Client, AppUser } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, useUser, errorEmitter } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, limit, query } from 'firebase/firestore';
import { sortOpportunitiesByCloseDate } from '@/lib/firestore-list-helpers';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CrmPipelineKanban, pipelineStages } from '../crm-pipeline-kanban';
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

import { canAccessCrm, canWriteCrm } from '@/lib/role-guards';

const canWrite = (user: AppUser | null) =>
  Boolean(user && canWriteCrm(user.role));

export default function CrmOpportunitiesPage() {
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const opportunitiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'opportunities'), limit(200));
  }, [firestore, user]);
  const { data: rawOpportunities, isLoading: isLoadingOpps } = useCollection<Opportunity>(opportunitiesQuery);
  const opportunities = React.useMemo(
    () => (rawOpportunities ? sortOpportunitiesByCloseDate(rawOpportunities) : undefined),
    [rawOpportunities],
  );

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'clients'), limit(200));
  }, [firestore, user]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const clientsMap = React.useMemo(() => {
    if (!clients) return new Map<string, string>();
    return new Map(clients.map((c) => [c.id, c.name]));
  }, [clients]);

  const handleAddNew = () => router.push('/crm/new');
  const handleEdit = (item: Opportunity) => router.push(`/crm/${item.id}/edit`);

  const handleMoveStage = (opportunityId: string, newStage: OpportunityStage) => {
    if (!firestore) return;
    const oppRef = doc(firestore, 'opportunities', opportunityId);
    updateDoc(oppRef, { stage: newStage }).catch((error) =>
        handleFirestoreFormError(error, {
          toast,
          title: 'Erro ao excluir oportunidade',
          context: {
          path: oppRef.path,
          operation: 'update',
          requestResourceData: { stage: newStage },
        },
        }),
      );
  };

  const openDeleteConfirm = (id: string) => {
    setItemToDelete(id);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'opportunities', itemToDelete);
    deleteDoc(docRef)
      .then(() => toast({ title: 'Oportunidade deletada', description: 'A oportunidade foi removida com sucesso.' }))
      .catch((error) =>
        handleFirestoreFormError(error, {
          toast,
          title: 'Erro ao excluir oportunidade',
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString: string) =>
    dateString ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A';

  const getStageVariant = (stage: OpportunityStage) => {
    switch (stage) {
      case 'Qualificação':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'Proposta':
        return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
      case 'Negociação':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'Fechado Ganho':
        return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'Fechado Perdido':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-700 border-slate-500/30';
    }
  };

  const isLoading = isLoadingOpps || isLoadingClients;
  const list = opportunities ?? [];

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Oportunidades & Pipeline (CRM)">
          {canWrite(user) && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Nova Oportunidade
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Tabs defaultValue="pipeline" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="table">Tabela</TabsTrigger>
            </TabsList>
            <TabsContent value="pipeline" className="space-y-4">
              <CrmPipelineKanban
                opportunities={list}
                clientsMap={clientsMap}
                isLoading={isLoading}
                canWrite={canWrite(user) ?? false}
                onEdit={handleEdit}
                onMoveStage={handleMoveStage}
                onDelete={openDeleteConfirm}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            </TabsContent>
            <TabsContent value="table" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Oportunidade</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="hidden md:table-cell">Valor</TableHead>
                        <TableHead>Fase</TableHead>
                        <TableHead className="hidden md:table-cell">Previsão</TableHead>
                        {canWrite(user) && <TableHead className="text-right">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading &&
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                            {canWrite(user) && <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>}
                          </TableRow>
                        ))}
                      {!isLoading &&
                        list.map((opp) => (
                          <TableRow key={opp.id}>
                            <TableCell className="font-medium">{opp.name}</TableCell>
                            <TableCell>{clientsMap.get(opp.clientId) ?? 'N/A'}</TableCell>
                            <TableCell className="hidden md:table-cell">{formatCurrency(opp.value ?? 0)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn(getStageVariant(opp.stage))}>
                                {opp.stage}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(opp.closeDate)}</TableCell>
                            {canWrite(user) && (
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(opp)}>Editar</DropdownMenuItem>
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>Mover para</DropdownMenuSubTrigger>
                                      <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                          {pipelineStages
                                            .filter((s) => s !== opp.stage)
                                            .map((s) => (
                                              <DropdownMenuItem key={s} onClick={() => handleMoveStage(opp.id, s)}>
                                                {s}
                                              </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => openDeleteConfirm(opp.id)}>
                                      Deletar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      {!isLoading && list.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={canWrite(user) ? 6 : 5} className="h-24 text-center">
                            Nenhuma oportunidade cadastrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar oportunidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A oportunidade será removida permanentemente.
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
