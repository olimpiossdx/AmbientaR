'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type {
  FinancialCenter,
  FinancialAllocation,
  FinancialAssetSale,
  Revenue,
  Expense,
} from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  computeCenterTotals,
  formatCurrencyBRL,
  computeAssetSaleOutstanding,
  deriveAssetSaleStatus,
} from '@/lib/financial-centers';
import { Plus, AlertTriangle } from 'lucide-react';

export default function ControleProjetosPainelPage() {
  const { firestore, user } = useFirebase();

  const centersQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_centers') : null),
    [firestore, user],
  );
  const { data: centers, isLoading: loadingCenters } =
    useCollection<FinancialCenter>(centersQ);

  const allocQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_allocations') : null),
    [firestore, user],
  );
  const { data: allocations } = useCollection<FinancialAllocation>(allocQ);

  const salesQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_asset_sales') : null),
    [firestore, user],
  );
  const { data: assetSales } = useCollection<FinancialAssetSale>(salesQ);

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

  const stats = useMemo(() => {
    const allocs = allocations ?? [];
    const list = centers ?? [];
    const active = list.filter((c) => c.status === 'active');
    let totalCashIn = 0;
    let totalCashOut = 0;
    const centerRows = active.map((c) => {
      const t = computeCenterTotals(c, allocs);
      totalCashIn += t.cashCredits;
      totalCashOut += t.cashDebits;
      return { center: c, totals: t };
    });
    const negativeRoi = centerRows.filter(
      (r) => r.totals.roiPercent != null && r.totals.roiPercent < 0,
    );
    const pendingAssets = (assetSales ?? []).filter((s) => {
      const st = deriveAssetSaleStatus(s);
      return st !== 'settled' && st !== 'cancelled';
    });
    return {
      activeCount: active.length,
      totalCashIn,
      totalCashOut,
      netCash: totalCashIn - totalCashOut,
      negativeRoi: negativeRoi.slice(0, 5),
      pendingAssets,
      revenueCount: revenues?.length ?? 0,
      expenseCount: expenses?.length ?? 0,
    };
  }, [centers, allocations, assetSales, revenues, expenses]);

  if (loadingCenters) {
    return (
      <>
        <PageHeader title="Controlo por Projeto" description="Carregando…" />
        <Skeleton className="h-48 w-full" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Controlo por Projeto"
        description="Visão gerencial: centros, ROI, vendas de ativos e histórico consolidado do Financeiro."
      >
        <Button asChild>
          <Link href="/financial/controle-projetos/centros">
            <Plus className="mr-2 h-4 w-4" />
            Novo centro
          </Link>
        </Button>
      </PageHeader>

      <p className="mb-4 text-sm text-muted-foreground">
        Indicadores gerenciais. Não substituem a contabilidade fiscal. Dados de caixa:{' '}
        {stats.revenueCount} receitas e {stats.expenseCount} despesas no sistema.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Centros ativos</CardDescription>
            <CardTitle className="text-2xl">{stats.activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entradas alocadas (caixa)</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">
              {formatCurrencyBRL(stats.totalCashIn)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saídas alocadas (caixa)</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {formatCurrencyBRL(stats.totalCashOut)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo alocado</CardDescription>
            <CardTitle className="text-2xl">{formatCurrencyBRL(stats.netCash)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Vendas de ativos em aberto
            </CardTitle>
            <CardDescription>Parcelas ou permutas pendentes de quitação</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pendingAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma venda pendente.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.pendingAssets.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2 border-b pb-2">
                    <span>{s.description}</span>
                    <span className="shrink-0 font-medium">
                      Falta {formatCurrencyBRL(computeAssetSaleOutstanding(s))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/financial/controle-projetos/ativos">Ver vendas de ativos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Centros com ROI negativo</CardTitle>
            <CardDescription>Com investimento registado e alocações</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.negativeRoi.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum centro com ROI negativo.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.negativeRoi.map(({ center, totals }) => (
                  <li key={center.id}>
                    <Link
                      href={`/financial/controle-projetos/centros/${center.id}`}
                      className="font-medium hover:underline"
                    >
                      {center.name}
                    </Link>
                    <span className="ml-2 text-red-600">
                      {totals.roiPercent?.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
