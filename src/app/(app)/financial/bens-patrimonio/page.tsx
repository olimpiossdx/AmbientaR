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
import { PlusCircle, Pencil, Trash2, Search, FileText } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { BemPatrimonio, BemPatrimonioCategoria } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFinancialMenuDebug } from '@/lib/financial-menu-debug';
import { isAdminOrFinancialRole } from '@/lib/role-guards';
import { useAuth } from '@/firebase';
import { runMonthlyDepreciationForAll } from '@/lib/financial-depreciation';

const CATEGORIA_LABEL: Record<BemPatrimonioCategoria, string> = {
  movel: 'Móvel',
  imovel: 'Imóvel',
};

const SUBTIPO_LABEL: Record<string, string> = {
  veiculo: 'Veículo',
  moto: 'Moto',
  motocicleta: 'Motocicleta',
  barco: 'Barco',
  equipamento: 'Equipamento',
  maquina: 'Máquina',
  informatica: 'Informática',
  moveis_utensilios: 'Móveis',
  lote: 'Lote',
  terreno: 'Terreno',
  fazenda: 'Fazenda',
  predio: 'Prédio',
  galpao: 'Galpão',
  sala_comercial: 'Sala comercial',
  outro: 'Outro',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function BensPatrimonioPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [runningDepreciation, setRunningDepreciation] = useState(false);
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  useFinancialMenuDebug();

  const query = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'bens_patrimonio');
  }, [firestore, user]);

  const { data: bens, isLoading } = useCollection<BemPatrimonio>(query);
  const canWrite = isAdminOrFinancialRole(authUser?.role ?? user?.role);

  const filtered = useMemo(() => {
    if (!bens) return [];
    const term = searchTerm.trim().toLowerCase();
    return [...bens]
      .filter((b) => {
        if (filterCategoria !== 'all' && b.categoria !== filterCategoria) return false;
        if (!term) return true;
        const hay = [
          b.descricao,
          b.codigoPatrimonio,
          b.identificacao,
          b.fornecedorNome,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) =>
        (b.dataAquisicao || '').localeCompare(a.dataAquisicao || '', 'pt-BR'),
      );
  }, [bens, searchTerm, filterCategoria]);

  const totalAquisicao = useMemo(
    () => filtered.reduce((s, b) => s + (Number(b.valorAquisicao) || 0), 0),
    [filtered],
  );

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, 'bens_patrimonio', itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'Bem removido', description: 'Registro excluído com sucesso.' });
      })
      .catch(() => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({ path: docRef.path, operation: 'delete' }),
        );
      })
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Bens e Patrimônio">
          <div className="flex gap-2">
            {canWrite && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={runningDepreciation}
                  onClick={async () => {
                    if (!firestore) return;
                    setRunningDepreciation(true);
                    try {
                      const r = await runMonthlyDepreciationForAll(firestore, {
                        createExpense: true,
                      });
                      toast({
                        title: 'Depreciação aplicada',
                        description: `${r.processed} bem(ns); total ${formatCurrency(r.totalDepreciation)}`,
                      });
                    } catch {
                      toast({ variant: 'destructive', title: 'Erro na depreciação' });
                    } finally {
                      setRunningDepreciation(false);
                    }
                  }}
                >
                  Depreciação do mês
                </Button>
                <Button size="sm" className="gap-1" onClick={() => router.push('/financial/bens-patrimonio/new')}>
                  <PlusCircle className="h-4 w-4" />
                  Novo bem
                </Button>
              </>
            )}
          </div>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ativo imobilizado</CardTitle>
              <CardDescription>
                Cadastro de bens móveis e imóveis para controle patrimonial, depreciação e suporte à declaração IRPJ
                (LALUR / ativo imobilizado). Exportação SPED não está incluída nesta versão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição, código, placa, fornecedor…"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    <SelectItem value="movel">Bens móveis</SelectItem>
                    <SelectItem value="imovel">Imóveis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                {filtered.length} bem(ns) listado(s) · Valor total de aquisição:{' '}
                <strong>{formatCurrency(totalAquisicao)}</strong>
              </p>
            </CardContent>
          </Card>

          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}

          {!isLoading && filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum bem cadastrado. Use &quot;Novo bem&quot; para registrar patrimônio.
              </CardContent>
            </Card>
          )}

          {!isLoading &&
            filtered.map((item) => {
              const liquido =
                (Number(item.valorAquisicao) || 0) - (Number(item.depreciacaoAcumulada) || 0);
              return (
                <Card key={item.id} className="rounded-xl border-border/70">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold truncate">{item.descricao}</h3>
                          <Badge variant="outline">{CATEGORIA_LABEL[item.categoria]}</Badge>
                          <Badge variant="secondary">
                            {SUBTIPO_LABEL[item.subtipo] ?? item.subtipo}
                          </Badge>
                          {item.status !== 'ativo' && (
                            <Badge variant="destructive">{item.status}</Badge>
                          )}
                        </div>
                        {item.codigoPatrimonio && (
                          <p className="text-sm text-muted-foreground">
                            Código: {item.codigoPatrimonio}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Aquisição: {item.dataAquisicao?.slice(0, 10) ?? '—'} ·{' '}
                          {formatCurrency(Number(item.valorAquisicao) || 0)}
                          {item.metodoDepreciacao === 'linear' && (
                            <> · Líquido: {formatCurrency(Math.max(0, liquido))}</>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {item.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-1" />
                              PDF
                            </a>
                          </Button>
                        )}
                        {canWrite && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/financial/bens-patrimonio/${item.id}/edit`)
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setItemToDelete(item.id);
                                setIsAlertOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </main>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido do patrimônio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
