
'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  PlusCircle,
  Pencil,
  Trash2,
  Search,
} from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc, limit, query } from 'firebase/firestore';
import type { Fornecedor } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { useAuth } from '@/firebase';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { formatCpfCnpjDisplay } from '@/lib/masks';
import { isAdminOrFinancialRole } from '@/lib/role-guards';

export default function SuppliersPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const suppliersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'fornecedores'), limit(200));
  }, [firestore, user]);

  const { data: suppliers, isLoading } = useCollection<Fornecedor>(suppliersQuery);
  const canWrite = isAdminOrFinancialRole(user?.role);

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    const term = searchTerm.trim().toLowerCase();
    const base = !term
      ? suppliers
      : suppliers.filter((supplier) => {
      const name = supplier.name?.toLowerCase() ?? '';
      const cpfCnpj = supplier.cpfCnpj?.toLowerCase() ?? '';
      const serviceType = supplier.serviceType?.toLowerCase() ?? '';
      return (
        name.includes(term) ||
        cpfCnpj.includes(term) ||
        serviceType.includes(term)
      );
    });
    return [...base].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }),
    );
  }, [suppliers, searchTerm]);

  const handleAddNew = () => {
    router.push('/suppliers/new');
  };

  const handleEdit = (item: Fornecedor) => {
    router.push(`/suppliers/${item.id}/edit`);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;

    const docRef = doc(firestore, 'fornecedores', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Fornecedor deletado',
          description: 'O fornecedor foi removido com sucesso.',
        });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: 'Erro ao excluir fornecedor',
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

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Fornecedores">
          {canWrite && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Fornecedor
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Fornecedores</CardTitle>
              <CardDescription>Adicione, edite e visualize todos os seus fornecedores de serviços.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="text-sm text-muted-foreground">
                  {suppliers?.length ? `Total: ${suppliers.length} fornecedor(es)` : null}
                </div>
                <div className="flex items-center gap-2 w-full">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, CPF/CNPJ ou serviço..."
                    className="h-9 w-full"
                  />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                        >
                          <Search className="h-4 w-4" />
                          <span className="sr-only">Buscar fornecedor</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filtrar fornecedores digitando na caixa de busca</p>
                      </TooltipContent>
                    </Tooltip>
                </div>
              </div>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!isLoading &&
                    filteredSuppliers.map((supplier) => (
                      <Card
                        key={supplier.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-1.5">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {supplier.name}
                              </h3>
                              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                                {formatCpfCnpjDisplay(supplier.cpfCnpj)}
                              </p>
                              <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                                {supplier.serviceType?.trim()
                                  ? supplier.serviceType
                                  : "Serviço não informado"}
                              </p>
                            </div>
                            <Separator className="bg-border/60" />
                            {canWrite && (
                              <div className="flex flex-wrap items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      onClick={() => handleEdit(supplier)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Editar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar fornecedor</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                      onClick={() => openDeleteConfirm(supplier.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Deletar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Deletar fornecedor</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredSuppliers.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                      Nenhum fornecedor encontrado.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Isso irá deletar permanentemente o fornecedor.</AlertDialogDescription>
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

    
