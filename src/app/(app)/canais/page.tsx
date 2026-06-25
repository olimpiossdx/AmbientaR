'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const CanaisView = dynamic(
  () => import('./canais-view').then((m) => ({ default: m.CanaisView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Canais e Integrações" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-12 w-full max-w-2xl" />
          <div className="grid gap-4 md:grid-cols-3 max-w-4xl">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </main>
      </div>
    ),
  },
);

export default function CanaisPage() {
  return <CanaisView />;
}
