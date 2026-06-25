'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const CarListView = dynamic(
  () => import('./car-list-view').then((m) => ({ default: m.CarListView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Cadastro Ambiental Rural (CAR)" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[480px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function CarPage() {
  return <CarListView />;
}
