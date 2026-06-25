'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const EditCashFlowView = dynamic(
  () => import('./edit-cash-flow-view').then((m) => ({ default: m.EditCashFlowView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Carregando lançamento..." />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full max-w-2xl mx-auto rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function EditTransactionPage() {
  return <EditCashFlowView />;
}
