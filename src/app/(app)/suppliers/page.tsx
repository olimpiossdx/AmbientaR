
'use client';
import { useMemo, useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Pencil, Trash2, Eye, Search } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { Fornecedor } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/firebase';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

export default function SuppliersPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const suppliersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'fornecedores');
  }, [firestore, user]);

  const { data: suppliers, isLoading } = useCollection<Fornecedor>(suppliersQuery);

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
      .catch(async (serverError) => {
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

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Fornecedores">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Adicionar Fornecedor
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Fornecedores</CardTitle>
              <CardDescription>Adicione, edite e visualize todos os seus fornecedores de serviços.</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <TooltipProvider>
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
                  </TooltipProvider>
                </div>
              </div>
              <TooltipProvider>
                <div className="space-y-3 md:hidden">
                  {isLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4 space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-36" />
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading &&
                    filteredSuppliers.map((supplier) => (
                      <Card key={supplier.id} className="rounded-xl border-border/70 shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">{supplier.cpfCnpj}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {supplier.serviceType || "Não informado"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(supplier)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => openDeleteConfirm(supplier.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredSuppliers.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                      Nenhum fornecedor encontrado.
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead className="hidden md:table-cell">Serviço Prestado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.cpfCnpj}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{supplier.serviceType || 'Não informado'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Editar fornecedor</p></TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(supplier.id)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Deletar fornecedor</p></TooltipContent></Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && filteredSuppliers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">Nenhum fornecedor encontrado.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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

    