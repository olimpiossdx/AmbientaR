'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const AssistantView = dynamic(
  () => import('./assistant-view').then((m) => ({ default: m.AssistantView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Assistente de IA para estudos ambientais" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function AssistantPage() {
  return <AssistantView />;
}
