'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const EditPiaView = dynamic(
  () => import('./edit-pia-view').then((m) => ({ default: m.EditPiaView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Editando PIA" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function EditPiaPage() {
  return <EditPiaView />;
}
