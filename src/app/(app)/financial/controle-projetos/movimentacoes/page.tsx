'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type {
  FinancialMovement,
  FinancialAllocation,
  Revenue,
  Expense,
  Invoice,
} from '@/lib/types';
import { buildCompanyTimeline } from '@/lib/financial-ledger';
import { formatCurrencyBRL, datePart } from '@/lib/financial-centers';
import { Skeleton } from '@/components/ui/skeleton';

const KIND_LABELS: Record<string, string> = {
  cash_in: 'Entrada caixa',
  cash_out: 'Saída caixa',
  invoice_paid: 'Fatura paga',
  allocation: 'Alocação',
  asset_sale_open: 'Abertura venda',
  asset_cost_out: 'Baixa ativo',
  asset_installment_in: 'Parcela recebida',
  asset_barter_in: 'Permuta',
  asset_settled: 'Quitação total',
};

export default function MovimentacoesPage() {
  const { firestore, user } = useFirebase();
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const movQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_movements') : null),
    [firestore, user],
  );
  const { data: movements, isLoading: loadMov } =
    useCollection<FinancialMovement>(movQ);

  const revQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'revenues') : null),
    [firestore, user],
  );
  const { data: revenues, isLoading: loadRev } = useCollection<Revenue>(revQ);

  const expQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'expenses') : null),
    [firestore, user],
  );
  const { data: expenses, isLoading: loadExp } = useCollection<Expense>(expQ);

  const invQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'invoices') : null),
    [firestore, user],
  );
  const { data: invoices, isLoading: loadInv } = useCollection<Invoice>(invQ);

  const allocQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_allocations') : null),
    [firestore, user],
  );
  const { data: allocations } = useCollection<FinancialAllocation>(allocQ);

  const timeline = useMemo(() => {
    return buildCompanyTimeline({
      movements: movements ?? [],
      revenues: revenues ?? [],
      expenses: expenses ?? [],
      invoices: invoices ?? [],
      allocations: allocations ?? [],
    });
  }, [movements, revenues, expenses, invoices, allocations]);

  const filtered = useMemo(() => {
    return timeline.filter((row) => {
      const d = row.date;
      if (filterFrom && d < filterFrom) return false;
      if (filterTo && d > filterTo) return false;
      return true;
    });
  }, [timeline, filterFrom, filterTo]);

  const isLoading = loadMov || loadRev || loadExp || loadInv;

  return (
    <>
      <PageHeader
        title="Movimentações"
        description="Histórico consolidado: caixa, faturas pagas e eventos do controlo por projeto."
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div>
            <Label>De</Label>
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Nenhuma movimentação no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 200).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{datePart(row.date) || row.date}</TableCell>
                      <TableCell>
                        {KIND_LABELS[row.kind] ?? row.kind}
                        {row.direction === 'in' ? ' ↑' : ' ↓'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{row.description}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          row.direction === 'in' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {row.direction === 'out' ? '−' : '+'}
                        {formatCurrencyBRL(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Exibindo até 200 registos. Fonte: lançamentos de caixa, faturas pagas e movimentos
            registados neste módulo.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

