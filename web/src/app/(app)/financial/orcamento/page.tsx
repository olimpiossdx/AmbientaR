'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const OrcamentoView = dynamic(
  () => import('./orcamento-view').then((m) => ({ default: m.OrcamentoView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Orçamento Anual" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full max-w-lg rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function OrcamentoAnualPage() {
  return <OrcamentoView />;
}
