'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const KnowledgeSourceDetailView = dynamic(
  () =>
    import('./knowledge-source-detail-view').then((m) => ({
      default: m.KnowledgeSourceDetailView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Fonte" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function KnowledgeSourceDetailPage() {
  return <KnowledgeSourceDetailView />;
}
