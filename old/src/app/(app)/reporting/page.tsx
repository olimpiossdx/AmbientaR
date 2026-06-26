'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const ReportingView = dynamic(
  () => import('./reporting-view').then((m) => ({ default: m.ReportingView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Relatórios Gerados por IA" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function ReportingPage() {
  return <ReportingView />;
}
