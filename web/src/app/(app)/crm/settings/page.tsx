'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const CrmSettingsView = dynamic(
  () => import('./crm-settings-view').then((m) => ({ default: m.CrmSettingsView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Configurações do CRM" />
        <main className="flex-1 p-4 md:p-6 space-y-4 max-w-2xl">
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function CrmSettingsPage() {
  return <CrmSettingsView />;
}
