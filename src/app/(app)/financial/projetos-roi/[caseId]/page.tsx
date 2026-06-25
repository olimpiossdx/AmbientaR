'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const ProjetosRoiDetailView = dynamic(
  () =>
    import('./projetos-roi-detail-view').then((m) => ({
      default: m.ProjetosRoiDetailView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Projetos & ROI" description="Detalhe do caso" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function ProjetosRoiDetailPage() {
  return <ProjetosRoiDetailView />;
}
