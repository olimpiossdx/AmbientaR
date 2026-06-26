'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const GeorefUrbanoView = dynamic(
  () => import('./georef-urbano-view').then((m) => ({ default: m.GeorefUrbanoView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Lote urbano — memorial e registro" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function GeorefUrbanoPage() {
  return <GeorefUrbanoView />;
}
