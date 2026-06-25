'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Expense, Revenue } from '@/lib/types';
import { formatCurrencyBRL, datePart } from '@/lib/financial-core';
import {
  filterCompanyCaixaExpenses,
  filterCompanyCaixaRevenues,
} from '@/lib/financial-transaction-scope';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type BankLine = {
  date: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
};

function parseCsvBank(text: string): BankLine[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const out: BankLine[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 3) continue;
    const dateRaw = cols[0];
    const part = dateRaw.includes('/') ? dateRaw.split('/').reverse().join('-') : dateRaw.slice(0, 10);
    const amount = Math.abs(parseFloat(cols[1]?.replace(/\./g, '').replace(',', '.') || '0'));
    const desc = cols.slice(2).join(' ') || 'Lançamento importado';
    const signed = parseFloat(cols[1]?.replace(/\./g, '').replace(',', '.') || '0');
    out.push({
      date: part.length === 10 ? part : new Date().toISOString().slice(0, 10),
      amount,
      description: desc,
      type: signed >= 0 ? 'credit' : 'debit',
    });
  }
  return out;
}

export function ConciliacaoView() {
  const [csvText, setCsvText] = useState('');
  const [bankLines, setBankLines] = useState<BankLine[]>([]);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const revenuesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'revenues') : null), [firestore, user]);
  const expensesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'expenses') : null), [firestore, user]);
  const { data: revenues } = useCollection<Revenue>(revenuesQ);
  const { data: expenses } = useCollection<Expense>(expensesQ);

  const matches = useMemo(() => {
    if (!bankLines.length) return [];
    return bankLines.map((bl, idx) => {
      const pool =
        bl.type === 'credit'
          ? filterCompanyCaixaRevenues(revenues || [], expenses || [])
          : filterCompanyCaixaExpenses(expenses || [], revenues || []);
      const match = pool.find((t) => {
        const amt = Math.abs(Number(t.amount) - bl.amount) < 0.02;
        const dt = datePart(t.date) === datePart(bl.date);
        return amt && dt;
      });
      return { idx, bl, match, collection: bl.type === 'credit' ? 'revenues' : 'expenses' };
    });
  }, [bankLines, revenues, expenses]);

  const handleParse = () => {
    const parsed = parseCsvBank(csvText);
    if (!parsed.length) {
      toast({ variant: 'destructive', title: 'CSV inválido', description: 'Use: data;valor;descrição (cabeçalho na 1ª linha)' });
      return;
    }
    setBankLines(parsed);
    toast({ title: `${parsed.length} linhas importadas` });
  };

  const markReconciled = async (collectionName: 'revenues' | 'expenses', id: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, collectionName, id), {
        reconciledAt: new Date().toISOString(),
      });
      toast({ title: 'Marcado como conciliado' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao conciliar',
        description: 'Não foi possível atualizar o lançamento. Verifique permissões e conexão.',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Conciliação Bancária (CSV)" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Importar extrato</CardTitle>
            <CardDescription>
              Cole um CSV com colunas: <strong>data;valor;descrição</strong> (valor negativo = saída).
              O sistema sugere correspondência com lançamentos de caixa pela data e valor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full min-h-[120px] rounded-md border p-3 font-mono text-sm"
              placeholder="data;valor;descrição&#10;20/05/2026;1500,00;PIX Cliente X"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <Button type="button" onClick={handleParse}>Analisar extrato</Button>
          </CardContent>
        </Card>

        {matches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da conciliação</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Extrato</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map(({ bl, match, collection: col }) => (
                    <TableRow key={`${bl.date}-${bl.amount}-${bl.description}`}>
                      <TableCell className="max-w-[200px] truncate">{bl.description}</TableCell>
                      <TableCell>{formatCurrencyBRL(bl.amount)}</TableCell>
                      <TableCell>
                        {match ? (
                          <Badge variant="default">Encontrado no caixa</Badge>
                        ) : (
                          <Badge variant="secondary">Sem correspondência</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {match && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void markReconciled(col as 'revenues' | 'expenses', match.id)}
                          >
                            Marcar conciliado
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
