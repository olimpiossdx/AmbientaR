'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const ConsultoriaProjectDetailView = dynamic(
  () =>
    import('./consultoria-project-detail-view').then((m) => ({
      default: m.ConsultoriaProjectDetailView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Projeto de consultoria" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[480px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function ConsultoriaProjectDetailPage() {
  return <ConsultoriaProjectDetailView />;
}
