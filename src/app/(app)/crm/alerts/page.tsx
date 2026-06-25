'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const CrmAlertsView = dynamic(
  () => import('./crm-alerts-view').then((m) => ({ default: m.CrmAlertsView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Alertas & Notificações (CRM)" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function CrmAlertsPage() {
  return <CrmAlertsView />;
}
