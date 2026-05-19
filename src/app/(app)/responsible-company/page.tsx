
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Pencil, Trash2, Eye } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, useAuth } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { EnvironmentalCompany } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { isClienteAutonomo, isClienteGestao, canWriteCadastro } from '@/lib/role-guards';
import { useCadastroMenuDebug } from '@/lib/cadastro-menu-debug';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const DetailItem = ({ label, value }: { label: string, value?: string | null | string[] }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{Array.isArray(value) ? value.join(', ') : (value || 'Não informado')}</p>
    </div>
);

export default function ResponsibleCompanyPage() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<EnvironmentalCompany | null>(null);

  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const canWrite = Boolean(user && canWriteCadastro(user.role));

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'environmentalCompanies');
  }, [firestore, user]);

  const { data: companies, isLoading } = useCollection<EnvironmentalCompany>(companiesQuery);

  useCadastroMenuDebug();

  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;
    console.groupCollapsed('[Cadastro Debug] Empresa Responsável');
    console.log('loading', isLoading);
    console.log('count', companies?.length ?? 0);
    console.log('canWrite', canWrite);
    console.groupEnd();
  }, [isLoading, companies?.length, canWrite]);

  const handleView = (item: EnvironmentalCompany) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'environmentalCompanies', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Empresa deletada',
          description: 'A empresa foi removida com sucesso.',
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
        <PageHeader title="Empresas Responsáveis">
          {canWrite && (
            <Button size="sm" className="gap-1" asChild>
                <Link href="/responsible-company/new">
                    <PlusCircle className="h-4 w-4" />
                    Adicionar Empresa Responsável
                </Link>
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Empresas Responsáveis</CardTitle>
              <CardDescription>
                {isClienteAutonomo(user?.role)
                  ? 'Adicione, edite ou exclua empresas parceiras que deseja usar nos seus cadastros.'
                  : isClienteGestao(user?.role)
                    ? 'Visualize as empresas responsáveis disponibilizadas na plataforma. Alterações de cadastro são feitas pela consultoria.'
                    : 'Adicione, edite e visualize as empresas parceiras.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}

                  {!isLoading &&
                    companies?.map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-1.5">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {item.name}
                              </h3>
                              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                                {item.cnpj}
                              </p>
                              {item.email ? (
                                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                                  {item.email}
                                </p>
                              ) : null}
                            </div>
                            <Separator className="bg-border/60" />
                            <div className="flex flex-wrap items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    onClick={() => handleView(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Visualizar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar detalhes</p>
                                </TooltipContent>
                              </Tooltip>
                              {canWrite ? (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        asChild
                                      >
                                        <Link href={`/responsible-company/${item.id}/edit`}>
                                          <Pencil className="h-4 w-4" />
                                          <span className="sr-only">Editar</span>
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar empresa</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                        onClick={() => openDeleteConfirm(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Deletar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Deletar empresa</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {!isLoading && companies?.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                      Nenhuma empresa encontrada.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

       <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{viewingItem?.name}</DialogTitle>
                    <DialogDescription>
                        Detalhes da empresa.
                    </DialogDescription>
                </DialogHeader>
                {viewingItem && (
                    <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                        <DetailItem label="Razão Social" value={viewingItem.name} />
                        <DetailItem label="Nome Fantasia" value={viewingItem.fantasyName} />
                        <DetailItem label="CNPJ" value={viewingItem.cnpj} />
                        <Separator />
                        <h4 className="font-semibold text-foreground">Contato & Endereço</h4>
                        <DetailItem label="Email" value={viewingItem.email} />
                        <DetailItem label="Telefone" value={viewingItem.phone ? `(${viewingItem.ddd}) ${viewingItem.phone}` : ''} />
                         <DetailItem label="Endereço" value={`${viewingItem.address || ''}, ${viewingItem.numero || ''}`} />
                         <div className="grid grid-cols-3 gap-4">
                            <DetailItem label="Município" value={viewingItem.municipio} />
                            <DetailItem label="UF" value={viewingItem.uf} />
                            <DetailItem label="CEP" value={viewingItem.cep} />
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
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente a empresa.
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
