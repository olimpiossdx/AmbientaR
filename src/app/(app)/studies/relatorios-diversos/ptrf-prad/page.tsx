'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const PtrfPradView = dynamic(
  () => import('./ptrf-prad-view').then((m) => ({ default: m.PtrfPradView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Relatório Pericial de Acompanhamento PRAD/PTFR" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function PtrfPradReportPage() {
  return <PtrfPradView />;
}
