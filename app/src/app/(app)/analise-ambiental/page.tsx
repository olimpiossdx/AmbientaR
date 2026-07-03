'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const AnaliseAmbientalView = dynamic(
  () => import('./analise-ambiental-view').then((m) => ({ default: m.AnaliseAmbientalView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Análise Geoespacial (IA)" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-[680px] w-full" />
        </main>
      </div>
    ),
  },
);

export default function AnaliseAmbientalPage() {
  return <AnaliseAmbientalView />;
}
