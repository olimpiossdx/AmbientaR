
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Opportunity, OpportunityStage, Client, AppUser } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, useUser, errorEmitter } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, limit, query } from 'firebase/firestore';
import { sortOpportunitiesByCloseDate } from '@/lib/firestore-list-helpers';
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
import { FirestorePermissionError } from '@/firebase/errors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CrmDashboard from './crm-dashboard';
import { CrmPipelineKanban } from './crm-pipeline-kanban';
import { canWriteCrm } from '@/lib/role-guards';

const canPerformWriteActions = (user: AppUser | null): boolean => {
    if (!user) return false;
    return canWriteCrm(user.role);
}


export default function CrmPage() {
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
    if (!clients) return new Map();
    return new Map(clients.map(c => [c.id, c.name]));
  }, [clients]);

  const handleAddNew = () => {
    router.push('/crm/new');
  };

  const handleEdit = (item: Opportunity) => {
    router.push(`/crm/${item.id}/edit`);
  };

  const handleMoveStage = (opportunityId: string, newStage: OpportunityStage) => {
    if (!firestore) return;
    const oppRef = doc(firestore, 'opportunities', opportunityId);
    updateDoc(oppRef, { stage: newStage }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: oppRef.path, operation: 'update', requestResourceData: { stage: newStage }});
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'opportunities', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'Oportunidade deletada', description: 'A oportunidade foi removida com sucesso.' });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };


  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
  }

  const isLoading = isLoadingOpps || isLoadingClients;

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader
          title="Painel de Vendas"
          description="Visão geral de oportunidades, pipeline e desempenho comercial."
        >
          {canPerformWriteActions(user) && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
                <PlusCircle className="h-4 w-4" />
                Nova Oportunidade
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full max-w-md grid-cols-2 h-11">
                    <TabsTrigger value="overview" className="text-sm">Visão Geral</TabsTrigger>
                    <TabsTrigger value="pipeline" className="text-sm">Pipeline</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 mt-4">
                    <CrmDashboard onAddNew={canPerformWriteActions(user) ? handleAddNew : undefined} />
                </TabsContent>
                <TabsContent value="pipeline" className="mt-4">
                    <CrmPipelineKanban
                        opportunities={opportunities ?? []}
                        clientsMap={clientsMap}
                        isLoading={isLoading}
                        canWrite={canPerformWriteActions(user)}
                        onEdit={handleEdit}
                        onMoveStage={handleMoveStage}
                        onDelete={openDeleteConfirm}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                    />
                </TabsContent>
            </Tabs>
        </main>
      </div>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso irá deletar permanentemente a oportunidade.
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
