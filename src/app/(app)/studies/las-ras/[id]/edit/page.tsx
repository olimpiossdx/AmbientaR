'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const EditLasRasView = dynamic(
  () => import('./edit-las-ras-view').then((m) => ({ default: m.EditLasRasView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Editar LAS/RAS" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full max-w-4xl mx-auto rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function EditLasRasPage() {
  return <EditLasRasView />;
}
