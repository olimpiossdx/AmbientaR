'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const EditBemPatrimonioView = dynamic(
  () => import('./edit-bem-patrimonio-view').then((m) => ({ default: m.EditBemPatrimonioView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Editar bem patrimonial" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full max-w-3xl mx-auto rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function EditBemPatrimonioPage() {
  return <EditBemPatrimonioView />;
}
