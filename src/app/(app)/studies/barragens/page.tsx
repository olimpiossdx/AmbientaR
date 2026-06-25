'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const BarragensHubView = dynamic(
  () => import('./barragens-hub-view').then((m) => ({ default: m.BarragensHubView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Projetos e Segurança de Barragens" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-48 w-full" />
        </main>
      </div>
    ),
  },
);

export default function BarragensHubPage() {
  return <BarragensHubView />;
}
