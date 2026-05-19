'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import type {
  FinancialCenter,
  FinancialAllocation,
  Revenue,
  Expense,
  Invoice,
} from '@/lib/types';
import {
  computeCenterTotals,
  formatCurrencyBRL,
  getFinancialCenterTypeLabel,
  formatRoi,
} from '@/lib/financial-centers';
import { createAllocationWithMovement } from '@/lib/financial-ledger';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2 } from 'lucide-react';
import { useEffect } from 'react';

export default function CentroDetailPage() {
  const params = useParams();
  const centerId = params.id as string;
  const { firestore, auth, user } = useFirebase();
  const { toast } = useToast();
  const [center, setCenter] = useState<FinancialCenter | null>(null);
  const [loadingCenter, setLoadingCenter] = useState(true);
  const [allocOpen, setAllocOpen] = useState(false);
  const [sourceType, setSourceType] = useState<'revenue' | 'expense'>('revenue');
  const [sourceId, setSourceId] = useState('');
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    if (!firestore || !centerId) return;
    getDoc(doc(firestore, 'financial_centers', centerId)).then((snap) => {
      if (snap.exists()) setCenter({ id: snap.id, ...snap.data() } as FinancialCenter);
      setLoadingCenter(false);
    });
  }, [firestore, centerId]);

  const allocQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_allocations') : null),
    [firestore, user],
  );
  const { data: allAllocations } = useCollection<FinancialAllocation>(allocQ);

  const revQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'revenues') : null),
    [firestore, user],
  );
  const { data: revenues } = useCollection<Revenue>(revQ);

  const expQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'expenses') : null),
    [firestore, user],
  );
  const { data: expenses } = useCollection<Expense>(expQ);

  const invQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'invoices') : null),
    [firestore, user],
  );
  const { data: invoices } = useCollection<Invoice>(invQ);

  const centerAllocations = useMemo(
    () => (allAllocations ?? []).filter((a) => a.centerId === centerId),
    [allAllocations, centerId],
  );

  const totals = useMemo(() => {
    if (!center) return null;
    return computeCenterTotals(center, allAllocations ?? []);
  }, [center, allAllocations]);

  const unallocatedRevenues = useMemo(() => {
    const allocated = new Set(
      (allAllocations ?? [])
        .filter((a) => a.sourceType === 'revenue')
        .map((a) => a.sourceId),
    );
    return (revenues ?? []).filter((r) => !allocated.has(r.id));
  }, [revenues, allAllocations]);

  const unallocatedExpenses = useMemo(() => {
    const allocated = new Set(
      (allAllocations ?? [])
        .filter((a) => a.sourceType === 'expense')
        .map((a) => a.sourceId),
    );
    return (expenses ?? []).filter((e) => !allocated.has(e.id));
  }, [expenses, allAllocations]);

  async function handleAllocate() {
    if (!firestore || !auth?.currentUser || !center) return;
    const list = sourceType === 'revenue' ? revenues : expenses;
    const item = list?.find((x) => x.id === sourceId);
    if (!item) {
      toast({ variant: 'destructive', title: 'Selecione um lançamento.' });
      return;
    }
    setAllocating(true);
    const uid = auth.currentUser.uid;
    const now = new Date().toISOString();
    const date = String(item.date).slice(0, 10);
    const amount = Number(item.amount) || 0;
    const direction = sourceType === 'revenue' ? 'credit' : 'debit';
    try {
      await createAllocationWithMovement(
        firestore,
        {
          centerId: center.id,
          sourceType,
          sourceId: item.id,
          amount,
          direction,
          date,
          description: item.description,
          createdAt: now,
          createdBy: uid,
        },
        `Alocado: ${item.description}`,
      );
      toast({ title: 'Lançamento alocado' });
      setAllocOpen(false);
      setSourceId('');
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setAllocating(false);
    }
  }

  if (loadingCenter || !center) {
    return (
      <>
        <PageHeader title="Centro financeiro" />
        <Skeleton className="h-64 w-full" />
      </>
    );
  }

  if (!totals) return null;

  return (
    <>
      <PageHeader
        title={center.name}
        description={getFinancialCenterTypeLabel(center.type)}
      >
        {center.contractId && (
          <Button variant="outline" asChild>
            <Link href={`/contracts`}>Ver contratos</Link>
          </Button>
        )}
        <Dialog open={allocOpen} onOpenChange={setAllocOpen}>
          <DialogTrigger asChild>
            <Button disabled={center.status === 'closed'}>
              <Link2 className="mr-2 h-4 w-4" />
              Alocar lançamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alocar ao centro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={sourceType}
                  onValueChange={(v) => {
                    setSourceType(v as 'revenue' | 'expense');
                    setSourceId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Receita (caixa)</SelectItem>
                    <SelectItem value="expense">Despesa (caixa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lançamento</Label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {(sourceType === 'revenue' ? unallocatedRevenues : unallocatedExpenses).map(
                      (item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.description} — {formatCurrencyBRL(item.amount)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAllocate} disabled={allocating} className="w-full">
                {allocating ? 'Alocando…' : 'Confirmar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Tabs defaultValue="caixa" className="space-y-4">
        <TabsList>
          <TabsTrigger value="caixa">Caixa</TabsTrigger>
          <TabsTrigger value="contrato">Contrato</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="caixa">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Entradas</CardDescription>
                <CardTitle className="text-emerald-600">
                  {formatCurrencyBRL(totals.cashCredits)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Saídas</CardDescription>
                <CardTitle className="text-red-600">
                  {formatCurrencyBRL(totals.cashDebits)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Saldo caixa</CardDescription>
                <CardTitle>{formatCurrencyBRL(totals.cashBalance)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contrato">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Créditos (contrato)</CardDescription>
                <CardTitle>{formatCurrencyBRL(totals.contractCredits)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Débitos / custos</CardDescription>
                <CardTitle>{formatCurrencyBRL(totals.contractDebits)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Saldo contratual</CardDescription>
                <CardTitle>{formatCurrencyBRL(totals.contractBalance)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          {totals.barterCredits > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Inclui {formatCurrencyBRL(totals.barterCredits)} em permuta (não é caixa).
            </p>
          )}
        </TabsContent>

        <TabsContent value="roi">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Investimento</CardDescription>
                <CardTitle>{formatCurrencyBRL(totals.investment)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Retorno</CardDescription>
                <CardTitle>{formatCurrencyBRL(totals.returnAmount)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Resultado</CardDescription>
                <CardTitle>{formatCurrencyBRL(totals.netResult)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>ROI</CardDescription>
                <CardTitle>{formatRoi(totals.roiPercent)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centerAllocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        Nenhuma alocação. Use &quot;Alocar lançamento&quot;.
                      </TableCell>
                    </TableRow>
                  ) : (
                    centerAllocations.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.date}</TableCell>
                        <TableCell>{a.sourceType}</TableCell>
                        <TableCell>{a.description || a.sourceId}</TableCell>
                        <TableCell className="text-right">
                          {a.direction === 'credit' ? '+' : '−'}
                          {formatCurrencyBRL(a.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
