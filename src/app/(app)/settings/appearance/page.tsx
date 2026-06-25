'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const AppearanceView = dynamic(
  () => import('./appearance-view').then((m) => ({ default: m.AppearanceView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Aparência" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-64 w-full max-w-2xl mx-auto rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function AppearancePage() {
  return <AppearanceView />;
}
