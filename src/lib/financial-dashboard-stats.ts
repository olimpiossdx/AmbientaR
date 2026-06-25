/**
 * KPIs compartilhados entre dashboard financeiro, painel e resumos de caixa.
 */

import {
  expenseAmountForCompanyCaixa,
  filterCompanyCaixaExpenses,
  filterCompanyCaixaRevenues,
  isProjectRoiOnlyTransaction,
  revenueAmountForCompanyCaixa,
} from '@/lib/financial-transaction-scope';
import {
  calculateDre,
  datePart,
  inYearPeriod,
  type DreBreakdown,
} from '@/lib/financial-core';
import type { Expense, Invoice, Revenue, Transaction } from '@/lib/types';

export function filterCompanyCaixaInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter((i) => !isProjectRoiOnlyTransaction(i));
}

function safeDateTime(dateStr: string | undefined): number {
  if (dateStr == null || dateStr === '') return 0;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export type CompanyFinancialKpis = {
  dre: DreBreakdown;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  monthlyChart: { month: string; Receita: number; Despesa: number }[];
  recentTransactions: Transaction[];
  overdueCount: number;
  overdueAmount: number;
  unpaidSoonCount: number;
};

const MONTH_NAMES = [
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
] as const;

export function buildCompanyFinancialKpis(
  invoices: Invoice[],
  revenues: Revenue[],
  expenses: Expense[],
  year: number,
  options?: { recentLimit?: number },
): CompanyFinancialKpis {
  const recentLimit = options?.recentLimit ?? 5;
  const caixaInvoices = filterCompanyCaixaInvoices(invoices);
  const caixaRevenues = filterCompanyCaixaRevenues(revenues, expenses);
  const caixaExpenses = filterCompanyCaixaExpenses(expenses, revenues);

  const dre = calculateDre(
    invoices,
    revenues,
    expenses,
    year,
    'combinado_sem_duplicar',
  );

  const totalRevenue = dre.receitaCaixa;
  const totalExpenses = dre.despesasOperacionais;
  const totalProfit = dre.resultadoLiquido;

  const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
  for (const name of MONTH_NAMES) {
    monthlyData[name] = { revenue: 0, expenses: 0 };
  }

  for (const r of caixaRevenues) {
    const part = datePart(r.date);
    if (!inYearPeriod(part, year)) continue;
    const month = MONTH_NAMES[new Date(part).getMonth()];
    if (!month) continue;
    const amt = revenueAmountForCompanyCaixa(r, revenues, expenses);
    if (amt === 0) continue;
    monthlyData[month].revenue += amt;
  }

  for (const e of caixaExpenses) {
    const part = datePart(e.date);
    if (!inYearPeriod(part, year)) continue;
    const month = MONTH_NAMES[new Date(part).getMonth()];
    if (!month) continue;
    const amt = expenseAmountForCompanyCaixa(e, revenues, expenses);
    if (amt === 0) continue;
    monthlyData[month].expenses += amt;
  }

  const monthlyChart = MONTH_NAMES.map((month) => ({
    month,
    Receita: monthlyData[month]?.revenue ?? 0,
    Despesa: monthlyData[month]?.expenses ?? 0,
  })).slice(0, new Date().getFullYear() === year ? new Date().getMonth() + 1 : 12);

  const allTransactions: Transaction[] = [
    ...caixaRevenues.map((r) => ({ ...r, type: 'revenue' as const })),
    ...caixaExpenses.map((e) => ({ ...e, type: 'expense' as const })),
  ];

  const recentTransactions = allTransactions
    .map((t) => {
      const net =
        t.type === 'revenue'
          ? revenueAmountForCompanyCaixa(t, revenues, expenses)
          : expenseAmountForCompanyCaixa(t, revenues, expenses);
      return { ...t, net };
    })
    .filter((t) => t.net !== 0)
    .sort((a, b) => safeDateTime(b.date) - safeDateTime(a.date))
    .slice(0, recentLimit)
    .map(({ net: _net, ...t }) => ({
      ...t,
      amount:
        t.type === 'revenue'
          ? revenueAmountForCompanyCaixa(t, revenues, expenses)
          : expenseAmountForCompanyCaixa(t, revenues, expenses),
    }));

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

  return {
    dre,
    totalRevenue,
    totalExpenses,
    totalProfit,
    monthlyChart,
    recentTransactions,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((a, i) => a + (Number(i.amount) || 0), 0),
    unpaidSoonCount: unpaidSoon.length,
  };
}
