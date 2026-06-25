'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const EditMonitoramentoFaunaView = dynamic(
  () =>
    import('./edit-monitoramento-fauna-view').then((m) => ({
      default: m.EditMonitoramentoFaunaView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Editar Projeto de Monitoramento de Fauna" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function EditMonitoramentoFaunaPage() {
  return <EditMonitoramentoFaunaView />;
}
