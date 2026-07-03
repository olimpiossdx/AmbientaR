'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const ExternalView = dynamic(
  () => import('./external-view').then((m) => ({ default: m.ExternalView })),
  {
    ssr: false,
    loading: () => (
      <div className="external-embed-shell flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
        <PageHeader title="Carregando..." />
        <main className="external-embed-main min-w-0 flex-1 overflow-hidden p-4 md:p-6">
          <Skeleton className="h-full w-full" />
        </main>
      </div>
    ),
  },
);

export default function ExternalPage() {
  return <ExternalView />;
}
