'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const KnowledgeSourcesListView = dynamic(
  () =>
    import('./knowledge-sources-list-view').then((m) => ({
      default: m.KnowledgeSourcesListView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Base Jurídica / Fontes de Conhecimento" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function KnowledgeSourcesPage() {
  return <KnowledgeSourcesListView />;
}
