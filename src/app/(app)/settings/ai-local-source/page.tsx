'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const AiLocalSourceSettingsView = dynamic(
  () => import('./ai-local-source-view').then((m) => ({ default: m.AiLocalSourceSettingsView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Pasta Base IA (Local)" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function AiLocalSourceSettingsPage() {
  return <AiLocalSourceSettingsView />;
}
