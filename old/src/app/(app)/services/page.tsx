'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const ServicesListView = dynamic(
  () => import('./services-list-view').then((m) => ({ default: m.ServicesListView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Tabela de Serviços" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function ServicesPage() {
  return <ServicesListView />;
}
