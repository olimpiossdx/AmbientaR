'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';
import {
  sumCompanyCaixaExpenses,
  sumCompanyCaixaRevenues,
} from '@/lib/financial-transaction-scope';
import type { Expense, Revenue } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function CashFlowSummary() {
  const firestore = useFirestore();
  const { user } = useUser();
  const revenuesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'revenues'), limit(500));
  }, [firestore, user]);
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'expenses'), limit(500));
  }, [firestore, user]);

  const { data: revenuesData, isLoading: isLoadingRevenues } =
    useCollection<Revenue>(revenuesQuery);
  const { data: expensesData, isLoading: isLoadingExpenses } =
    useCollection<Expense>(expensesQuery);

  const stats = useMemo(() => {
    const allRev = revenuesData || [];
    const allExp = expensesData || [];
    const totalRevenue = sumCompanyCaixaRevenues(allRev, allExp);
    const totalExpenses = sumCompanyCaixaExpenses(allRev, allExp);
    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalRevenue - totalExpenses,
    };
  }, [revenuesData, expensesData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const isLoading = isLoadingRevenues || isLoadingExpenses;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(stats.expenses)}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(stats.profit)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
