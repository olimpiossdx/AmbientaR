'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const EditPcaView = dynamic(
  () => import('./edit-pca-view').then((m) => ({ default: m.EditPcaView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Editar Plano de Controle Ambiental" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full max-w-4xl mx-auto rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function EditPcaPage() {
  return <EditPcaView />;
}
