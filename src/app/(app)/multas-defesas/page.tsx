'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { MULTAS_E_DEFESAS_MENU_LABEL } from '@/lib/multas-defesas';

const MultasDefesasListView = dynamic(
  () =>
    import('./multas-defesas-list-view').then((m) => ({
      default: m.MultasDefesasListView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title={MULTAS_E_DEFESAS_MENU_LABEL} />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function MultasDefesasPage() {
  return <MultasDefesasListView />;
}
