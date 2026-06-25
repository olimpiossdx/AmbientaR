'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const GeorefProjectsPanel = dynamic(
  () =>
    import('@/components/georeferenciamento/georef-projects-panel').then((m) => ({
      default: m.GeorefProjectsPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Processos de georreferenciamento" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function GeorefProcessosPage() {
  return <GeorefProjectsPanel />;
}
