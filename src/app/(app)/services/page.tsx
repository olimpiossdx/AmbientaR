
'use client';
import { useState, useMemo } from 'react';
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
import type { Service } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { isAdminOrFinancialRole } from '@/lib/role-guards';

export default function ServicesPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'services'), limit(200));
  }, [firestore]);

  const { data: services, isLoading } = useCollection<Service>(servicesQuery);
  const canWrite = isAdminOrFinancialRole(user?.role);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    const term = searchTerm.trim().toLowerCase();
    const base = !term
      ? services
      : services.filter((service) => {
      const name = service.name?.toLowerCase() ?? '';
      const description = (service.description as string | undefined)?.toLowerCase() ?? '';
      return (
        name.includes(term) ||
        description.includes(term)
      );
    });
    return [...base].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }),
    );
  }, [services, searchTerm]);

  const handleAddNew = () => {
    router.push('/services/new');
  };

  const handleEdit = (item: Service) => {
    router.push(`/services/${item.id}/edit`);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'services', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'Serviço deletado', description: 'O serviço foi removido com sucesso.' });
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

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number') return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Tabela de Serviços">
          {canWrite && (
            <Button size="sm" className="gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Serviço
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Serviços</CardTitle>
              <CardDescription>Adicione, edite e visualize todos os serviços oferecidos.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="text-sm text-muted-foreground">
                  {services?.length ? `Total: ${services.length} serviço(s)` : null}
                </div>
                <div className="flex items-center gap-2 w-full">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou descrição do serviço..."
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
                          <span className="sr-only">Buscar serviço</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filtrar serviços digitando na caixa de busca</p>
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
                    filteredServices.map((service) => (
                      <Card
                        key={service.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-1.5">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {service.name}
                              </h3>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span>
                                  Custo:{" "}
                                  <span className="font-medium tabular-nums text-foreground">
                                    {formatCurrency(service.cost)}
                                  </span>
                                </span>
                                <span>
                                  Venda:{" "}
                                  <span className="font-semibold tabular-nums text-foreground">
                                    {formatCurrency(service.price)}
                                  </span>
                                </span>
                              </div>
                              {typeof service.description === "string" &&
                              service.description.trim() ? (
                                <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                                  {service.description}
                                </p>
                              ) : null}
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
                                    onClick={() => handleEdit(service)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar serviço</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                    onClick={() => openDeleteConfirm(service.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Deletar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Deletar serviço</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && filteredServices.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                      Nenhum serviço encontrado.
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
            <AlertDialogDescription>Esta ação não pode ser desfeita. Isso irá deletar permanentemente o serviço.</AlertDialogDescription>
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
