'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const GeorefAmbientalView = dynamic(
  () => import('./georef-ambiental-view').then((m) => ({ default: m.GeorefAmbientalView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="CAR — Cadastro Ambiental Rural" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    ),
  },
);

export default function GeorefAmbientalPage() {
  return <GeorefAmbientalView />;
}
