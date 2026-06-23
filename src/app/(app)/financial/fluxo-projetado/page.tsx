'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Expense, Invoice, Revenue } from '@/lib/types';
import { formatCurrencyBRL, datePart } from '@/lib/financial-core';
import {
  expenseAmountForCompanyCaixa,
  filterCompanyCaixaExpenses,
  filterCompanyCaixaRevenues,
  isProjectRoiOnlyTransaction,
  revenueAmountForCompanyCaixa,
} from '@/lib/financial-transaction-scope';
import { Skeleton } from '@/components/ui/skeleton';
import type { FluxoProjetadoChartProps } from '@/app/(app)/financial/fluxo-projetado/fluxo-projetado-chart';

const FluxoProjetadoChart = dynamic<FluxoProjetadoChartProps>(
  () => import('@/app/(app)/financial/fluxo-projetado/fluxo-projetado-chart'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full rounded-lg" />,
  },
);

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function FluxoProjetadoPage() {
  const { firestore, user } = useFirebase();
  const invoicesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'invoices') : null), [firestore, user]);
  const revenuesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'revenues') : null), [firestore, user]);
  const expensesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'expenses') : null), [firestore, user]);

  const { data: invoices, isLoading: li } = useCollection<Invoice>(invoicesQ);
  const { data: revenues, isLoading: lr } = useCollection<Revenue>(revenuesQ);
  const { data: expenses, isLoading: le } = useCollection<Expense>(expensesQ);

  const projection = useMemo(() => {
    const allRev = revenues || [];
    const allExp = expenses || [];
    const caixaRevenues = filterCompanyCaixaRevenues(allRev);
    const caixaExpenses = filterCompanyCaixaExpenses(allExp);

    const today = new Date().toISOString().slice(0, 10);
    const d30 = addDays(today, 30);
    const d60 = addDays(today, 60);
    const d90 = addDays(today, 90);

    const buckets = [
      { label: '0–30 dias', end: d30, entradas: 0, saidas: 0 },
      { label: '31–60 dias', end: d60, entradas: 0, saidas: 0 },
      { label: '61–90 dias', end: d90, entradas: 0, saidas: 0 },
    ];

    const assign = (date: string, amount: number, isIn: boolean) => {
      const part = datePart(date);
      if (!part || part < today) return;
      for (const b of buckets) {
        if (part <= b.end) {
          if (isIn) b.entradas += amount;
          else b.saidas += amount;
          return;
        }
      }
    };

    invoices
      ?.filter(
        (i) =>
          (i.status === 'Unpaid' || i.status === 'Overdue') &&
          !isProjectRoiOnlyTransaction(i),
      )
      .forEach((i) => assign(i.dueDate, Number(i.amount) || 0, true));

    caixaRevenues.forEach((r) => {
      if (!r.invoiceId) {
        assign(
          r.date,
          revenueAmountForCompanyCaixa(r, allRev, allExp),
          true,
        );
      }
    });

    caixaExpenses.forEach((e) => {
      assign(
        e.date,
        expenseAmountForCompanyCaixa(e, allRev, allExp),
        false,
      );
    });

    return buckets.map((b) => ({
      periodo: b.label,
      Entradas: b.entradas,
      Saídas: b.saidas,
      Saldo: b.entradas - b.saidas,
    }));
  }, [invoices, revenues, expenses]);

  const totals = useMemo(() => {
    const ent = projection.reduce((a, p) => a + p.Entradas, 0);
    const sai = projection.reduce((a, p) => a + p.Saídas, 0);
    return { ent, sai, saldo: ent - sai };
  }, [projection]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Fluxo de Caixa Projetado" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximos 90 dias</CardTitle>
            <CardDescription>
              Entradas: faturas pendentes/atrasadas (por vencimento) e receitas de caixa futuras sem fatura.
              Saídas: despesas já lançadas com data futura.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {li || lr || le ? (
              <Skeleton className="h-64" />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Entradas previstas</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrencyBRL(totals.ent)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saídas previstas</p>
                    <p className="text-lg font-semibold text-red-600">{formatCurrencyBRL(totals.sai)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo projetado</p>
                    <p className="text-lg font-bold">{formatCurrencyBRL(totals.saldo)}</p>
                  </div>
                </div>
                <FluxoProjetadoChart projection={projection} />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
