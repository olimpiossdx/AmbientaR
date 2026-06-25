'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const CrmHubView = dynamic(
  () => import('./crm-hub-view').then((m) => ({ default: m.CrmHubView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="CRM" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function CrmPage() {
  return <CrmHubView />;
}
