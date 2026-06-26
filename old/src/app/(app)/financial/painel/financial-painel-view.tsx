'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type {
  CommercialProposal,
  Expense,
  Invoice,
  ProjectRoiCase,
  Revenue,
} from '@/lib/types';
import type { ProjectRoiCompanySettings } from '@/lib/project-roi-thresholds';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyBRL, datePart } from '@/lib/financial-core';
import { buildCompanyFinancialKpis, filterCompanyCaixaInvoices } from '@/lib/financial-dashboard-stats';
import { AlertTriangle, TrendingUp, FileText, ClipboardPenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinancialMenuDebug } from '@/lib/financial-menu-debug';
import { listProjectRoiAlerts } from '@/lib/project-roi-alerts';
import { ProjectRoiAlertsCard } from '@/components/financial/project-roi-alerts-card';

const year = new Date().getFullYear();

export function FinancialPainelView() {
  const { firestore, user } = useFirebase();
  useFinancialMenuDebug();

  const invoicesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'invoices') : null), [firestore, user]);
  const revenuesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'revenues') : null), [firestore, user]);
  const expensesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'expenses') : null), [firestore, user]);
  const proposalsQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'commercialProposals') : null), [firestore, user]);
  const roiCasesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'project_roi_cases') : null), [firestore, user]);
  const roiSettingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'companySettings', 'projectRoi') : null),
    [firestore],
  );

  const { data: invoices, isLoading: li } = useCollection<Invoice>(invoicesQ);
  const { data: revenues, isLoading: lr } = useCollection<Revenue>(revenuesQ);
  const { data: expenses, isLoading: le } = useCollection<Expense>(expensesQ);
  const { data: proposals, isLoading: lp } = useCollection<CommercialProposal>(proposalsQ);
  const { data: roiCases, isLoading: lroi } = useCollection<ProjectRoiCase>(roiCasesQ);
  const { data: roiSettings } = useDoc<ProjectRoiCompanySettings>(roiSettingsRef);

  const roiAlerts = useMemo(() => {
    if (!roiCases || !revenues || !expenses || !invoices) return [];
    return listProjectRoiAlerts(
      roiCases,
      revenues,
      expenses,
      invoices,
      roiSettings?.semaforo,
    );
  }, [roiCases, revenues, expenses, invoices, roiSettings?.semaforo]);

  const existingRoiCaseIds = useMemo(
    () => new Set((roiCases ?? []).map((c) => c.id)),
    [roiCases],
  );

  const stats = useMemo(() => {
    if (!invoices || !revenues || !expenses) return null;
    const kpis = buildCompanyFinancialKpis(invoices, revenues, expenses, year, {
      existingRoiCaseIds,
    });
    const caixaInvoices = filterCompanyCaixaInvoices(invoices);
    const today = new Date().toISOString().slice(0, 10);
    const overdue = caixaInvoices.filter(
      (i) =>
        (i.status === 'Unpaid' || i.status === 'Overdue') &&
        datePart(i.dueDate) &&
        datePart(i.dueDate) < today,
    );
    const unpaidSoon = caixaInvoices.filter(
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
    const paidInvoices = caixaInvoices.filter((i) => i.status === 'Paid');
    const paidCount = paidInvoices.length;
    const dso =
      paidCount > 0
        ? paidInvoices.reduce((acc, i) => {
              const d = datePart(i.dueDate);
              const p = datePart(i.invoiceDate);
              if (!d || !p) return acc;
              return acc + Math.max(0, (new Date(p).getTime() - new Date(d).getTime()) / 86400000);
            }, 0) / paidCount
        : 0;

    return {
      dre: kpis.dre,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((a, i) => a + (Number(i.amount) || 0), 0),
      unpaidSoonCount: unpaidSoon.length,
      pipelineCount: pipeline.length,
      pipelineValue,
      conversionRate: sent > 0 ? Math.round((accepted / sent) * 100) : 0,
      dso: Math.round(dso),
    };
  }, [invoices, revenues, expenses, proposals, existingRoiCaseIds]);

  const loading = li || lr || le || lp;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Painel Financeiro" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {loading || !stats ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <ProjectRoiAlertsCard
              alerts={roiAlerts}
              loading={lroi}
            />

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
