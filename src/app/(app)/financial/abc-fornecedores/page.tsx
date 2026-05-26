'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Expense, Fornecedor } from '@/lib/types';
import { datePart } from '@/lib/financial-core';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AbcAnalysisView } from '@/components/financial/abc-analysis-view';
import { computeAbcRanking } from '@/lib/abc-analysis';

const currentYear = new Date().getFullYear();

export default function AbcFornecedoresPage() {
  const [year, setYear] = useState(String(currentYear));
  const { firestore, user } = useFirebase();

  const expensesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'expenses') : null), [firestore, user]);
  const suppliersQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'fornecedores') : null), [firestore, user]);
  const { data: expenses, isLoading: loadingExpenses } = useCollection<Expense>(expensesQ);
  const { data: suppliers, isLoading: loadingSuppliers } = useCollection<Fornecedor>(suppliersQ);

  const isLoading = loadingExpenses || loadingSuppliers;

  const ranking = useMemo(() => {
    const y = Number(year);
    const map = new Map<string, { nome: string; valor: number }>();

    expenses
      ?.filter((e) => datePart(e.date).startsWith(String(y)))
      .forEach((e) => {
        const id = e.supplierId || '_sem_fornecedor';
        const nome =
          suppliers?.find((s) => s.id === e.supplierId)?.name ||
          (id === '_sem_fornecedor' ? 'Sem fornecedor vinculado' : id);
        const cur = map.get(id) || { nome, valor: 0 };
        cur.valor += Number(e.amount) || 0;
        map.set(id, cur);
      });

    return computeAbcRanking(
      [...map.entries()].map(([id, { nome, valor }]) => ({
        id,
        label: nome,
        valor,
      }))
    );
  }, [expenses, suppliers, year]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Curva ABC — Fornecedores">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4].map((i) => {
              const y = currentYear - i;
              return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <AbcAnalysisView
          title="Despesas por fornecedor"
          description="Vincule o fornecedor ao lançar despesas em Lançamentos de Caixa para análise precisa."
          rows={ranking}
          valueColumnLabel="Despesas"
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
