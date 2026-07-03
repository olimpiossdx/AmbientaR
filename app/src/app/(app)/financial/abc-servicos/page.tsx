'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const AbcServicosView = dynamic(
  () => import('./abc-servicos-view').then((m) => ({ default: m.AbcServicosView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Curva ABC — Serviços" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function AbcServicosPage() {
  return <AbcServicosView />;
}
