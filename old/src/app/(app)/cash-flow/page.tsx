'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const CashFlowDashboardView = dynamic(
  () => import('./cash-flow-dashboard-view').then((m) => ({ default: m.CashFlowDashboardView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Fluxo de Caixa" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    ),
  },
);

export default function CashFlowPage() {
  return <CashFlowDashboardView />;
}
