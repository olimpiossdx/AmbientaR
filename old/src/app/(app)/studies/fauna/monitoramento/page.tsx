'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const MonitoramentoFaunaView = dynamic(
  () => import('./monitoramento-fauna-view').then((m) => ({ default: m.MonitoramentoFaunaView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Monitoramento de Fauna Silvestre Terrestre" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function MonitoramentoFaunaPage() {
  return <MonitoramentoFaunaView />;
}
