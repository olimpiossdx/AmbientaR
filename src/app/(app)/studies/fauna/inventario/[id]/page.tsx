'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const EditInventarioFaunaView = dynamic(
  () => import('./edit-inventario-fauna-view').then((m) => ({ default: m.EditInventarioFaunaView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Editar Projeto de Inventário de Fauna" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function EditInventarioFaunaPage() {
  return <EditInventarioFaunaView />;
}
