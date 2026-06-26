'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const FadMonitoramentoClient = dynamic(
  () =>
    import('@/components/fiscal-ambiental/fad-monitoramento-client').then((m) => ({
      default: m.FadMonitoramentoClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Monitoramento — Fiscal Ambiental Digital" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function FadMonitoramentoPage() {
  return <FadMonitoramentoClient />;
}
