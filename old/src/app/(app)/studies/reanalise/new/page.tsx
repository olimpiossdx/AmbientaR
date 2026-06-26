'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const NewReanaliseView = dynamic(
  () => import('./new-reanalise-view').then((m) => ({ default: m.NewReanaliseView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova reanálise" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function NewReanalisePage() {
  return <NewReanaliseView />;
}
