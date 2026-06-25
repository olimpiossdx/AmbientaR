
'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { DollarSign, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';
import {
  buildCompanyFinancialKpis,
  filterCompanyCaixaInvoices,
} from '@/lib/financial-dashboard-stats';
import type { Revenue, Expense, Invoice, ProjectRoiCase } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const CURRENT_YEAR = new Date().getFullYear();

export default function FinancialDashboard() {
  const { firestore, user } = useFirebase();
  const revenuesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'revenues'), limit(500));
  }, [firestore, user]);
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'expenses'), limit(500));
  }, [firestore, user]);
  const invoicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'invoices'), limit(200));
  }, [firestore, user]);
  const roiCasesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'project_roi_cases');
  }, [firestore, user]);

  const { data: revenuesData, isLoading: isLoadingRevenues } = useCollection<Revenue>(revenuesQuery);
  const { data: expensesData, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);
  const { data: invoicesData, isLoading: isLoadingInvoices } = useCollection<Invoice>(invoicesQuery);
  const { data: roiCasesData, isLoading: isLoadingRoiCases } =
    useCollection<ProjectRoiCase>(roiCasesQuery);

  const existingRoiCaseIds = useMemo(
    () => new Set((roiCasesData ?? []).map((c) => c.id)),
    [roiCasesData],
  );

  const { dashboardStats, chartData, recentTransactions } = useMemo(() => {
    const kpis = buildCompanyFinancialKpis(
      invoicesData || [],
      revenuesData || [],
      expensesData || [],
      CURRENT_YEAR,
      { recentLimit: 5, existingRoiCaseIds },
    );

    const caixaInvoices = filterCompanyCaixaInvoices(invoicesData || []);
    const paidInvoices = caixaInvoices.filter((inv) => inv.status === 'Paid');
    const totalPaidAmount = paidInvoices.reduce(
      (acc, inv) => acc + (Number(inv.amount) || 0),
      0,
    );
    const averageTicket =
      paidInvoices.length > 0 ? totalPaidAmount / paidInvoices.length : 0;

    return {
      dashboardStats: {
        revenue: kpis.totalRevenue,
        expenses: kpis.totalExpenses,
        profit: kpis.totalProfit,
        averageTicket,
      },
      chartData: kpis.monthlyChart,
      recentTransactions: kpis.recentTransactions,
    };
  }, [revenuesData, expensesData, invoicesData, existingRoiCaseIds]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const isLoading =
    isLoadingRevenues || isLoadingExpenses || isLoadingInvoices || isLoadingRoiCases;

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita ({CURRENT_YEAR})</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(dashboardStats.revenue)}</div>}
              <p className="text-xs text-muted-foreground mt-1">Lançamentos de entrada no caixa operacional</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas ({CURRENT_YEAR})</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(dashboardStats.expenses)}</div>}
              <p className="text-xs text-muted-foreground mt-1">Caixa operacional da empresa</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resultado líquido ({CURRENT_YEAR})</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(dashboardStats.profit)}</div>}
              <p className="text-xs text-muted-foreground mt-1">Regime: faturas + caixa sem duplicar</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio (Faturas Pagas)</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(dashboardStats.averageTicket)}</div>}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Visão Geral do Fluxo de Caixa ({CURRENT_YEAR})</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              {isLoading ? <div className="w-full h-[350px] flex items-center justify-center"><Skeleton className="w-full h-full"/></div> :
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value as number)}`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              }
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Transações Recentes (Caixa)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Somente caixa operacional — exclui Projetos &amp; ROI
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell>
                            <Skeleton className="h-5 w-32 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && recentTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground text-sm">
                        Nenhum lançamento de caixa recente.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-medium">{transaction.description || '—'}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.date ? new Date(transaction.date).toLocaleDateString('pt-BR') : '—'}
                        </div>
                      </TableCell>
                      <TableCell className={cn("text-right", transaction.type === 'revenue' ? 'text-emerald-500' : 'text-red-500')}>
                        {formatCurrency(Number(transaction.amount) || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
