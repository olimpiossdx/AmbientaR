'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { LICENCIAMENTO_MENU_LABEL } from '@/lib/licenciamento-menu';

const RequestsListView = dynamic(
  () => import('./requests-list-view').then((m) => ({ default: m.RequestsListView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title={LICENCIAMENTO_MENU_LABEL} />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function RequestsPage() {
  return <RequestsListView />;
}
