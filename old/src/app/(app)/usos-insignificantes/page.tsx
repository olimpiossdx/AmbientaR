'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const UsosInsignificantesView = dynamic(
  () => import('./usos-insignificantes-view').then((m) => ({ default: m.UsosInsignificantesView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Usos Insignificantes de Água" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function UsosInsignificantesPage() {
  return <UsosInsignificantesView />;
}
