'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const EditPtrfView = dynamic(
  () => import('./edit-ptrf-view').then((m) => ({ default: m.EditPtrfView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Editando PTRF" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function EditPtrfPage() {
  return <EditPtrfView />;
}
