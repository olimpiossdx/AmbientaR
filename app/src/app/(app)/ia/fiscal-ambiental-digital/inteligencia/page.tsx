'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';

const FadIntelligenceClient = dynamic(
  () =>
    import('@/components/fiscal-ambiental/fad-intelligence-client').then((m) => ({
      default: m.FadIntelligenceClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-full">
        <PageHeader title="Inteligência — Fiscal Ambiental Digital" />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    ),
  },
);

export default function FadIntelligencePage() {
  return <FadIntelligenceClient />;
}
