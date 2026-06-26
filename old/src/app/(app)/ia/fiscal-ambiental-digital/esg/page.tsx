'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const FadEsgClient = dynamic(
  () =>
    import('@/components/fiscal-ambiental/fad-esg-client').then((m) => ({
      default: m.FadEsgClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="ESG — Fiscal Ambiental Digital" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function FadEsgPage() {
  return <FadEsgClient />;
}
