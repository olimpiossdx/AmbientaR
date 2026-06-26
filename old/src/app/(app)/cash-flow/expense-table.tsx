
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  PlusCircle,
  Paperclip,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, limit, query } from 'firebase/firestore';
import type { Expense } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useMemo } from 'react';
import { TransactionViewDialog } from './transaction-view-dialog';
import { isAdminOrFinancialRole } from '@/lib/role-guards';

type ExpenseTableProps = {
  expenses?: Expense[] | null;
  isLoadingExpenses?: boolean;
};

export function ExpenseTable({ expenses: expensesProp, isLoadingExpenses: isLoadingExpensesProp }: ExpenseTableProps = {}) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const router = useRouter();

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'expenses'), limit(500));
  }, [firestore, user]);

  const { data: hookExpenses, isLoading: hookLoading } = useCollection<Expense>(expensesProp !== undefined ? null : expensesQuery);
  const expenses = useMemo(
    () => (expensesProp !== undefined ? (expensesProp ?? []) : (hookExpenses ?? [])),
    [expensesProp, hookExpenses],
  );
  const isLoading = expensesProp !== undefined ? (isLoadingExpensesProp ?? false) : hookLoading;
  const canWrite = isAdminOrFinancialRole(user?.role);
  const sortedExpenses = useMemo(
    () =>
      [...(expenses || [])].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [expenses],
  );

  const handleAddNew = () => {
    router.push('/cash-flow/new?type=expense');
  };

  const handleEdit = (item: Expense) => {
    router.push(`/cash-flow/${item.id}/edit?type=expense`);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    
    const itemDocRef = doc(firestore, 'expenses', itemToDelete);
    deleteDoc(itemDocRef)
      .then(() => {
        toast({
          title: 'Despesa deletada',
          description: 'O lançamento foi removido com sucesso.',
        });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: 'Erro ao excluir lançamento',
          context: {
          path: itemDocRef.path,
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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });


  return (
    <>
     {canWrite && (
     <div className="flex justify-end mb-4">
        <Button size="sm" className="gap-1" onClick={handleAddNew}>
          <PlusCircle className="h-4 w-4" />
          Adicionar Despesa
        </Button>
      </div>
     )}
       <TooltipProvider>
        <div className="space-y-3 md:hidden">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          {!isLoading &&
            sortedExpenses.map((item) => (
              <Card key={item.id} className="rounded-xl border-border/70 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.description}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(item.date)}</p>
                    <p className="text-sm font-medium text-red-600 dark:text-red-500">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <TransactionViewDialog
                      item={item}
                      type="Despesa"
                      collectionKind="expense"
                    />
                    {item.fileUrl && (
                      <Button asChild variant="ghost" size="icon">
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" title="Ver anexo">
                          <Paperclip className="h-4 w-4" />
                          <span className="sr-only">Ver anexo</span>
                        </a>
                      </Button>
                    )}
                    {canWrite && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteConfirm(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          {!isLoading && sortedExpenses.length === 0 && (
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
              Nenhuma despesa encontrada.
            </div>
          )}
        </div>
        <div className="hidden md:block">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Anexo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                </TableRow>
                ))}
            {sortedExpenses.map((item) => (
                <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">{formatDate(item.date)}</TableCell>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell>
                    {item.fileUrl && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="ghost" size="icon">
                                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" title="Ver anexo">
                                <Paperclip className="h-4 w-4" />
                                <span className="sr-only">Ver anexo</span>
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ver anexo</p></TooltipContent>
                    </Tooltip>
                    )}
                </TableCell>
                <TableCell className="text-right text-red-600 dark:text-red-500 font-medium">
                    {formatCurrency(item.amount)}
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                        <TransactionViewDialog
                      item={item}
                      type="Despesa"
                      collectionKind="expense"
                    />
                        {canWrite && (
                          <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Editar Lançamento</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Deletar</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Deletar Lançamento</p></TooltipContent>
                            </Tooltip>
                          </>
                        )}
                    </div>
                </TableCell>
                </TableRow>
            ))}
            {!isLoading && sortedExpenses.length === 0 && (
                <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Nenhuma despesa encontrada.</TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </div>
      </TooltipProvider>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o lançamento.
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

