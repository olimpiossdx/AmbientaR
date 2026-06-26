'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const PradaListView = dynamic(
  () => import('./prada-list-view').then((m) => ({ default: m.PradaListView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Planos de Recuperação de Áreas Degradadas (PRADA)" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    ),
  },
);

export default function PradaPage() {
  return <PradaListView />;
}
