'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const FadDashboardClient = dynamic(
  () =>
    import('@/components/fiscal-ambiental/fad-dashboard-client').then((m) => ({
      default: m.FadDashboardClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Fiscal Ambiental Digital" />
        <main className="flex-1 p-4 md:p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[420px] w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function FadDashboardPage() {
  return <FadDashboardClient />;
}
