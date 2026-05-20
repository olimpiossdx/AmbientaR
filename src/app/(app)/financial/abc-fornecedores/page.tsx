'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Expense, Fornecedor } from '@/lib/types';
import { formatCurrencyBRL, datePart } from '@/lib/financial-core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const currentYear = new Date().getFullYear();

function classifyAbc(cumulativePct: number): 'A' | 'B' | 'C' {
  if (cumulativePct <= 80) return 'A';
  if (cumulativePct <= 95) return 'B';
  return 'C';
}

export default function AbcFornecedoresPage() {
  const [year, setYear] = useState(String(currentYear));
  const { firestore, user } = useFirebase();

  const expensesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'expenses') : null), [firestore, user]);
  const suppliersQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'fornecedores') : null), [firestore, user]);
  const { data: expenses } = useCollection<Expense>(expensesQ);
  const { data: suppliers } = useCollection<Fornecedor>(suppliersQ);

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

    const rows = [...map.values()].sort((a, b) => b.valor - a.valor);
    const total = rows.reduce((a, r) => a + r.valor, 0) || 1;
    let acc = 0;
    return rows.map((r) => {
      acc += (r.valor / total) * 100;
      return { ...r, pct: (r.valor / total) * 100, acc, classe: classifyAbc(acc) };
    });
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
        <Card>
          <CardHeader>
            <CardTitle>Despesas por fornecedor</CardTitle>
            <CardDescription>
              Vincule o fornecedor ao lançar despesas em Lançamentos de Caixa para análise precisa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Classe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((r) => (
                  <TableRow key={r.nome}>
                    <TableCell>{r.nome}</TableCell>
                    <TableCell className="text-right">{formatCurrencyBRL(r.valor)}</TableCell>
                    <TableCell className="text-right">{r.pct.toFixed(1)}%</TableCell>
                    <TableCell><Badge>{r.classe}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
