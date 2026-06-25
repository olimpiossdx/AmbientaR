'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const PtrfListView = dynamic(
  () => import('./ptrf-list-view').then((m) => ({ default: m.PtrfListView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Projetos Técnicos de Recomposição de Flora (PTRF)" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    ),
  },
);

export default function PtrfPage() {
  return <PtrfListView />;
}
