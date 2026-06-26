'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const AiLabMcpView = dynamic(
  () => import('./ai-lab-mcp-view').then((m) => ({ default: m.AiLabMcpView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="MCP & Ferramentas" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function AiLabMcpPage() {
  return <AiLabMcpView />;
}
