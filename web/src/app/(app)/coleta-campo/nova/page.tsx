'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const NovaCampanhaView = dynamic(
  () => import('./nova-campanha-view').then((m) => ({ default: m.NovaCampanhaView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova campanha" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function NovaCampanhaPage() {
  return <NovaCampanhaView />;
}
