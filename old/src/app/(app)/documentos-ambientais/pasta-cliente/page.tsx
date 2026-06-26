'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const PastaClienteView = dynamic(
  () => import('./pasta-cliente-view').then((m) => ({ default: m.PastaClienteView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Pasta do cliente" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full max-w-3xl rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function PastaClientePage() {
  return <PastaClienteView />;
}
