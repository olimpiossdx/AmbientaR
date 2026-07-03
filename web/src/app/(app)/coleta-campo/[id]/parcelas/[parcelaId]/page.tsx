'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const ParcelaDetailView = dynamic(
  () => import('./parcela-detail-view').then((m) => ({ default: m.ParcelaDetailView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Parcela" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    ),
  },
);

export default function ColetaParcelaPage() {
  return <ParcelaDetailView />;
}
