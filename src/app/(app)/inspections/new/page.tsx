'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const NewInspectionView = dynamic(
  () => import('./new-inspection-view').then((m) => ({ default: m.NewInspectionView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova Vistoria" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full max-w-4xl mx-auto rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function NewInspectionPage() {
  return <NewInspectionView />;
}
