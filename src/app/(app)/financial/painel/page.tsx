'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { CommercialProposal, Expense, Invoice, Revenue } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyBRL, datePart, calculateDre } from '@/lib/financial-core';
import { AlertTriangle, TrendingUp, FileText, ClipboardPenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinancialMenuDebug } from '@/lib/financial-menu-debug';

const year = new Date().getFullYear();

export default function FinancialPainelPage() {
  const { firestore, user } = useFirebase();
  useFinancialMenuDebug();

  const invoicesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'invoices') : null), [firestore, user]);
  const revenuesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'revenues') : null), [firestore, user]);
  const expensesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'expenses') : null), [firestore, user]);
  const proposalsQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'commercialProposals') : null), [firestore, user]);

  const { data: invoices, isLoading: li } = useCollection<Invoice>(invoicesQ);
  const { data: revenues, isLoading: lr } = useCollection<Revenue>(revenuesQ);
  const { data: expenses, isLoading: le } = useCollection<Expense>(expensesQ);
  const { data: proposals, isLoading: lp } = useCollection<CommercialProposal>(proposalsQ);

  const stats = useMemo(() => {
    if (!invoices || !revenues || !expenses) return null;
    const dre = calculateDre(invoices, revenues, expenses, year, 'combinado_sem_duplicar');
    const today = new Date().toISOString().slice(0, 10);
    const overdue = invoices.filter(
      (i) =>
        (i.status === 'Unpaid' || i.status === 'Overdue') &&
        datePart(i.dueDate) &&
        datePart(i.dueDate) < today,
    );
    const overdueAmount = overdue.reduce((a, i) => a + (Number(i.amount) || 0), 0);
    const unpaidSoon = invoices.filter(
      (i) =>
        i.status === 'Unpaid' &&
        datePart(i.dueDate) >= today &&
        datePart(i.dueDate) <=
          new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    );
    const pipeline = proposals?.filter((p) => p.status === 'Sent') ?? [];
    const pipelineValue = pipeline.reduce((a, p) => a + (Number(p.amount) || 0), 0);
    const accepted = proposals?.filter((p) => p.status === 'Accepted').length ?? 0;
    const sent = proposals?.filter((p) => p.status === 'Sent').length ?? 0;
    const paidCount = invoices.filter((i) => i.status === 'Paid').length;
    const dso =
      paidCount > 0
        ? invoices
            .filter((i) => i.status === 'Paid')
            .reduce((acc, i) => {
              const d = datePart(i.dueDate);
              const p = datePart(i.invoiceDate);
              if (!d || !p) return acc;
              return acc + Math.max(0, (new Date(p).getTime() - new Date(d).getTime()) / 86400000);
            }, 0) / paidCount
        : 0;

    return {
      dre,
      overdueCount: overdue.length,
      overdueAmount,
      unpaidSoonCount: unpaidSoon.length,
      pipelineCount: pipeline.length,
      pipelineValue,
      conversionRate: sent > 0 ? Math.round((accepted / sent) * 100) : 0,
      dso: Math.round(dso),
    };
  }, [invoices, revenues, expenses, proposals]);

  const loading = li || lr || le || lp;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Painel Financeiro" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {loading || !stats ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Resultado líquido ({year})</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrencyBRL(stats.dre.resultadoLiquido)}</p>
                  <p className="text-xs text-muted-foreground">Regime: faturas + caixa sem duplicar</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Inadimplência
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.overdueCount} faturas</p>
                  <p className="text-sm text-muted-foreground">{formatCurrencyBRL(stats.overdueAmount)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pipeline comercial</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrencyBRL(stats.pipelineValue)}</p>
                  <p className="text-xs text-muted-foreground">{stats.pipelineCount} propostas enviadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Conversão propostas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Aceitas / enviadas</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Atalhos</CardTitle>
                <CardDescription>Vencimentos próximos: {stats.unpaidSoonCount} fatura(s) nos próximos 30 dias.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/invoices"><FileText className="mr-2 h-4 w-4" />Faturas</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/financial/dre-contabil"><TrendingUp className="mr-2 h-4 w-4" />DRE</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/financial/fluxo-projetado"><TrendingUp className="mr-2 h-4 w-4" />Fluxo projetado</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/commercial-proposals"><ClipboardPenLine className="mr-2 h-4 w-4" />Propostas</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
