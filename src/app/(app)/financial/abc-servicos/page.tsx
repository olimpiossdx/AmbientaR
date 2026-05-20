'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { CommercialProposal, Contract, Invoice } from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/financial-core';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const currentYear = new Date().getFullYear();

function classifyAbc(cumulativePct: number): 'A' | 'B' | 'C' {
  if (cumulativePct <= 80) return 'A';
  if (cumulativePct <= 95) return 'B';
  return 'C';
}

export default function AbcServicosPage() {
  const [year, setYear] = useState(String(currentYear));
  const { firestore, user } = useFirebase();

  const proposalsQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'commercialProposals') : null), [firestore, user]);
  const contractsQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'contracts') : null), [firestore, user]);
  const invoicesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'invoices') : null), [firestore, user]);

  const { data: proposals } = useCollection<CommercialProposal>(proposalsQ);
  const { data: contracts } = useCollection<Contract>(contractsQ);
  const { data: invoices } = useCollection<Invoice>(invoicesQ);

  const ranking = useMemo(() => {
    const y = Number(year);
    const map = new Map<string, number>();

    const inYear = (d: string) => d.startsWith(String(y));

    proposals
      ?.filter((p) => p.status === 'Accepted' && inYear(p.proposalDate?.slice(0, 10) || ''))
      .forEach((p) => {
        p.items?.forEach((item) => {
          const key = item.description?.trim() || 'Serviço sem descrição';
          map.set(key, (map.get(key) || 0) + (Number(item.value) || 0));
        });
      });

    contracts
      ?.filter((c) => c.status === 'Aprovado' && inYear(c.dataContrato?.slice(0, 10) || ''))
      .forEach((c) => {
        c.objeto?.itens?.forEach((item) => {
          const key = item.descricao?.trim() || 'Item contrato';
          map.set(key, (map.get(key) || 0) + (Number(item.valor) || 0));
        });
      });

    invoices
      ?.filter((i) => i.status === 'Paid' && inYear(i.invoiceDate?.slice(0, 10) || ''))
      .forEach((i) => {
        const key = `Fatura ${i.invoiceNumber}`;
        map.set(key, (map.get(key) || 0) + (Number(i.amount) || 0));
      });

    const rows = [...map.entries()]
      .map(([servico, valor]) => ({ servico, valor }))
      .sort((a, b) => b.valor - a.valor);
    const total = rows.reduce((a, r) => a + r.valor, 0) || 1;
    let acc = 0;
    return rows.map((r) => {
      acc += (r.valor / total) * 100;
      return { ...r, pct: (r.valor / total) * 100, acc, classe: classifyAbc(acc) };
    });
  }, [proposals, contracts, invoices, year]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Curva ABC — Serviços">
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
            <CardTitle>Ranking por linha de serviço</CardTitle>
            <CardDescription>Propostas aceitas, itens de contratos aprovados e faturas pagas no ano.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço / descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Classe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">Sem dados no período.</TableCell>
                  </TableRow>
                ) : (
                  ranking.map((r) => (
                    <TableRow key={r.servico}>
                      <TableCell>{r.servico}</TableCell>
                      <TableCell className="text-right">{formatCurrencyBRL(r.valor)}</TableCell>
                      <TableCell className="text-right">{r.pct.toFixed(1)}%</TableCell>
                      <TableCell><Badge>{r.classe}</Badge></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
