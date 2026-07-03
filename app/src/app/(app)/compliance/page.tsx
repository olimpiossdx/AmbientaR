'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const ComplianceView = dynamic(
  () => import('./compliance-view').then((m) => ({ default: m.ComplianceView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Gerenciamento de Condicionantes" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    ),
  },
);

export default function CompliancePage() {
  return <ComplianceView />;
}
