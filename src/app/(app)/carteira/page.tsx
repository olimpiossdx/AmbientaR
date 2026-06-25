'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const CarteiraView = dynamic(
  () => import('./carteira-view').then((m) => ({ default: m.CarteiraView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Carteira" />
        <main className="flex-1 p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function CarteiraPage() {
  return <CarteiraView />;
}
