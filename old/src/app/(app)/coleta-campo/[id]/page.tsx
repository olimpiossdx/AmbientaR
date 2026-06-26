'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const CampanhaDetailView = dynamic(
  () => import('./campanha-detail-view').then((m) => ({ default: m.CampanhaDetailView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Campanha" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    ),
  },
);

export default function CampanhaDetailPage() {
  return <CampanhaDetailView />;
}
