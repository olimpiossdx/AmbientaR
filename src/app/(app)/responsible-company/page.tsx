
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Pencil, Trash2, Eye, Star, Building2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, useAuth } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { usePlatformContractPublic } from '@/hooks/use-platform-contract-public';
import { isAdminRole } from '@/lib/role-guards';
import { syncActivePlatformCompanyDocs, formatBankAccountLabel } from '@/lib/platform-company';
import type { EnvironmentalCompany } from '@/lib/types';
import { formatCepDisplay } from '@/lib/masks';
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
  const isAdmin = isAdminRole(user?.role);
  const { platformCompany, isLoading: isLoadingPlatform } = usePlatformContractPublic();
  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'environmentalCompanies');
  }, [firestore, user]);

  const { data: companies, isLoading } = useCollection<EnvironmentalCompany>(companiesQuery);

  useCadastroMenuDebug();

  const handleView = (item: EnvironmentalCompany) => {
    setViewingItem(item);
    setIsViewOpen(true);
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleSetPlatformCompany = async (item: EnvironmentalCompany) => {
    if (!firestore || !isAdmin) return;
    setSettingActiveId(item.id);
    try {
      await syncActivePlatformCompanyDocs(firestore, item);
      toast({
        title: 'Empresa da plataforma definida',
        description: `${item.name} passará a constar no contrato de cadastro e no pagamento.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Não foi possível definir a empresa',
        description: 'Verifique permissões ou tente novamente.',
      });
    } finally {
      setSettingActiveId(null);
    }
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
        <PageHeader title="Empresas">
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
              <CardTitle>Empresas</CardTitle>
              <CardDescription>
                {isClienteAutonomo(user?.role)
                  ? 'Adicione, edite ou exclua empresas parceiras que deseja usar nos seus cadastros.'
                  : isClienteGestao(user?.role)
                    ? 'Visualize as empresas disponibilizadas na plataforma. Alterações de cadastro são feitas pela consultoria.'
                    : 'Cadastre empresas com dados jurídicos, conta corrente e PIX. O administrador define qual empresa aparece no contrato de assinatura e no pagamento do software.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Empresa no contrato e pagamento da plataforma</p>
                      {isLoadingPlatform ? (
                        <Skeleton className="h-4 w-48 mt-1" />
                      ) : platformCompany?.name ? (
                        <p className="text-sm text-muted-foreground truncate">
                          {platformCompany.name} — CNPJ {platformCompany.cnpj}
                        </p>
                      ) : (
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          Nenhuma empresa definida. Edite uma empresa e marque a opção de uso na plataforma, ou use o botão estrela na lista.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                  {item.name}
                                </h3>
                                {platformCompany?.activeCompanyId === item.id ? (
                                  <Badge variant="default" className="shrink-0">
                                    Plataforma
                                  </Badge>
                                ) : null}
                              </div>
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
                              {isAdmin ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      disabled={settingActiveId === item.id}
                                      onClick={() => handleSetPlatformCompany(item)}
                                    >
                                      <Star
                                        className={`h-4 w-4 ${
                                          platformCompany?.activeCompanyId === item.id
                                            ? 'fill-primary text-primary'
                                            : ''
                                        }`}
                                      />
                                      <span className="sr-only">Usar no contrato e pagamento</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Usar no contrato de cadastro e pagamento da plataforma</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : null}
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
                    <div className="form-scroll-body max-h-[60vh] space-y-4">
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
                            <DetailItem label="CEP" value={formatCepDisplay(viewingItem.cep)} />
                        </div>
                        <Separator />
                        <h4 className="font-semibold text-foreground">Conta e PIX</h4>
                        <DetailItem label="Banco" value={viewingItem.bankName} />
                        <div className="grid grid-cols-2 gap-4">
                          <DetailItem label="Agência" value={viewingItem.bankAgency} />
                          <DetailItem
                            label={`Conta (${formatBankAccountLabel(viewingItem.bankAccountType)})`}
                            value={viewingItem.bankAccount}
                          />
                        </div>
                        <DetailItem label="Chave PIX" value={viewingItem.pixKey} />
                        <DetailItem
                          label="PIX copia e cola"
                          value={viewingItem.pixCopyPaste ? '(cadastrado)' : undefined}
                        />
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
