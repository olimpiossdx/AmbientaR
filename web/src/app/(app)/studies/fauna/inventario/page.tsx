'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const InventarioFaunaView = dynamic(
  () => import('./inventario-fauna-view').then((m) => ({ default: m.InventarioFaunaView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Inventário de Fauna Silvestre Terrestre" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function InventarioFaunaPage() {
  return <InventarioFaunaView />;
}
