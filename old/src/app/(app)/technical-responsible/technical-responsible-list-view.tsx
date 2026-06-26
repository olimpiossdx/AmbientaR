
'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Pencil, Trash2, Eye } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { TechnicalResponsible } from '@/lib/types';
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
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { handleFirestoreFormError } from '@/lib/firestore-form-errors';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { formatCepDisplay, formatCpfCnpjDisplay } from '@/lib/masks';
import { canWriteTechnicalResponsibles } from '@/lib/role-guards';

const DetailItem = ({ label, value }: { label: string, value?: string | null | string[] }) => (
    <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{Array.isArray(value) ? value.join(', ') : (value || 'Não informado')}</p>
    </div>
);

export function TechnicalResponsibleListView() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<TechnicalResponsible | null>(null);

  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const canWrite = canWriteTechnicalResponsibles(user?.role);

  const responsiblesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'technicalResponsibles');
  }, [firestore, user]);

  const { data: responsibles, isLoading } = useCollection<TechnicalResponsible>(responsiblesQuery);
  const sortedResponsibles = useMemo(
    () =>
      [...(responsibles || [])].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }),
      ),
    [responsibles],
  );

  const handleView = (item: TechnicalResponsible) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'technicalResponsibles', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: 'Responsável deletado',
          description: 'O responsável técnico foi removido com sucesso.',
        });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: 'Erro ao excluir responsável técnico',
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
        <PageHeader title="Responsáveis Técnicos">
            {canWrite && (
                 <Button size="sm" className="gap-1" asChild>
                    <Link href="/technical-responsible/new">
                        <PlusCircle className="h-4 w-4" />
                        Adicionar Responsável
                    </Link>
                </Button>
            )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Responsáveis Técnicos</CardTitle>
              <CardDescription>Adicione, edite e visualize os profissionais técnicos.</CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!isLoading &&
                    sortedResponsibles.map((item) => (
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
                                {formatCpfCnpjDisplay(item.cpf)}
                              </p>
                              <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                                <span className="font-medium text-foreground/80">
                                  {item.profession || "Profissão não informada"}
                                </span>
                                {item.registrationNumber
                                  ? ` · Reg. ${item.registrationNumber}`
                                  : ""}
                              </p>
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
                                        <Link
                                          href={`/technical-responsible/${item.id}/edit`}
                                        >
                                          <Pencil className="h-4 w-4" />
                                          <span className="sr-only">Editar</span>
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar responsável</p>
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
                                      <p>Deletar responsável</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {!isLoading && sortedResponsibles.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground">
                      Nenhum responsável técnico encontrado.
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
                        Detalhes do responsável técnico.
                    </DialogDescription>
                </DialogHeader>
                {viewingItem && (
                    <div className="form-scroll-body max-h-[60vh] space-y-4">
                        <DetailItem label="Nome Completo" value={viewingItem.name} />
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="CPF" value={viewingItem.cpf} />
                           <DetailItem label="Identidade (RG)" value={viewingItem.identidade} />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                           <DetailItem label="Nacionalidade" value={viewingItem.nacionalidade} />
                           <DetailItem label="Estado Civil" value={viewingItem.estadoCivil} />
                        </div>
                        <Separator />
                        <h4 className="font-semibold text-foreground">Informações Profissionais</h4>
                        <DetailItem label="Profissão" value={viewingItem.profession} />
                        <DetailItem label="Nº Registro do Conselho" value={viewingItem.registrationNumber} />
                        <DetailItem label="Nº ART" value={viewingItem.art} />
                        <Separator />
                         <h4 className="font-semibold text-foreground">Endereço</h4>
                         <DetailItem label="Endereço" value={`${viewingItem.address || ''}, ${viewingItem.numero || ''}`} />
                         <div className="grid grid-cols-3 gap-4">
                            <DetailItem label="Município" value={viewingItem.municipio} />
                            <DetailItem label="UF" value={viewingItem.uf} />
                            <DetailItem label="CEP" value={formatCepDisplay(viewingItem.cep)} />
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
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o responsável técnico.
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
