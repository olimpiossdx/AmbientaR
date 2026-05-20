'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { BemPatrimonio, Expense, Invoice, Revenue } from '@/lib/types';
import { calculateDre, datePart } from '@/lib/financial-core';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const currentYear = new Date().getFullYear();

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportContabilPage() {
  const [year, setYear] = useState(String(currentYear));
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const invoicesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'invoices') : null), [firestore, user]);
  const revenuesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'revenues') : null), [firestore, user]);
  const expensesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'expenses') : null), [firestore, user]);
  const bensQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'bens_patrimonio') : null), [firestore, user]);

  const { data: invoices } = useCollection<Invoice>(invoicesQ);
  const { data: revenues } = useCollection<Revenue>(revenuesQ);
  const { data: expenses } = useCollection<Expense>(expensesQ);
  const { data: bens } = useCollection<BemPatrimonio>(bensQ);

  const y = Number(year);

  const exportDre = () => {
    if (!invoices || !revenues || !expenses) return;
    const dre = calculateDre(invoices, revenues, expenses, y, 'combinado_sem_duplicar');
    downloadCsv(`DRE_${year}.csv`, [
      ['Conta', 'Valor'],
      ['Receita bruta', String(dre.receitaBruta)],
      ['Receita faturas', String(dre.receitaFaturas)],
      ['Receita caixa avulsa', String(dre.receitaCaixaAvulsa)],
      ['Despesas operacionais', String(dre.despesasOperacionais)],
      ['Resultado líquido', String(dre.resultadoLiquido)],
    ]);
    toast({ title: 'DRE exportada' });
  };

  const exportLancamentos = () => {
    const rows: string[][] = [
      ['Tipo', 'Data', 'Valor', 'Descrição', 'Cliente/Fornecedor', 'Categoria', 'Centro custo'],
    ];
    revenues
      ?.filter((r) => datePart(r.date).startsWith(String(y)))
      .forEach((r) => {
        rows.push(['Receita', r.date, String(r.amount), r.description, r.clientId || '', '', r.centroCusto || '']);
      });
    expenses
      ?.filter((e) => datePart(e.date).startsWith(String(y)))
      .forEach((e) => {
        rows.push([
          'Despesa',
          e.date,
          String(e.amount),
          e.description,
          e.supplierId || '',
          e.category || '',
          e.centroCusto || '',
        ]);
      });
    downloadCsv(`lancamentos_caixa_${year}.csv`, rows);
    toast({ title: 'Lançamentos exportados' });
  };

  const exportPatrimonio = () => {
    const rows: string[][] = [
      ['Código', 'Descrição', 'Categoria', 'Data aquisição', 'Valor', 'Deprec. acumulada', 'Conta ativo'],
    ];
    bens?.forEach((b) => {
      rows.push([
        b.codigoPatrimonio || '',
        b.descricao,
        b.categoria,
        b.dataAquisicao,
        String(b.valorAquisicao),
        String(b.depreciacaoAcumulada ?? 0),
        b.contaContabilAtivo || '',
      ]);
    });
    downloadCsv(`patrimonio_${year}.csv`, rows);
    toast({ title: 'Patrimônio exportado' });
  };

  const exportFaturas = () => {
    const rows: string[][] = [
      ['Número', 'Cliente', 'Emissão', 'Vencimento', 'Valor', 'Status'],
    ];
    invoices
      ?.filter((i) => datePart(i.invoiceDate).startsWith(String(y)))
      .forEach((i) => {
        rows.push([
          i.invoiceNumber,
          i.clientId,
          i.invoiceDate,
          i.dueDate,
          String(i.amount),
          i.status,
        ]);
      });
    downloadCsv(`faturas_${year}.csv`, rows);
    toast({ title: 'Faturas exportadas' });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Exportação Contábil">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4].map((i) => {
              const yy = currentYear - i;
              return <SelectItem key={yy} value={String(yy)}>{yy}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Pacote para o contador</CardTitle>
            <CardDescription>Arquivos CSV (separador ; ) compatíveis com Excel.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportDre}>DRE resumida</Button>
            <Button variant="outline" onClick={exportLancamentos}>Lançamentos de caixa</Button>
            <Button variant="outline" onClick={exportFaturas}>Faturas</Button>
            <Button variant="outline" onClick={exportPatrimonio}>Bens e patrimônio</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
