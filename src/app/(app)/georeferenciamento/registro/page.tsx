'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const GeorefRegistroView = dynamic(
  () => import('./georef-registro-view').then((m) => ({ default: m.GeorefRegistroView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Cartório e registro de imóveis" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function GeorefRegistroPage() {
  return <GeorefRegistroView />;
}
