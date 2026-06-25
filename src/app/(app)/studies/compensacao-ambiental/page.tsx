'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const CompensacaoAmbientalHubView = dynamic(
  () =>
    import('./compensacao-ambiental-hub-view').then((m) => ({
      default: m.CompensacaoAmbientalHubView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Compensação Ambiental" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-48 w-full" />
        </main>
      </div>
    ),
  },
);

export default function CompensacaoAmbientalHubPage() {
  return <CompensacaoAmbientalHubView />;
}
