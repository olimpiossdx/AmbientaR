'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const NewPiaView = dynamic(
  () => import('./new-pia-view').then((m) => ({ default: m.NewPiaView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Novo Plano de Intervenção Ambiental" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function NewPiaPage() {
  return <NewPiaView />;
}
