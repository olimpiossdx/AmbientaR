'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const ResgateRelatorioFaunaView = dynamic(
  () =>
    import('./resgate-relatorio-fauna-view').then((m) => ({
      default: m.ResgateRelatorioFaunaView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Relatório de Resgate de Fauna" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function ResgateRelatorioFaunaPage() {
  return <ResgateRelatorioFaunaView />;
}
