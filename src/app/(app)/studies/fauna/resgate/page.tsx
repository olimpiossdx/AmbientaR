'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const ResgateFaunaView = dynamic(
  () => import('./resgate-fauna-view').then((m) => ({ default: m.ResgateFaunaView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Resgate e Destinação de Fauna Silvestre" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function ResgateFaunaPage() {
  return <ResgateFaunaView />;
}
