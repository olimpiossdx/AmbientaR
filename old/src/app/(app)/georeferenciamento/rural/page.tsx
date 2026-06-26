'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const GeorefRuralView = dynamic(
  () => import('./georef-rural-view').then((m) => ({ default: m.GeorefRuralView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Imóvel rural — SIGEF / INCRA" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function GeorefRuralPage() {
  return <GeorefRuralView />;
}
