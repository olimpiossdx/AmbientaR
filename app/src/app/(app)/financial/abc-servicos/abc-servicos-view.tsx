'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { CommercialProposal, Contract, Invoice } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { AbcAnalysisViewProps } from '@/components/financial/abc-analysis-view';
import { computeAbcRanking } from '@/lib/abc-analysis';

const AbcAnalysisView = dynamic<AbcAnalysisViewProps>(
  () => import('@/components/financial/abc-analysis-view').then((m) => ({ default: m.AbcAnalysisView })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[640px] w-full rounded-lg" />,
  },
);

const currentYear = new Date().getFullYear();

export function AbcServicosView() {
  const [year, setYear] = useState(String(currentYear));
  const { firestore, user } = useFirebase();

  const proposalsQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'commercialProposals') : null), [firestore, user]);
  const contractsQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'contracts') : null), [firestore, user]);
  const invoicesQ = useMemoFirebase(() => (firestore && user ? collection(firestore, 'invoices') : null), [firestore, user]);

  const { data: proposals, isLoading: loadingProposals } = useCollection<CommercialProposal>(proposalsQ);
  const { data: contracts, isLoading: loadingContracts } = useCollection<Contract>(contractsQ);
  const { data: invoices, isLoading: loadingInvoices } = useCollection<Invoice>(invoicesQ);

  const isLoading = loadingProposals || loadingContracts || loadingInvoices;

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

    return computeAbcRanking(
      [...map.entries()].map(([label, valor]) => ({
        id: label,
        label,
        valor,
      }))
    );
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
        <AbcAnalysisView
          title="Ranking por linha de serviço"
          description="Propostas aceitas, itens de contratos aprovados e faturas pagas no ano."
          rows={ranking}
          valueColumnLabel="Valor"
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
