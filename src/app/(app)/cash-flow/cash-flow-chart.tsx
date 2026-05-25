'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';
import type { Revenue, Expense, Transaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export function CashFlowChart() {
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

  const chartData = useMemo(() => {
    const revenues = revenuesData || [];
    const expenses = expensesData || [];

    const allTransactions: Transaction[] = [
      ...revenues.map((r) => ({ ...r, type: 'revenue' as const })),
      ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
    ];

    const monthlyData: {
      [key: string]: { revenue: number; expenses: number };
    } = {};
    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];

    allTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const month = monthNames[date.getMonth()];
      if (!month) return;

      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 };
      }
      if (transaction.type === 'revenue') {
        monthlyData[month].revenue += transaction.amount;
      } else {
        monthlyData[month].expenses += transaction.amount;
      }
    });

    return monthNames
      .map((month) => ({
        month,
        Receita: monthlyData[month]?.revenue || 0,
        Despesa: monthlyData[month]?.expenses || 0,
      }))
      .slice(0, new Date().getMonth() + 1);
  }, [revenuesData, expensesData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const isLoading = isLoadingRevenues || isLoadingExpenses;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral do Fluxo de Caixa</CardTitle>
        <CardDescription>Receitas vs. Despesas ao longo do ano.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {isLoading ? (
          <div className="flex h-[350px] w-full items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value as number)}
              />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar
                dataKey="Receita"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Despesa"
                fill="hsl(var(--destructive))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
