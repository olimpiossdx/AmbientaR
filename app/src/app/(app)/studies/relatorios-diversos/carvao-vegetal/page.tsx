'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const CarvaoVegetalView = dynamic(
  () => import('./carvao-vegetal-view').then((m) => ({ default: m.CarvaoVegetalView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Relatório de Performance da Produção de Carvão Vegetal" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function CharcoalReportPage() {
  return <CarvaoVegetalView />;
}
