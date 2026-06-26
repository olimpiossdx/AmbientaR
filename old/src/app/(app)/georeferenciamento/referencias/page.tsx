'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const GeorefReferenciasView = dynamic(
  () => import('./georef-referencias-view').then((m) => ({ default: m.GeorefReferenciasView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Referências normativas" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    ),
  },
);

export default function GeorefReferenciasPage() {
  return <GeorefReferenciasView />;
}
