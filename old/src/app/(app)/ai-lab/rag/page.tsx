'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const AiLabRagView = dynamic(
  () => import('./ai-lab-rag-view').then((m) => ({ default: m.AiLabRagView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Base de Conhecimento (RAG)" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function AiLabRagPage() {
  return <AiLabRagView />;
}
