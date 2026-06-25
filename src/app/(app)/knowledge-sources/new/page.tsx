'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const NewKnowledgeSourceView = dynamic(
  () =>
    import('./new-knowledge-source-view').then((m) => ({
      default: m.NewKnowledgeSourceView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Nova fonte de conhecimento (manual)" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full max-w-2xl rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function NewKnowledgeSourcePage() {
  return <NewKnowledgeSourceView />;
}
