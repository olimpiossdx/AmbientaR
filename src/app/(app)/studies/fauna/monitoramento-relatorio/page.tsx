'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const MonitoramentoRelatorioFaunaView = dynamic(
  () =>
    import('./monitoramento-relatorio-fauna-view').then((m) => ({
      default: m.MonitoramentoRelatorioFaunaView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Relatório de Monitoramento de Fauna" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function MonitoramentoRelatorioFaunaPage() {
  return <MonitoramentoRelatorioFaunaView />;
}
